import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Lead } from '../leads/leads.entity';

export type ProjectDocument = Project & Document;

@Schema({
  timestamps: true,
  collection: 'projects',
})
export class Project {
  @Prop({
    type: Types.ObjectId,
    ref: Lead.name,
    required: true,
  })
  lead!: Types.ObjectId;

  @Prop({ required: true })
  name!: string;

  @Prop()
  service?: string;

  @Prop()
  owner?: string;

  @Prop({ default: 'Kickoff' })
  status!: string;

  @Prop({ default: 'Medium' })
  priority!: string;

  @Prop({ type: Number })
  budget?: number;

  @Prop({ type: Number, default: 0 })
  amountReceived!: number;

  @Prop({ default: 'Advance Pending' })
  paymentStatus!: string;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  deliveryDate?: Date;

  @Prop()
  lastMilestone?: string;

  @Prop()
  source?: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
