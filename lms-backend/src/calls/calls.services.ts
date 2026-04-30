import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { CallLog, CallLogDocument } from './calls.entity';

import {
  CreateCallLogDto,
  UpdateCallLogDto,
  UpdateCallStatusDto,
  CallLogFilterDto,
} from './calls.dto';

@Injectable()
export class CallsService {
  constructor(
    @InjectModel(CallLog.name)
    private callLogModel: Model<CallLogDocument>,
  ) {}

  async findAll(query: CallLogFilterDto) {
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

    const filter: any = {};

    if (lead) {
      filter.lead = new Types.ObjectId(lead);
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

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }

    const call = await this.callLogModel.findById(id).populate('lead');

    if (!call) {
      throw new NotFoundException('Call log not found');
    }

    return call;
  }

  async create(dto: CreateCallLogDto) {
    const createdCall = await this.callLogModel.create({
      ...dto,
      lead: new Types.ObjectId(dto.lead),
    });

    return createdCall.populate('lead');
  }

  async update(id: string, dto: UpdateCallLogDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }

    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    if (cleanDto.lead) {
      cleanDto.lead = new Types.ObjectId(cleanDto.lead);
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

    return updatedCall;
  }

  async updateStatus(id: string, dto: UpdateCallStatusDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }

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

    return updatedCall;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid call log id');
    }

    const deletedCall = await this.callLogModel.findByIdAndDelete(id);

    if (!deletedCall) {
      throw new NotFoundException('Call log not found');
    }

    return {
      message: 'Call log deleted successfully',
    };
  }
}
