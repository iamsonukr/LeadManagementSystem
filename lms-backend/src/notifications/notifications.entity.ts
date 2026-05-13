import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'notifications',
})
export class Notification {
  @Prop({ required: true, trim: true, index: true })
  user!: string;

  @Prop({ required: true, trim: true, index: true })
  type!: string;

  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  message!: string;

  @Prop({ required: true, trim: true, index: true })
  relatedId!: string;

  @Prop({ default: false, index: true })
  isRead!: boolean;

  createdAt!: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

NotificationSchema.index({ user: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, relatedId: 1 });
