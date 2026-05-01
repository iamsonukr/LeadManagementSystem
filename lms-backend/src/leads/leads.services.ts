import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Lead, LeadDocument } from './leads.entity';

import { Model, QueryFilter, Types } from 'mongoose';

import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  LeadFilterDto,
} from './leads.dto';

@Injectable()
export class LeadServices {
  constructor(
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,
  ) {}

  // =========================================
  // Get All Leads
  // =========================================

  async findAll(query: LeadFilterDto) {
    const {
      status,
      source,
      priority,
      assignedTo,
      search,
      page = 1,
      limit = 10,
    } = query;

    const filter: QueryFilter<LeadDocument> = {};

    // Filters
    if (status) filter.status = status;

    if (source) filter.source = source;

    if (priority) filter.priority = priority;

    if (assignedTo) filter.assignedTo = assignedTo;

    // Search
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

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

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }

    const lead = await this.leadModel.findById(id);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  // =========================================
  // Create Lead
  // =========================================

  async create(dto: CreateLeadDto) {
    // Optional duplicate email check
    const existingLead = await this.leadModel.findOne({
      email: dto.email,
    });

    if (existingLead) {
      throw new BadRequestException('Lead with this email already exists');
    }

    return this.leadModel.create(dto);
  }

  // =========================================
  // Update Lead
  // =========================================

  async update(id: string, dto: UpdateLeadDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }

    // Remove undefined fields
    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter((entry) => entry[1] !== undefined),
    );

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

    return updatedLead;
  }

  // =========================================
  // Update Lead Status
  // =========================================

  async toggleStatus(id: string, dto: UpdateLeadStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
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

    return updatedLead;
  }

  // =========================================
  // Delete Lead
  // =========================================

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid lead id');
    }

    const deletedLead = await this.leadModel.findByIdAndDelete(id);

    if (!deletedLead) {
      throw new NotFoundException('Lead not found');
    }

    return {
      message: 'Lead deleted successfully',
    };
  }
}
