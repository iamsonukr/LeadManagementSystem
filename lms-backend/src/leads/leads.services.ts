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
import {
  isAdmin,
  isManager,
  isSalesExecutive,
  RequestUser,
  userAssignmentKeys,
  userAssignmentIds,
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
  ) {}

  private async getAccessibleLeadFilter(user: RequestUser) {
    if (isAdmin(user)) {
      return {};
    }

    const ownKeys = userAssignmentIds(user);

    if (isManager(user)) {
      const teamMembers = await this.userModel
        .find({ reportingManager: new Types.ObjectId(user.id) })
        .select('_id')
        .lean();

      const teamKeys = teamMembers.map((member) => member._id);

      return { assignedTo: { $in: [...ownKeys, ...teamKeys] } };
    }

    return { assignedTo: { $in: ownKeys } };
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

    const filter: Record<string, unknown> = await this.getAccessibleLeadFilter(
      user,
    );

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
      const scopedAssignment = filter.assignedTo as
        | { $in?: Types.ObjectId[] }
        | Types.ObjectId
        | undefined;

      if (
        scopedAssignment &&
        typeof scopedAssignment === 'object' && '$in' in scopedAssignment && Array.isArray((scopedAssignment as any).$in)
      ) {
        filter.assignedTo = (scopedAssignment as any).$in.find((id: any) => String(id) === assignedTo)
          ? new Types.ObjectId(assignedTo as string)
          : { $in: [] };
      } else {
        filter.assignedTo = Types.ObjectId.isValid(assignedTo as string) ? new Types.ObjectId(assignedTo as string) : null;
      }
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
      Object.entries(dto).filter(([_, value]) => value !== undefined),
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
        await this.projectModel.create({
          lead: updatedLead._id,
        });
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

    await this.followUpModel.findOneAndUpdate(
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

    await this.followUpModel.findOneAndUpdate(
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
  }
}
