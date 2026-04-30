import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { Lead } from '../leads/leads.entity';

export type CallLogDocument = CallLog & Document;

@Schema({
  timestamps: true,
  collection: 'call_logs',
})
export class CallLog {
  @Prop({
    type: Types.ObjectId,
    ref: Lead.name,
    required: true,
  })
  lead!: Types.ObjectId;

  @Prop({ default: 'Connected' })
  status!: string;
  // Connected | Not Answered | Callback Scheduled | Dropped

  @Prop({ default: 'Outgoing' })
  direction!: string;
  // Outgoing | Incoming

  @Prop({ type: Number, default: 0 })
  duration!: number;
  // minutes

  @Prop()
  notes?: string;

  @Prop()
  discussionPoints?: string;

  @Prop()
  nextAction?: string;

  @Prop({ type: Date, required: true })
  callDate!: Date;

  @Prop({ type: Date })
  followUpDate?: Date;

  @Prop({ type: Date })
  callbackDate?: Date;

  @Prop()
  calledBy?: string;
}

export const CallLogSchema = SchemaFactory.createForClass(CallLog);
