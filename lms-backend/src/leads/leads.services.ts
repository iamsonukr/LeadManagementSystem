import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Lead, LeadDocument } from './leads.entity';

import { Model, Types } from 'mongoose';

import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  LeadFilterDto,
} from './leads.dto';

import { Project, ProjectDocument } from '../projects/projects.entity';
import { FollowUp, FollowUpDocument } from '../followups/followups.entity';
import { CallLog, CallLogDocument } from '../calls/calls.entity';
import { assertDateIsTodayOrFuture } from '../common/date-validation';
import { User, UserDocument } from '../users/user.entity';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AssignmentKey,
  buildAssignedToMatch,
  isAdmin,
  isManager,
  isSalesExecutive,
  RequestUser,
  userAssignmentKeys,
  userAssignmentIds,
  userObjectId,
} from '../auth/roles';

const LEAD_NEXT_FOLLOWUP_SOURCE = 'lead-next-followup';
const LEAD_STATUS_FOLLOWUP_SOURCE = 'lead-status-followup';
const TERMINAL_LEAD_STATUSES = new Set(['Won', 'Lost', 'Duplicate', 'Spam']);

@Injectable()
export class LeadServices {
  constructor(
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,

    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,

    @InjectModel(FollowUp.name)
    private readonly followUpModel: Model<FollowUpDocument>,

    @InjectModel(CallLog.name)
    private readonly callLogModel: Model<CallLogDocument>,

    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,

    private readonly notificationsService: NotificationsService,
  ) {}

  private async getAccessibleLeadFilter(user: RequestUser) {
    if (isAdmin(user)) {
      return {};
    }

    const assignmentKeys: AssignmentKey[] = [
      ...userAssignmentIds(user),
      ...userAssignmentKeys(user),
    ];

    if (isManager(user)) {
      const managerId = userObjectId(user);
      const teamMembers = managerId
        ? await this.userModel
            .find({ reportingManager: managerId })
            .select('firstName lastName email')
            .lean()
        : [];

      assignmentKeys.push(
        ...teamMembers.flatMap((member) => {
          const name =
            `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
          return [member._id, String(member._id), member.email, name].filter(
            Boolean,
          );
        }),
      );
    }

    return { $and: [buildAssignedToMatch(assignmentKeys)] };
  }

  private async assertCanAccessLead(id: string, user: RequestUser) {
    const accessFilter = await this.getAccessibleLeadFilter(user);
    const lead = await this.leadModel
      .findOne({ _id: new Types.ObjectId(id), ...accessFilter })
      .lean();

    if (!lead) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    return lead;
  }

  // =========================================
  // Get All Leads
  // =========================================

  async findAll(query: LeadFilterDto, user: RequestUser) {
    const {
      status,
      source,
      priority,
      assignedTo,
      search,
      page = 1,
      limit = 10,
    } = query;

    const filter: Record<string, unknown> =
      await this.getAccessibleLeadFilter(user);

    // Filters

    if (status) {
      filter.status = status;
    }

    if (source) {
      filter.source = source;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo) {
      filter.$and = [
        ...((filter.$and as Record<string, unknown>[] | undefined) ?? []),
        buildAssignedToMatch([assignedTo]),
      ];
    }

    // Search

    if (search) {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          company: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          phone: {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),

      this.leadModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  // =========================================
  // Get Single Lead
  // =========================================

  async findById(id: string, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }

    const accessFilter = await this.getAccessibleLeadFilter(user);
    const lead = await this.leadModel
      .findOne({ _id: new Types.ObjectId(id), ...accessFilter })
      .lean();

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  // =========================================
  // Create Lead
  // =========================================

  async create(dto: CreateLeadDto) {
    assertDateIsTodayOrFuture(dto.nextFollowUp, 'Next follow-up date');

    // Duplicate email check

    const existingLead = await this.leadModel.findOne({
      email: dto.email.toLowerCase(),
    });

    if (existingLead) {
      throw new BadRequestException('Lead with this email already exists');
    }

    const lead = await this.leadModel.create({
      ...dto,
      email: dto.email.toLowerCase(),
    });

    await this.syncLeadNextFollowUp(lead);
    await this.notificationsService.createLeadAssignmentNotification(lead);

    return lead;
  }

  // =========================================
  // Update Lead
  // =========================================

  async update(id: string, dto: UpdateLeadDto, user: RequestUser) {
    console.log('Updating lead with id:', id);
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }
    const existingLeadForAccess = await this.assertCanAccessLead(id, user);

    if (
      isSalesExecutive(user) &&
      dto.assignedTo !== undefined &&
      dto.assignedTo !== existingLeadForAccess.assignedTo?.toString()
    ) {
      throw new ForbiddenException('Sales executives cannot reassign leads');
    }
    assertDateIsTodayOrFuture(dto.nextFollowUp, 'Next follow-up date');

    const existingProject = await this.projectModel.findOne({
      lead: id,
    });

    if (existingProject && dto.status && dto.status !== 'Won') {
      throw new BadRequestException(
        'Cannot move lead out of Won because a project already exists',
      );
    }
    // Duplicate email check on update

    if (dto.email) {
      const existingLead = await this.leadModel.findOne({
        email: dto.email.toLowerCase(),
        _id: {
          $ne: id,
        },
      });

      if (existingLead) {
        throw new BadRequestException('Lead with this email already exists');
      }
    }

    // Remove undefined fields
    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    );

    // Normalize email
    if (cleanDto.email) {
      cleanDto.email = String(cleanDto.email).toLowerCase();
    }

    const updatedLead = await this.leadModel.findByIdAndUpdate(
      id,
      {
        $set: cleanDto,

        $currentDate: {
          lastActivityAt: true,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedLead) {
      throw new NotFoundException('Lead not found');
    }

    await this.syncLeadNextFollowUp(updatedLead);
    if (dto.status) {
      await this.syncStatusFollowUp(updatedLead);
    }

    const previousAssignee = existingLeadForAccess.assignedTo
      ? String(existingLeadForAccess.assignedTo)
      : '';
    const nextAssignee = updatedLead.assignedTo
      ? String(updatedLead.assignedTo)
      : '';

    if (nextAssignee && nextAssignee !== previousAssignee) {
      await this.notificationsService.createLeadAssignmentNotification(
        updatedLead,
      );
    }

    return updatedLead;
  }

  // =========================================
  // Update Lead Status
  // =========================================

  async toggleStatus(id: string, dto: UpdateLeadStatusDto, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }
    await this.assertCanAccessLead(id, user);

    const existingProject = await this.projectModel.findOne({
      lead: id,
    });

    if (existingProject && dto.status !== 'Won') {
      throw new BadRequestException(
        'Cannot move lead out of Won because a project already exists',
      );
    }
    const updatedLead = await this.leadModel.findByIdAndUpdate(
      id,
      {
        $set: {
          status: dto.status,
        },

        $currentDate: {
          lastActivityAt: true,
        },
      },
      {
        new: true,
      },
    );

    if (!updatedLead) {
      throw new NotFoundException('Lead not found');
    }

    // =========================================
    // Auto Create Project When Won
    // =========================================

    if (dto.status === 'Won') {
      const existingProject = await this.projectModel.findOne({
        lead: updatedLead._id,
      });

      if (!existingProject) {
        const project = await this.projectModel.create({
          lead: updatedLead._id,
        });
        await this.notificationsService.createProjectAssignmentNotification(
          project,
          updatedLead,
        );
      }
    }

    await this.syncLeadNextFollowUp(updatedLead);
    await this.syncStatusFollowUp(updatedLead);

    return updatedLead;
  }

  // =========================================
  // Delete Lead
  // =========================================

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }

    const leadObjectId = new Types.ObjectId(id);
    const lead = await this.leadModel.findById(leadObjectId);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    if (lead.status === 'Won') {
      throw new BadRequestException(
        'Cannot delete a Won lead. Move it out of Won only if no project exists.',
      );
    }

    const [projectExists, followUpExists, callLogExists] = await Promise.all([
      this.projectModel.exists({ lead: leadObjectId }),
      this.followUpModel.exists({ lead: leadObjectId }),
      this.callLogModel.exists({ lead: leadObjectId }),
    ]);

    if (projectExists) {
      throw new BadRequestException('Cannot delete lead linked to projects');
    }

    if (followUpExists) {
      throw new BadRequestException(
        'Cannot delete lead with follow-ups. Delete or complete related follow-ups first.',
      );
    }

    if (callLogExists) {
      throw new BadRequestException(
        'Cannot delete lead with call logs. Delete related call logs first.',
      );
    }

    await this.leadModel.findByIdAndDelete(leadObjectId);

    return {
      message: 'Lead deleted successfully',
    };
  }

  private async syncLeadNextFollowUp(lead: LeadDocument) {
    const leadId = lead._id;
    const filter = {
      lead: leadId,
      source: LEAD_NEXT_FOLLOWUP_SOURCE,
      status: { $ne: 'Completed' },
    };

    if (TERMINAL_LEAD_STATUSES.has(lead.status) || !lead.nextFollowUp) {
      await this.followUpModel.deleteMany(filter);
      return;
    }

    const followup = await this.followUpModel.findOneAndUpdate(
      filter,
      {
        $set: {
          lead: leadId,
          owner: lead.assignedTo ? String(lead.assignedTo) : undefined,
          type: 'Call',
          status:
            new Date(lead.nextFollowUp).getTime() < Date.now()
              ? 'Overdue'
              : 'Pending',
          priority: lead.priority,
          dueAt: lead.nextFollowUp,
          source: LEAD_NEXT_FOLLOWUP_SOURCE,
          notes: lead.notes,
          nextAction: lead.nextAction,
        },
      },
      { new: true, upsert: true },
    );

    if (followup) {
      await this.notificationsService.createFollowUpNotification(
        followup,
        lead,
      );
    }
  }

  private async syncStatusFollowUp(lead: LeadDocument) {
    const leadId = lead._id;
    const filter = {
      lead: leadId,
      source: LEAD_STATUS_FOLLOWUP_SOURCE,
      status: { $ne: 'Completed' },
    };

    if (TERMINAL_LEAD_STATUSES.has(lead.status)) {
      await this.followUpModel.deleteMany(filter);
      return;
    }

    if (lead.nextFollowUp) {
      await this.followUpModel.deleteMany(filter);
      return;
    }

    const dueAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const followup = await this.followUpModel.findOneAndUpdate(
      filter,
      {
        $set: {
          lead: leadId,
          owner: lead.assignedTo ? String(lead.assignedTo) : undefined,
          type: 'Call',
          status:
            new Date(dueAt).getTime() < Date.now() ? 'Overdue' : 'Pending',
          priority: lead.priority,
          dueAt,
          source: LEAD_STATUS_FOLLOWUP_SOURCE,
          notes: `Follow up after lead moved to ${lead.status}`,
          nextAction: lead.nextAction || `Review ${lead.status} lead`,
        },
      },
      { new: true, upsert: true },
    );

    if (followup) {
      await this.notificationsService.createFollowUpNotification(
        followup,
        lead,
      );
    }
  }
}
