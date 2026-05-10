import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type DepartmentDocument = Department & Document;

@Schema({
  timestamps: true,
  collection: 'departments',
})
export class Department {
  // =========================================
  // Department Name
  // =========================================

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name!: string;

  // =========================================
  // Description
  // =========================================

  @Prop({
    trim: true,
  })
  description?: string;

  // =========================================
  // Department Status
  // =========================================

  @Prop({
    default: 'Active',
    enum: ['Active', 'Inactive'],
  })
  status!: string;
}

export const DepartmentSchema = SchemaFactory.createForClass(Department);
