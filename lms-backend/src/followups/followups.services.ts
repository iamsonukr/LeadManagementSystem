import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';

import { FollowUp, FollowUpDocument } from './followups.entity';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { User, UserDocument } from '../users/user.entity';
import {
  CreateFollowUpDto,
  FollowUpFilterDto,
  UpdateFollowUpDto,
} from './followups.dto';
import { assertDateIsTodayOrFuture } from '../common/date-validation';
import {
  AssignmentKey,
  buildAssignedToMatch,
  isAdmin,
  isManager,
  RequestUser,
  userAssignmentKeys,
  userAssignmentIds,
  userObjectId,
} from '../auth/roles';

@Injectable()
export class FollowupsServices {
  constructor(
    @InjectModel(FollowUp.name)
    private followUpModel: Model<FollowUpDocument>,
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private assertObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  private async getAssignmentKeys(user: RequestUser) {
    if (isAdmin(user)) {
      return null;
    }

    const assignmentKeys: AssignmentKey[] = [
      ...userAssignmentIds(user),
      ...userAssignmentKeys(user),
    ];

    if (!isManager(user)) {
      return assignmentKeys;
    }

    const managerId = userObjectId(user);
    const teamMembers = managerId
      ? await this.userModel
          .find({ reportingManager: managerId })
          .select('firstName lastName email')
          .lean()
      : [];

    return [
      ...assignmentKeys,
      ...teamMembers.flatMap((member) => {
        const name =
          `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
        return [member._id, String(member._id), member.email, name].filter(
          Boolean,
        );
      }),
    ];
  }

  private async getAccessibleLeadIds(user: RequestUser) {
    const assignmentKeys = await this.getAssignmentKeys(user);
    if (!assignmentKeys) {
      return null;
    }

    const leads = await this.leadModel
      .find(buildAssignedToMatch(assignmentKeys))
      .select('_id')
      .lean();

    return leads.map((lead) => lead._id);
  }

  private async assertCanAccessFollowUp(id: string, user: RequestUser) {
    const leadIds = await this.getAccessibleLeadIds(user);
    const followup = await this.followUpModel
      .findOne({
        _id: new Types.ObjectId(id),
        ...(leadIds ? { lead: { $in: leadIds } } : {}),
      })
      .select('_id')
      .lean();

    if (!followup) {
      throw new ForbiddenException('You do not have access to this follow-up');
    }
  }

  async create(dto: CreateFollowUpDto, user: RequestUser) {
    this.assertObjectId(dto.lead, 'lead');
    assertDateIsTodayOrFuture(dto.dueAt, 'Follow-up date');
    const accessibleLeadIds = await this.getAccessibleLeadIds(user);
    const leadObjectId = new Types.ObjectId(dto.lead);

    if (
      accessibleLeadIds &&
      !accessibleLeadIds.some((id) => id.equals(leadObjectId))
    ) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    const followup = await this.followUpModel.create({
      ...dto,
      lead: leadObjectId,
      owner: dto.owner || user.name || user.email,
    });

    return followup.populate('lead');
  }

  async findAll(query: FollowUpFilterDto, user: RequestUser) {
    const {
      lead,
      status,
      priority,
      type,
      owner,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = query;
    const filter: QueryFilter<FollowUpDocument> = {};
    const accessibleLeadIds = await this.getAccessibleLeadIds(user);

    if (accessibleLeadIds) {
      filter.lead = { $in: accessibleLeadIds };
    }

    if (lead) {
      this.assertObjectId(lead, 'lead');
      const requestedLead = new Types.ObjectId(lead);
      filter.lead = accessibleLeadIds
        ? {
            $in: accessibleLeadIds.filter((id) => id.equals(requestedLead)),
          }
        : requestedLead;
    }
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (owner) filter.owner = owner;
    if (fromDate || toDate) {
      filter.dueAt = {};
      if (fromDate) filter.dueAt.$gte = new Date(fromDate);
      if (toDate) filter.dueAt.$lte = new Date(toDate);
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.followUpModel
        .find(filter)
        .populate('lead')
        .sort({ dueAt: 1 })
        .skip(skip)
        .limit(limit),
      this.followUpModel.countDocuments(filter),
    ]);

    console.log( 'Follow-up query filter:', filter);
    console.log( 'Follow-up query data:', data);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, user: RequestUser) {
    this.assertObjectId(id, 'followup');
    await this.assertCanAccessFollowUp(id, user);
    const followup = await this.followUpModel.findById(id).populate('lead');
    if (!followup) {
      throw new NotFoundException('FollowUp not found');
    }
    return followup;
  }

  async update(id: string, dto: UpdateFollowUpDto, user: RequestUser) {
    this.assertObjectId(id, 'followup');
    await this.assertCanAccessFollowUp(id, user);
    assertDateIsTodayOrFuture(dto.dueAt, 'Follow-up date');

    const clean = this.cleanDto(dto);
    if (clean.lead) {
      this.assertObjectId(clean.lead as string, 'lead');
      clean.lead = new Types.ObjectId(clean.lead as string);
    }

    const updated = await this.followUpModel
      .findByIdAndUpdate(id, { $set: clean }, { new: true })
      .populate('lead');
    if (!updated) {
      throw new NotFoundException('FollowUp not found');
    }
    return updated;
  }

  async updateStatus(id: string, status: string, user: RequestUser) {
    this.assertObjectId(id, 'followup');
    await this.assertCanAccessFollowUp(id, user);
    const updated = await this.followUpModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .populate('lead');
    if (!updated) {
      throw new NotFoundException('FollowUp not found');
    }
    return updated;
  }

  async remove(id: string, user: RequestUser) {
    this.assertObjectId(id, 'followup');
    await this.assertCanAccessFollowUp(id, user);
    const deleted = await this.followUpModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('FollowUp not found');
    }

    return { message: 'FollowUp deleted successfully' };
  }

  private cleanDto(dto: UpdateFollowUpDto) {
    return Object.fromEntries(
      Object.entries(dto).filter((entry) => entry[1] !== undefined),
    );
  }
}
