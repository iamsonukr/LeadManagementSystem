import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Lead } from '../leads/leads.entity';

export type FollowUpDocument = FollowUp & Document;

@Schema({ timestamps: true, collection: 'followups' })
export class FollowUp {
  @Prop({ type: Types.ObjectId, ref: Lead.name, required: true })
  lead!: Types.ObjectId;

  @Prop()
  owner!: string;

  @Prop({
    enum: ['Demo', 'Proposal', 'Call', 'Email', 'Meeting', 'WhatsApp', 'Other'],
  })
  type!: string;

  @Prop({
    enum: ['Pending', 'Completed', 'Overdue', 'Rescheduled'],
    default: 'Pending',
  })
  status!: string;

  @Prop({ enum: ['Low', 'Medium', 'High'], default: 'Medium' })
  priority!: string;

  @Prop({ type: Date, required: true })
  dueAt!: Date;

  @Prop({ type: Date })
  completedAt!: Date;

  @Prop()
  source?: string;

  @Prop()
  notes!: string;

  @Prop()
  nextAction!: string;
}

export const FollowUpSchema = SchemaFactory.createForClass(FollowUp);
