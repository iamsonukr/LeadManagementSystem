import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MetaAdsCampaignDocument = MetaAdsCampaign & Document;

@Schema({ timestamps: true, collection: 'meta_ads_campaigns' })
export class MetaAdsCampaign {
  @Prop({ required: true, trim: true })
  clientName!: string;

  @Prop({ required: true, trim: true })
  campaignName!: string;

  // Facebook Page ID this campaign is linked to
  @Prop({ required: true, trim: true })
  pageId!: string;

  // Optional: filter to a specific lead form ID (blank = all forms for the page)
  @Prop({ trim: true, default: '' })
  formId?: string;

  // Optional: ad account ID for reference
  @Prop({ trim: true, default: '' })
  adAccountId?: string;

  // Per-campaign lead source label
  @Prop({ default: 'Meta Ads' })
  leadSource!: string;

  // Webhook status: idle | active | error
  @Prop({ default: 'idle' })
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

export const MetaAdsCampaignSchema = SchemaFactory.createForClass(MetaAdsCampaign);
