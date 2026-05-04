import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryFilter, Types } from 'mongoose';

import { FollowUp, FollowUpDocument } from './followups.entity';
import {
  CreateFollowUpDto,
  FollowUpFilterDto,
  UpdateFollowUpDto,
} from './followups.dto';
import { assertDateIsTodayOrFuture } from '../common/date-validation';

@Injectable()
export class FollowupsServices {
  constructor(
    @InjectModel(FollowUp.name)
    private followUpModel: Model<FollowUpDocument>,
  ) {}

  private assertObjectId(id: string, label: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${label} id`);
    }
  }

  async create(dto: CreateFollowUpDto) {
    this.assertObjectId(dto.lead, 'lead');
    assertDateIsTodayOrFuture(dto.dueAt, 'Follow-up date');

    const followup = await this.followUpModel.create({
      ...dto,
      lead: new Types.ObjectId(dto.lead),
    });

    return followup.populate('lead');
  }

  async findAll(query: FollowUpFilterDto) {
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

    if (lead) {
      this.assertObjectId(lead, 'lead');
      filter.lead = new Types.ObjectId(lead);
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

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    this.assertObjectId(id, 'followup');
    const followup = await this.followUpModel.findById(id).populate('lead');
    if (!followup) {
      throw new NotFoundException('FollowUp not found');
    }
    return followup;
  }

  async update(id: string, dto: UpdateFollowUpDto) {
    this.assertObjectId(id, 'followup');
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

  async updateStatus(id: string, status: string) {
    this.assertObjectId(id, 'followup');
    const updated = await this.followUpModel
      .findByIdAndUpdate(id, { $set: { status } }, { new: true })
      .populate('lead');
    if (!updated) {
      throw new NotFoundException('FollowUp not found');
    }
    return updated;
  }

  async remove(id: string) {
    this.assertObjectId(id, 'followup');
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
