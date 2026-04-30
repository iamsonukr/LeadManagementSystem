import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { FollowUp, FollowUpDocument } from './followups.entity';
import {
  CreateFollowUpDto,
  UpdateFollowUpDto,
  FollowUpFilterDto,
} from './followups.dto';

@Injectable()
export class FollowupsServices {
  constructor(
    @InjectModel(FollowUp.name)
    private followUpModel: Model<FollowUpDocument>,
  ) {}

  // ✅ Create
  async create(dto: CreateFollowUpDto) {
    return this.followUpModel.create({
      ...dto,
      lead: new Types.ObjectId(dto.lead),
    });
  }

  // ✅ Get All (with filters + pagination)
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
    const filter: any = {};
    if (lead) filter.lead = new Types.ObjectId(lead);
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (type) filter.type = type;
    if (owner) filter.owner = owner;
    // 📅 Date range filter
    if (fromDate || toDate) {
      filter.dueAt = {};
      if (fromDate) filter.dueAt.$gte = new Date(fromDate);
      if (toDate) filter.dueAt.$lte = new Date(toDate);
    }
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.followUpModel
        .find(filter)
        .populate('lead') // 🔥 important
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
    };
  }

  // ✅ Get One
  async findOne(id: string) {
    const followup = await this.followUpModel.findById(id).populate('lead');
    if (!followup) {
      throw new NotFoundException('FollowUp not found');
    }
    return followup;
  }

  // ✅ Update (partial)
  async update(id: string, dto: UpdateFollowUpDto) {
    const clean = this.cleanDto(dto);
    const updated = await this.followUpModel.findByIdAndUpdate(
      id,
      { $set: clean },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('FollowUp not found');
    }
    return updated;
  }

  // ✅ Update status only
  async updateStatus(id: string, status: string) {
    const updated = await this.followUpModel.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException('FollowUp not found');
    }
    return updated;
  }

  // ✅ Delete
  async remove(id: string) {
    const deleted = await this.followUpModel.findByIdAndDelete(id);

    if (!deleted) {
      throw new NotFoundException('FollowUp not found');
    }

    return { message: 'FollowUp deleted successfully' };
  }

  // 🔧 Helper: remove undefined fields
  private cleanDto(dto: any) {
    return Object.fromEntries(
      Object.entries(dto).filter(([_, v]) => v !== undefined),
    );
  }
}
