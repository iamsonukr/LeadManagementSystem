import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { User, UserDocument } from './user.entity';
import { Department, DepartmentDocument } from '../department/department.entity';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { Project, ProjectDocument } from '../projects/projects.entity';

import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './user.dto';
import { isAdmin, isManager, RequestUser } from '../auth/roles';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
    @InjectModel(Project.name)
    private readonly projectModel: Model<ProjectDocument>,
  ) {}

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid user id');
    }
  }

  private async resolveDepartment(
    department: string | undefined,
  ): Promise<Types.ObjectId | null | undefined> {
    if (department === undefined) {
      return undefined;
    }

    const normalizedDepartment = department.trim();

    if (!normalizedDepartment) {
      return null;
    }

    const departmentRecord = Types.ObjectId.isValid(normalizedDepartment)
      ? await this.departmentModel.findById(normalizedDepartment).select('_id')
      : await this.departmentModel
          .findOne({ name: normalizedDepartment })
          .select('_id');

    if (!departmentRecord) {
      throw new NotFoundException(
        `Department ${normalizedDepartment} not found`,
      );
    }

    return departmentRecord._id as Types.ObjectId;
  }

  private buildUpdatePayload(dto: UpdateUserDto, department?: Types.ObjectId | null) {
    const payload: Record<string, unknown> = {};

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined && key !== 'department') {
        payload[key] = value;
      }
    });

    if (department instanceof Types.ObjectId) {
      payload.department = department;
    }

    return payload;
  }

  private async attachDepartments<T extends { department?: unknown }>(users: T[]) {
    const departmentIds = new Set<string>();
    const departmentNames = new Set<string>();

    users.forEach((user) => {
      const department = user.department;

      if (!department) {
        return;
      }

      const rawDepartment =
        typeof department === 'object' && department !== null && '_id' in department
          ? String(
              (department as {
                _id?: string;
              })._id ?? '',
            )
          : String(department);

      if (!rawDepartment) {
        return;
      }

      if (Types.ObjectId.isValid(rawDepartment)) {
        departmentIds.add(rawDepartment);
        return;
      }

      departmentNames.add(rawDepartment.trim());
    });

    if (!departmentIds.size && !departmentNames.size) {
      return users;
    }

    const departments = await this.departmentModel
      .find({
        $or: [
          ...(departmentIds.size
            ? [{ _id: { $in: Array.from(departmentIds) } }]
            : []),
          ...(departmentNames.size
            ? [{ name: { $in: Array.from(departmentNames) } }]
            : []),
        ],
      })
      .select('name description status')
      .lean();

    const departmentsById = new Map(
      departments.map((department) => [String(department._id), department]),
    );
    const departmentsByName = new Map(
      departments.map((department) => [String(department.name), department]),
    );

    return users.map((user) => {
      const department = user.department;

      if (!department) {
        return user;
      }

      const rawDepartment =
        typeof department === 'object' && department !== null && '_id' in department
          ? String(
              (department as {
                _id?: string;
              })._id ?? '',
            )
          : String(department);

      const relatedDepartment = Types.ObjectId.isValid(rawDepartment)
        ? departmentsById.get(rawDepartment)
        : departmentsByName.get(rawDepartment.trim());

      return {
        ...user,
        department: relatedDepartment ?? department,
      };
    });
  }

  // =========================================
  // Get All Users
  // =========================================

  async findAll(currentUser?: RequestUser) {
    const filter =
      currentUser && isManager(currentUser) && !isAdmin(currentUser)
        ? {
            $or: [
              { _id: new Types.ObjectId(currentUser.id) },
              { reportingManager: new Types.ObjectId(currentUser.id) },
            ],
          }
        : {};

    const users = await this.userModel
      .find(filter)
      .sort({ createdAt: -1 })
      .select('-password')
      .lean();

    return this.attachDepartments(users);
  }

  // =========================================
  // Get Single User
  // =========================================

  async findOne(id: string, currentUser?: RequestUser) {
    this.assertObjectId(id);
    if (currentUser && isManager(currentUser) && !isAdmin(currentUser)) {
      const allowedUser = await this.userModel.exists({
        _id: new Types.ObjectId(id),
        $or: [
          { _id: new Types.ObjectId(currentUser.id) },
          { reportingManager: new Types.ObjectId(currentUser.id) },
        ],
      });

      if (!allowedUser) {
        throw new NotFoundException(`User ${id} not found`);
      }
    }

    const user = await this.userModel
      .findById(id)
      .select('-password')
      .lean();

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const [resolvedUser] = await this.attachDepartments([user]);

    return resolvedUser;
  }

  // =========================================
  // Find User By Email
  // =========================================

  async findByEmail(email: string, includePassword = false) {
    const normalizedEmail = email.toLowerCase();

    const query = this.userModel.findOne({
      email: normalizedEmail,
    });

    if (includePassword) {
      query.select('+password');
    }

    const user = await query.lean().exec();

    if (!user) {
      return null;
    }

    const [resolvedUser] = await this.attachDepartments([user]);

    return resolvedUser;
  }

  // =========================================
  // Create User
  // =========================================

  async create(dto: CreateUserDto) {
    const normalizedEmail = dto.email.toLowerCase();

    const existing = await this.findByEmail(normalizedEmail);

    if (existing) {
      throw new ConflictException('Email already in use');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const department = await this.resolveDepartment(dto.department);

    const user = await this.userModel.create({
      ...dto,
      email: normalizedEmail,
      password: hashedPassword,
      department: department ?? undefined,
    });

    return this.findOne(user.id);
  }

  // =========================================
  // Update User
  // =========================================

  async update(id: string, dto: UpdateUserDto) {
    this.assertObjectId(id);

    // Check duplicate email

    if (dto.email) {
      const existing = await this.userModel.findOne({
        email: dto.email.toLowerCase(),
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException('Email already in use');
      }

      dto.email = dto.email.toLowerCase();
    }

    const department = await this.resolveDepartment(dto.department);
    const updatePayload = this.buildUpdatePayload(dto, department);
    const updateOperation =
      department === null
        ? {
            $set: updatePayload,
            $unset: { department: 1 },
          }
        : {
            $set: updatePayload,
          };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        id,
        updateOperation,
        {
          new: true,
        },
      )
      .select('-password');

    if (!updatedUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return updatedUser;
  }

  // =========================================
  // Change Password
  // =========================================

  async changePassword(id: string, dto: ChangePasswordDto) {
    this.assertObjectId(id);

    const user = await this.userModel.findById(id).select('+password');

    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    user.password = hashedPassword;

    await user.save();

    return {
      message: 'Password updated successfully',
    };
  }

  // =========================================
  // Delete User
  // =========================================

  async remove(id: string) {
    this.assertObjectId(id);

    const deletedUser = await this.userModel.findByIdAndDelete(id);

    if (!deletedUser) {
      throw new NotFoundException(`User ${id} not found`);
    }

    return {
      message: 'User deleted successfully',
    };
  }

  // =========================================
  // Get Projects for User
  // =========================================

  async getProjectsForUser(userId: string) {
    this.assertObjectId(userId);

    // Get the user
    const user = await this.userModel.findById(userId).select('firstName lastName email').lean();

    if (!user) {
      throw new NotFoundException(`User ${userId} not found`);
    }

    // Create user assignment keys to match against leads (all variations)
    const firstName = user.firstName?.trim() || '';
    const lastName = user.lastName?.trim() || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    const assignmentKeys = [
      String(userId), // Direct ID match
      user.email?.toLowerCase().trim(), // Email match (case-insensitive)
      fullName, // Full name match
      firstName, // First name only
    ].filter(Boolean);

    // Find all leads assigned to this user (ALL statuses/phases)
    const leads = await this.leadModel
      .find({
        $or: [
          { assignedTo: { $in: assignmentKeys } },
          // Also try case-insensitive match for assignedTo
          { assignedTo: new RegExp(`^${assignmentKeys.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')}$`, 'i') }
        ]
      })
      .select('_id status')
      .lean();

    const leadIds = leads.map((lead) => lead._id);

    if (leadIds.length === 0) {
      return [];
    }

    // Find all projects for those leads (regardless of lead status)
    const projects = await this.projectModel
      .find({ lead: { $in: leadIds } })
      .populate('lead', 'name email company assignedTo status')
      .sort({ createdAt: -1 })
      .lean();

    return projects;
  }
}
