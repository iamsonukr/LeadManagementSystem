import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Project, ProjectDocument } from './projects.entity';
import {
  CreateProjectDto,
  ProjectFilterDto,
  UpdateProjectDto,
} from './projects.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  async findAll(query: ProjectFilterDto) {
    const { lead, status, owner, search, page = 1, limit = 10 } = query;

    const filter: Record<string, unknown> = {};

    if (lead) {
      if (!Types.ObjectId.isValid(lead)) {
        throw new BadRequestException('Invalid lead id');
      }
      filter.lead = new Types.ObjectId(lead);
    }

    if (status) filter.status = status;
    if (owner) filter.owner = owner;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { service: { $regex: search, $options: 'i' } },
        { owner: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.projectModel
        .find(filter)
        .populate('lead')
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

  async findById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project id');
    }

    const project = await this.projectModel.findById(id).populate('lead');

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

    return project.populate('lead');
  }

  async update(id: string, dto: UpdateProjectDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid project id');
    }

    const cleanDto = Object.fromEntries(
      Object.entries(dto).filter((entry) => entry[1] !== undefined),
    );

    if (cleanDto.lead) {
      if (!Types.ObjectId.isValid(cleanDto.lead as string)) {
        throw new BadRequestException('Invalid lead id');
      }
      cleanDto.lead = new Types.ObjectId(cleanDto.lead as string);
    }

    const updatedProject = await this.projectModel
      .findByIdAndUpdate(id, { $set: cleanDto }, { new: true })
      .populate('lead');

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

    return { message: 'Project deleted successfully' };
  }
}
