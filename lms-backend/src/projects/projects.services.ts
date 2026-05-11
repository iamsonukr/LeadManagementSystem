import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Project, ProjectDocument } from './projects.entity';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { User, UserDocument } from '../users/user.entity';

import {
  CreateProjectDto,
  ProjectFilterDto,
  UpdateProjectDto,
} from './projects.dto';
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
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private async getAccessibleLeadIds(user: RequestUser) {
    if (isAdmin(user)) {
      return null;
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

    const leads = await this.leadModel
      .find(buildAssignedToMatch(assignmentKeys))
      .select('_id')
      .lean();

    return leads.map((lead) => lead._id);
  }

  private async assertCanAccessProject(id: string, user: RequestUser) {
    const leadIds = await this.getAccessibleLeadIds(user);
    const project = await this.projectModel
      .findOne({
        _id: new Types.ObjectId(id),
        ...(leadIds ? { lead: { $in: leadIds } } : {}),
      })
      .select('_id')
      .lean();

    if (!project) {
      throw new ForbiddenException('You do not have access to this project');
    }
  }

  async findAll(query: ProjectFilterDto, user: RequestUser) {
    const { lead, status, search, page = 1, limit = 10 } = query;

    const filter: Record<string, unknown> = {};
    const accessibleLeadIds = await this.getAccessibleLeadIds(user);

    if (accessibleLeadIds) {
      filter.lead = { $in: accessibleLeadIds };
    }

    // =========================
    // Filters
    // =========================

    if (lead) {
      if (!Types.ObjectId.isValid(lead)) {
        throw new BadRequestException('Invalid lead id');
      }
      const requestedLead = new Types.ObjectId(lead);
      filter.lead = accessibleLeadIds
        ? { $in: accessibleLeadIds.filter((id) => id.equals(requestedLead)) }
        : requestedLead;
    }
    if (status) {
      filter.status = status;
    }

    let leadIds: Types.ObjectId[] = [];

    if (search) {
      const projects = await this.projectModel.find().populate({
        path: 'lead',
        match: {
          $or: [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { assignedTo: { $regex: search, $options: 'i' } },
          ],
        },
        select: '_id',
      });

      leadIds = projects.filter((p) => p.lead).map((p) => (p.lead as any)._id);

      filter.lead = accessibleLeadIds
        ? {
            $in: leadIds.filter((id) =>
              accessibleLeadIds.some((allowed) => allowed.equals(id)),
            ),
          }
        : { $in: leadIds };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate(
          'lead',
          `
            name
            email
            phone
            company
            assignedTo
            services
            source
            budget
            priority
            status
          `,
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),

      this.projectModel.countDocuments(filter),
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
      throw new BadRequestException('Invalid project id');
    }

    await this.assertCanAccessProject(id, user);

    const project = await this.projectModel.findById(id).populate(
      'lead',
      `
          name
          email
          phone
          company
          assignedTo
          services
          source
          budget
          priority
          status
        `,
    );

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return project;
  }

  async create(dto: CreateProjectDto) {
    if (!Types.ObjectId.isValid(dto.lead)) {
      throw new BadRequestException('Invalid lead id');
    }

    const project = await this.projectModel.create({
      ...dto,
      lead: new Types.ObjectId(dto.lead),
    });

    return project.populate(
      'lead',
      `
        name
        email
        phone
        company
        assignedTo
        services
        source
        budget
        priority
        status
      `,
    );
  }

  async update(id: string, dto: UpdateProjectDto) {
    console.log('Reached here ---', dto);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project id');
    }

    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter(([_, value]) => value !== undefined),
    );

    if (cleanDto.lead) {
      if (!Types.ObjectId.isValid(cleanDto.lead as string)) {
        throw new BadRequestException('Invalid lead id');
      }

      cleanDto.lead = new Types.ObjectId(cleanDto.lead as string);
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, { $set: cleanDto }, { new: true })
      .populate(
        'lead',
        `
          name
          email
          phone
          company
          assignedTo
          services
          source
          budget
          priority
          status
        `,
      );

    if (!updatedProject) {
      throw new NotFoundException('Project not found');
    }
    return updatedProject;
  }

  async remove(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project id');
    }

    const deletedProject = await this.projectModel.findByIdAndDelete(id);

    if (!deletedProject) {
      throw new NotFoundException('Project not found');
    }

    return {
      message: 'Project deleted successfully',
    };
  }
}
