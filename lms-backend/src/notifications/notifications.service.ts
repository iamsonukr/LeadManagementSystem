import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Notification, NotificationDocument } from './notifications.entity';
import { NotificationFilterDto } from './notifications.dto';
import { FollowUp, FollowUpDocument } from '../followups/followups.entity';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { User, UserDocument } from '../users/user.entity';
import {
  AssignmentKey,
  buildAssignedToMatch,
  RequestUser,
  userAssignmentIds,
  userAssignmentKeys,
} from '../auth/roles';

export const NOTIFICATION_TYPES = {
  LEAD_ASSIGNED: 'lead_assigned',
  PROJECT_ASSIGNED: 'project_assigned',
  UPCOMING_FOLLOW_UP: 'upcoming_follow_up',
  OVERDUE_FOLLOW_UP: 'overdue_follow_up',
} as const;

type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];

type NotificationInput = {
  type: NotificationType;
  title: string;
  message: string;
  relatedId: string;
};

type LeadLike = {
  _id?: unknown;
  id?: unknown;
  name?: string;
  company?: string;
  assignedTo?: unknown;
};

type FollowUpLike = {
  _id?: unknown;
  id?: unknown;
  lead?: unknown;
  owner?: string;
  dueAt?: Date | string;
};

type ProjectLike = {
  _id?: unknown;
  id?: unknown;
  name?: string;
  owner?: string;
  lead?: unknown;
};

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(FollowUp.name)
    private readonly followUpModel: Model<FollowUpDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  async findAll(query: NotificationFilterDto, user: RequestUser) {
    const page = Number(query.page ?? 1);
    const limit = Math.min(Number(query.limit ?? 20), 100);
    const skip = (page - 1) * limit;
    const filter: Record<string, unknown> = { user: user.id };

    if (query.isRead !== undefined) {
      filter.isRead = query.isRead;
    }

    const [data, total, unread] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
      this.notificationModel.countDocuments({ user: user.id, isRead: false }),
    ]);

    return {
      data,
      total,
      unread,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async unreadCount(user: RequestUser) {
    return {
      unread: await this.notificationModel.countDocuments({
        user: user.id,
        isRead: false,
      }),
    };
  }

  async markAsRead(id: string, user: RequestUser) {
    this.assertObjectId(id, 'notification');

    const notification = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), user: user.id },
        { $set: { isRead: true } },
        { new: true },
      )
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return notification;
  }

  async markAllAsRead(user: RequestUser) {
    const result = await this.notificationModel.updateMany(
      { user: user.id, isRead: false },
      { $set: { isRead: true } },
    );

    return {
      modifiedCount: result.modifiedCount,
    };
  }

  async createForUser(
    userId: string | undefined | null,
    input: NotificationInput,
    dedupe = false,
  ) {
    const normalizedUserId = String(userId ?? '').trim();
    if (!normalizedUserId) {
      return null;
    }

    const payload = {
      user: normalizedUserId,
      type: input.type,
      title: input.title,
      message: input.message,
      relatedId: input.relatedId,
      isRead: false,
    };

    if (!dedupe) {
      return this.notificationModel.create(payload);
    }

    const existing = await this.notificationModel.findOne({
      user: normalizedUserId,
      type: input.type,
      relatedId: input.relatedId,
    });

    if (existing) {
      existing.title = input.title;
      existing.message = input.message;
      await existing.save();
      return existing;
    }

    return this.notificationModel.create(payload);
  }

  async createLeadAssignmentNotification(lead: LeadLike) {
    const leadId = this.getId(lead);
    if (!leadId || !lead.assignedTo) {
      return null;
    }

    return this.createForAssignee(lead.assignedTo, {
      type: NOTIFICATION_TYPES.LEAD_ASSIGNED,
      title: 'Lead assigned',
      message: `${lead.name ?? 'A lead'}${lead.company ? ` from ${lead.company}` : ''} has been assigned to you.`,
      relatedId: leadId,
    });
  }

  async createProjectAssignmentNotification(
    project: ProjectLike,
    leadOverride?: LeadLike | null,
  ) {
    const projectId = this.getId(project);
    if (!projectId) {
      return null;
    }

    const lead = leadOverride ?? this.asRecord(project.lead);
    const assignee = project.owner || lead?.assignedTo;

    if (!assignee) {
      return null;
    }

    const projectName =
      project.name ||
      lead?.name ||
      (lead?.company ? `${lead.company} project` : 'A project');

    return this.createForAssignee(assignee, {
      type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
      title: 'Project assigned',
      message: `${projectName} has been assigned to you.`,
      relatedId: projectId,
    });
  }

  async createFollowUpNotification(
    followup: FollowUpLike,
    leadOverride?: LeadLike | null,
  ) {
    const followUpId = this.getId(followup);
    if (!followUpId) {
      return null;
    }

    const lead = leadOverride ?? (await this.getLeadForFollowUp(followup));
    const assignee = followup.owner || lead?.assignedTo;
    if (!assignee) {
      return null;
    }

    const input = this.buildFollowUpNotification(followup, followUpId, lead);
    return this.createForAssignee(assignee, input, true);
  }

  async checkReminders(user: RequestUser) {
    const now = new Date();
    const upcomingUntil = new Date(
      now.getTime() + this.getReminderLookaheadHours() * 60 * 60 * 1000,
    );
    const assignmentKeys: AssignmentKey[] = [
      ...userAssignmentIds(user),
      ...userAssignmentKeys(user),
    ];
    const ownerKeys = assignmentKeys
      .map((key) => String(key).trim())
      .filter(Boolean);
    const leads = await this.leadModel
      .find(buildAssignedToMatch(assignmentKeys))
      .select('_id')
      .lean();
    const leadIds = leads.map((lead) => lead._id);
    const scopeClauses: Record<string, unknown>[] = [];

    if (ownerKeys.length) {
      scopeClauses.push({ owner: { $in: ownerKeys } });
    }

    if (leadIds.length) {
      scopeClauses.push({ lead: { $in: leadIds } });
    }

    if (!scopeClauses.length) {
      return [];
    }

    const scope = { $or: scopeClauses };

    await this.followUpModel.updateMany(
      {
        ...scope,
        status: 'Pending',
        dueAt: { $lt: now },
      },
      { $set: { status: 'Overdue' } },
    );

    const followups = await this.followUpModel
      .find({
        ...scope,
        status: { $ne: 'Completed' },
        dueAt: { $lte: upcomingUntil },
      })
      .populate('lead')
      .sort({ dueAt: 1 })
      .limit(50);

    const notifications = await Promise.all(
      followups.map((followup) =>
        this.createForUser(
          user.id,
          this.buildFollowUpNotification(
            followup,
            this.getId(followup),
            this.asRecord(followup.lead),
          ),
          true,
        ),
      ),
    );

    return notifications.filter(Boolean);
  }

  private async createForAssignee(
    assignee: unknown,
    input: NotificationInput,
    dedupe = false,
  ) {
    const userId = await this.resolveUserId(assignee);
    return this.createForUser(userId, input, dedupe);
  }

  private async resolveUserId(assignee: unknown) {
    if (!assignee) {
      return null;
    }

    if (assignee instanceof Types.ObjectId) {
      return assignee.toString();
    }

    if (typeof assignee === 'object') {
      return this.getId(assignee) || null;
    }

    if (typeof assignee !== 'string' && typeof assignee !== 'number') {
      return null;
    }

    const raw = String(assignee).trim();
    if (!raw) {
      return null;
    }

    if (Types.ObjectId.isValid(raw)) {
      return raw;
    }

    const normalized = raw.toLowerCase();
    const user = await this.userModel
      .findOne({
        $or: [
          { email: normalized },
          { employeeId: raw },
          {
            $expr: {
              $eq: [
                {
                  $toLower: {
                    $concat: ['$firstName', ' ', '$lastName'],
                  },
                },
                normalized,
              ],
            },
          },
        ],
      })
      .select('_id')
      .lean();

    return user ? String(user._id) : null;
  }

  private buildFollowUpNotification(
    followup: FollowUpLike,
    followUpId: string,
    lead?: LeadLike | null,
  ): NotificationInput {
    const dueAt = new Date(followup.dueAt ?? Date.now());
    const isOverdue = dueAt.getTime() < Date.now();
    const leadLabel = lead?.name || lead?.company || 'a lead';

    return {
      type: isOverdue
        ? NOTIFICATION_TYPES.OVERDUE_FOLLOW_UP
        : NOTIFICATION_TYPES.UPCOMING_FOLLOW_UP,
      title: isOverdue ? 'Overdue follow-up' : 'Upcoming follow-up',
      message: `${isOverdue ? 'Follow-up is overdue' : 'Follow-up is coming up'} for ${leadLabel}.`,
      relatedId: followUpId,
    };
  }

  private async getLeadForFollowUp(followup: FollowUpLike) {
    const lead = this.asRecord(followup.lead);
    if (lead && this.getId(lead)) {
      return lead;
    }

    const leadId =
      typeof followup.lead === 'string' ||
      followup.lead instanceof Types.ObjectId
        ? String(followup.lead)
        : '';

    if (!Types.ObjectId.isValid(leadId)) {
      return null;
    }

    return this.leadModel.findById(leadId).lean();
  }

  private getReminderLookaheadHours() {
    const configured = Number(process.env.REMINDER_LOOKAHEAD_HOURS);
    return Number.isFinite(configured) && configured > 0 ? configured : 24;
  }

  private getId(value: unknown) {
    const record = this.asRecord(value);
    const rawId = record?._id ?? record?.id;

    return this.idToString(rawId);
  }

  private idToString(value: unknown) {
    if (value instanceof Types.ObjectId) {
      return value.toString();
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'number') {
      return String(value);
    }

    return '';
  }

  private asRecord(
    value: unknown,
  ): (Record<string, unknown> & LeadLike) | null {
    if (!value || typeof value !== 'object') {
      return null;
    }

    return value as Record<string, unknown> & LeadLike;
  }

  private assertObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }
}
