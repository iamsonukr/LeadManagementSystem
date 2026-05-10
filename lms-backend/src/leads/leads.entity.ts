import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../users/user.entity';
import { Department } from '../department/department.entity';

export type LeadDocument = Lead & Document;

@Schema({ timestamps: true, collection: 'leads' })
export class Lead {
  // =========================
  // Basic Info
  // =========================

  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, trim: true, lowercase: true })
  email!: string;

  @Prop({ trim: true })
  phone?: string;

  @Prop({ trim: true })
  company?: string;

  // =========================
  // Lead Management
  // =========================

  @Prop({ default: 'New' })
  status!: string;

  @Prop()
  source?: string;

  @Prop({ type: [String], default: [] })
  services?: string[];

  @Prop({ default: 'Medium' })
  priority!: string;

  @Prop({ type: Types.ObjectId, ref: User.name })
  assignedTo?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Department.name })
  department?: Types.ObjectId;

  // =========================
  // Sales Data
  // =========================

  @Prop({ type: Number })
  leadValue?: number;

  @Prop({ type: Number })
  stageProbability?: number;

  @Prop({ type: Date })
  expectedCloseDate?: Date;

  // =========================
  // Activity Tracking
  // =========================

  @Prop({ type: Date })
  lastActivityAt?: Date;

  @Prop({ type: Date })
  lastContactedAt?: Date;

  @Prop()
  nextAction?: string;

  // =========================
  // Company Details
  // =========================

  @Prop()
  location?: string;

  @Prop()
  industry?: string;

  @Prop()
  companySize?: string;

  @Prop({ type: Number })
  budget?: number;

  @Prop({ default: 'USD' })
  currency!: string;

  // =========================
  // Extra Metadata
  // =========================

  @Prop({ type: Object })
  address?: Record<string, string>;

  @Prop({ type: [String], default: [] })
  tags?: string[];

  @Prop({ type: Number })
  aiScore?: number;

  // =========================
  // Follow-up / Calls
  // =========================

  @Prop({ default: 0 })
  callCount!: number;

  @Prop({ type: Date })
  lastCallDate?: Date;

  @Prop({ type: Date })
  nextFollowUp?: Date;

  // =========================
  // Notes
  // =========================

  @Prop()
  notes?: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
