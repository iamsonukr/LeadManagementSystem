import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetaAdsCampaignDocument = MetaAdsCampaign & Document;

export interface ColumnMapping {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  notes?: string;
  [key: string]: string | undefined;
}

@Schema({ timestamps: true, collection: 'meta_ads_campaigns' })
export class MetaAdsCampaign {
  @Prop({ required: true, trim: true })
  clientName!: string;

  @Prop({ required: true, trim: true })
  campaignName!: string;

  @Prop({ required: true, trim: true })
  sheetUrl!: string;

  @Prop({ trim: true })
  sheetLink?: string;

  @Prop({ trim: true, default: '' })
  formLink?: string;

  // Per-campaign lead source label chosen by admin
  @Prop({ default: 'Meta Ads' })
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

export const MetaAdsCampaignSchema =
  SchemaFactory.createForClass(MetaAdsCampaign);
