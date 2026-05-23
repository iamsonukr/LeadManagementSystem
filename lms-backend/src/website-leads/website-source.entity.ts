import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WebsiteSourceDocument = WebsiteSource & Document;

// A single custom field mapping: website's field name → LMS field name
export interface CustomFieldMapping {
  websiteField: string;  // field name coming from the website form POST
  lmsField: string;      // which LMS field to map it to (or store in metadata)
  label: string;         // human-readable label shown in dashboard
}

@Schema({ timestamps: true, collection: 'website_sources' })
export class WebsiteSource {
  // Display name for this source
  @Prop({ required: true, trim: true })
  name!: string;

  // Domain(s) whitelisted to post to this source (e.g. "yogafitness.com")
  @Prop({ type: [String], default: [] })
  allowedDomains!: string[];

  // Standard field mappings: what the website calls each field
  // e.g. { nameField: 'your_name', emailField: 'contact_email', ... }
  @Prop({ trim: true, default: 'name' })
  nameField!: string;

  @Prop({ trim: true, default: 'email' })
  emailField!: string;

  @Prop({ trim: true, default: 'phone' })
  phoneField!: string;

  @Prop({ trim: true, default: 'message' })
  messageField!: string;

  // Custom extra fields the user defines
  @Prop({ type: [Object], default: [] })
  customFields!: CustomFieldMapping[];

  // What to tag leads from this source as
  @Prop({ default: 'Website' })
  leadSource!: string;

  // Stats
  @Prop({ default: 0 })
  totalLeadsReceived!: number;

  @Prop({ type: Date })
  lastLeadAt?: Date;

  @Prop({ default: true })
  isActive!: boolean;

  // If a POST comes from an unknown domain, flag it
  @Prop({ default: true })
  acceptUnknownDomains!: boolean;
}

export const WebsiteSourceSchema = SchemaFactory.createForClass(WebsiteSource);
