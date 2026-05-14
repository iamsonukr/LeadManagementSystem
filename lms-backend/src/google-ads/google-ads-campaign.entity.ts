import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type GoogleAdsCampaignDocument = GoogleAdsCampaign & Document;

export interface ColumnMapping {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  [key: string]: string;
}

@Schema({ timestamps: true, collection: 'google_ads_campaigns' })
export class GoogleAdsCampaign {
  @Prop({ required: true, trim: true })
  clientName!: string;

  @Prop({ required: true, trim: true })
  campaignName!: string;

  @Prop({ required: true, trim: true })
  sheetUrl!: string;

  // Per-campaign lead source label chosen by admin
  @Prop({ default: 'Google Form' })
  leadSource!: string;

  // Column mapping: maps our field names → actual sheet column headers
  @Prop({ type: Object, default: {} })
  columnMapping!: ColumnMapping;

  // Sync metadata
  @Prop({ default: 'idle' }) // idle | syncing | success | error
  syncStatus!: string;

  @Prop({ type: Date })
  lastSyncedAt?: Date;

  @Prop({ default: '' })
  lastSyncError!: string;

  @Prop({ default: 0 })
  totalLeadsImported!: number;

  @Prop({ default: true })
  isActive!: boolean;
}

export const GoogleAdsCampaignSchema =
  SchemaFactory.createForClass(GoogleAdsCampaign);