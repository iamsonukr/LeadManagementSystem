import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Department, DepartmentDocument } from './department.entity';

import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';

@Injectable()
export class DepartmentService {
  constructor(
    @InjectModel(Department.name)
    private readonly departmentModel: Model<DepartmentDocument>,
  ) {}

  // =========================================
  // Validate ObjectId
  // =========================================

  private assertObjectId(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid department id');
    }
  }

  // =========================================
  // Get All Departments
  // =========================================

  async findAll() {
    return this.departmentModel.find().sort({ createdAt: -1 });
  }

  // =========================================
  // Get Single Department
  // =========================================

  async findOne(id: string) {
    this.assertObjectId(id);

    const department = await this.departmentModel.findById(id);

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  // =========================================
  // Create Department
  // =========================================

  async create(dto: CreateDepartmentDto) {
    const existing = await this.departmentModel.findOne({
      name: dto.name,
    });

    if (existing) {
      throw new ConflictException('Department already exists');
    }

    return this.departmentModel.create(dto);
  }

  // =========================================
  // Update Department
  // =========================================

  async update(id: string, dto: UpdateDepartmentDto) {
    this.assertObjectId(id);

    // Duplicate name check

    if (dto.name) {
      const existing = await this.departmentModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });

      if (existing) {
        throw new ConflictException('Department already exists');
      }
    }

    const updatedDepartment = await this.departmentModel.findByIdAndUpdate(
      id,
      {
        $set: dto,
      },
      {
        new: true,
      },
    );

    if (!updatedDepartment) {
      throw new NotFoundException('Department not found');
    }

    return updatedDepartment;
  }

  // =========================================
  // Delete Department
  // =========================================

  async remove(id: string) {
    this.assertObjectId(id);

    const deletedDepartment = await this.departmentModel.findByIdAndDelete(id);

    if (!deletedDepartment) {
      throw new NotFoundException('Department not found');
    }

    return {
      message: 'Department deleted successfully',
    };
  }
}
