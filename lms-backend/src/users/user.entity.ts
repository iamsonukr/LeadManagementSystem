import { Exclude } from 'class-transformer';

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

import { Department } from '../department/department.entity';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: 'users',
})
export class User {
  // =========================================
  // Basic Info
  // =========================================

  @Prop({
    required: true,
    trim: true,
  })
  firstName!: string;

  @Prop({
    required: true,
    trim: true,
  })
  lastName!: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email!: string;

  @Prop({
    required: true,
    select: false,
  })
  @Exclude()
  password!: string;

  @Prop({
    trim: true,
    default: null,
  })
  phone?: string;

  // =========================================
  // Organization
  // =========================================

  @Prop({
    unique: true,
    sparse: true,
    trim: true,
  })
  employeeId?: string;

  @Prop({
    enum: ['Admin', 'Sales Manager', 'Sales Executive'],
    default: 'Sales Executive',
  })
  role!: string;

  @Prop({
    type: Types.ObjectId,
    ref: Department.name,
    default: null,
  })
  department?: Types.ObjectId;

  @Prop({
    enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
    default: 'Full-time',
  })
  employmentType!: string;

  @Prop()
  joiningDate?: Date;

  @Prop({
    trim: true,
  })
  workLocation?: string;

  @Prop({
    type: Types.ObjectId,
    ref: User.name,
  })
  reportingManager?: Types.ObjectId;

  // =========================================
  // Skills & Work
  // =========================================

  @Prop({
    type: [String],
    default: [],
  })
  skills?: string[];

  @Prop({
    trim: true,
  })
  currentProject?: string;

  // =========================================
  // Status
  // =========================================

  @Prop({
    enum: ['Active', 'Inactive', 'On Leave', 'Resigned'],
    default: 'Active',
  })
  status!: string;

  // =========================================
  // Analytics
  // =========================================

  @Prop({
    default: 0,
  })
  leads!: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
