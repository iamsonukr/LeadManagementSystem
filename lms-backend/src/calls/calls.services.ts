import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, QueryFilter, Types } from 'mongoose';

import { CallLog, CallLogDocument } from './calls.entity';
import { FollowUp, FollowUpDocument } from '../followups/followups.entity';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { User, UserDocument } from '../users/user.entity';
import { assertDateIsTodayOrFuture } from '../common/date-validation';

import {
  CreateCallLogDto,
  UpdateCallLogDto,
  UpdateCallStatusDto,
  CallLogFilterDto,
} from './calls.dto';
import {
  isAdmin,
  isManager,
  RequestUser,
  userAssignmentKeys,
} from '../auth/roles';

@Injectable()
export class CallsService {
  constructor(
    @InjectModel(CallLog.name)
    private callLogModel: Model<CallLogDocument>,

    @InjectModel(FollowUp.name)
    private followUpModel: Model<FollowUpDocument>,
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private async getAssignmentKeys(user: RequestUser) {
    if (isAdmin(user)) {
      return null;
    }

    const ownKeys = userAssignmentKeys(user);
    if (!isManager(user)) {
      return ownKeys;
    }

    const teamMembers = await this.userModel
      .find({ reportingManager: new Types.ObjectId(user.id) })
      .select('firstName lastName email')
      .lean();

    return [
      ...ownKeys,
      ...teamMembers.flatMap((member) => {
        const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
        return [String(member._id), member.email, name].filter(Boolean);
      }),
    ];
  }

  private async getAccessibleLeadIds(user: RequestUser) {
    const assignmentKeys = await this.getAssignmentKeys(user);
    if (!assignmentKeys) {
      return null;
    }

    const leads = await this.leadModel
      .find({ assignedTo: { $in: [...new Set(assignmentKeys)] } })
      .select('_id')
      .lean();

    return leads.map((lead) => lead._id as Types.ObjectId);
  }

  private async assertCanAccessCall(id: string, user: RequestUser) {
    const leadIds = await this.getAccessibleLeadIds(user);
    const call = await this.callLogModel
      .findOne({
        _id: new Types.ObjectId(id),
        ...(leadIds ? { lead: { $in: leadIds } } : {}),
      })
      .select('_id')
      .lean();

    if (!call) {
      throw new ForbiddenException('You do not have access to this call log');
    }
  }

  async findAll(query: CallLogFilterDto, user: RequestUser) {
    const {
      lead,
      status,
      direction,
      calledBy,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
    } = query;

    const filter: QueryFilter<CallLogDocument> = {};
    const accessibleLeadIds = await this.getAccessibleLeadIds(user);

    if (accessibleLeadIds) {
      filter.lead = { $in: accessibleLeadIds };
    }

    if (lead) {
      if (!Types.ObjectId.isValid(lead)) {
        throw new BadRequestException('Invalid lead id');
      }
      const requestedLead = new Types.ObjectId(lead);
      filter.lead = accessibleLeadIds
        ? {
            $in: accessibleLeadIds.filter((id) => id.equals(requestedLead)),
          }
        : requestedLead;
    }

    if (status) {
      filter.status = status;
    }

    if (direction) {
      filter.direction = direction;
    }

    if (calledBy) {
      filter.calledBy = calledBy;
    }

    if (fromDate || toDate) {
      filter.callDate = {};

      if (fromDate) {
        filter.callDate.$gte = new Date(fromDate);
      }

      if (toDate) {
        filter.callDate.$lte = new Date(toDate);
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.callLogModel
        .find(filter)
        .populate('lead')
        .sort({ callDate: -1 })
        .skip(skip)
        .limit(Number(limit)),

      this.callLogModel.countDocuments(filter),
    ]);

    return {
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  async findById(id: string, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }

    await this.assertCanAccessCall(id, user);

    const call = await this.callLogModel.findById(id).populate('lead');

    if (!call) {
      throw new NotFoundException('Call log not found');
    }

    return call;
  }

  async create(dto: CreateCallLogDto, user: RequestUser) {
    if (!Types.ObjectId.isValid(dto.lead)) {
      throw new BadRequestException('Invalid lead id');
    }
    assertDateIsTodayOrFuture(dto.followUpDate, 'Next follow-up date');
    const accessibleLeadIds = await this.getAccessibleLeadIds(user);
    const leadObjectId = new Types.ObjectId(dto.lead);

    if (
      accessibleLeadIds &&
      !accessibleLeadIds.some((id) => id.equals(leadObjectId))
    ) {
      throw new ForbiddenException('You do not have access to this lead');
    }

    const createdCall = await this.callLogModel.create({
      ...dto,
      lead: leadObjectId,
      calledBy: dto.calledBy || user.name || user.email,
    });

    const populatedCall = await createdCall.populate('lead');
    await this.syncCallFollowUp(populatedCall);

    return populatedCall;
  }

  async update(id: string, dto: UpdateCallLogDto, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }
    await this.assertCanAccessCall(id, user);
    assertDateIsTodayOrFuture(dto.followUpDate, 'Next follow-up date');

    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter((entry) => entry[1] !== undefined),
    );

    if (cleanDto.lead) {
      if (!Types.ObjectId.isValid(cleanDto.lead as string)) {
        throw new BadRequestException('Invalid lead id');
      }
      cleanDto.lead = new Types.ObjectId(cleanDto.lead as string);
    }

    const updatedCall = await this.callLogModel
      .findByIdAndUpdate(
        id,
        {
          $set: cleanDto,
        },
        {
          new: true,
        },
      )
      .populate('lead');

    if (!updatedCall) {
      throw new NotFoundException('Call log not found');
    }

    await this.syncCallFollowUp(updatedCall);

    return updatedCall;
  }

  async updateStatus(id: string, dto: UpdateCallStatusDto, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }
    await this.assertCanAccessCall(id, user);

    const updatedCall = await this.callLogModel
      .findByIdAndUpdate(
        id,
        {
          $set: {
            status: dto.status,
          },
        },
        {
          new: true,
        },
      )
      .populate('lead');

    if (!updatedCall) {
      throw new NotFoundException('Call log not found');
    }

    await this.syncCallFollowUp(updatedCall);

    return updatedCall;
  }

  async remove(id: string, user: RequestUser) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }
    await this.assertCanAccessCall(id, user);

    const deletedCall = await this.callLogModel.findByIdAndDelete(id);

    if (!deletedCall) {
      throw new NotFoundException('Call log not found');
    }

    await this.followUpModel.deleteMany({
      source: `call-log:${String(deletedCall._id)}`,
    });

    return {
      message: 'Call log deleted successfully',
    };
  }

  private async syncCallFollowUp(call: CallLogDocument) {
    const lead = call.lead as Types.ObjectId | Record<string, any>;
    const leadRecord = lead instanceof Types.ObjectId ? {} : lead;
    const leadId =
      lead instanceof Types.ObjectId
        ? lead
        : new Types.ObjectId(String(leadRecord._id ?? leadRecord.id));
    const source = `call-log:${String(call._id)}`;
    const filter = {
      lead: leadId,
      source,
      status: { $ne: 'Completed' },
    };

    const dueAt =
      call.followUpDate ??
      call.callbackDate ??
      (call.status === 'Callback Scheduled'
        ? new Date(Date.now() + 24 * 60 * 60 * 1000)
        : undefined);

    if (!dueAt) {
      await this.followUpModel.deleteMany(filter);
      return;
    }

    await this.followUpModel.findOneAndUpdate(
      filter,
      {
        $set: {
          lead: leadId,
          owner: call.calledBy || String(leadRecord.assignedTo ?? ''),
          type: 'Call',
          status:
            new Date(dueAt).getTime() < Date.now() ? 'Overdue' : 'Pending',
          priority: String(leadRecord.priority ?? 'Medium'),
          dueAt,
          source,
          notes: call.notes || call.discussionPoints,
          nextAction: call.nextAction || 'Follow up on call',
        },
      },
      { new: true, upsert: true },
    );
  }
}
