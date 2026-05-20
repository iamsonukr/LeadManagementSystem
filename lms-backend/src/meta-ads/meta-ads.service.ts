import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as crypto from 'crypto';

import {
  MetaAdsCampaign,
  MetaAdsCampaignDocument,
} from './meta-ads-campaign.entity';
import {
  CreateMetaAdsCampaignDto,
  UpdateMetaAdsCampaignDto,
} from './meta-ads.dto';
import { Lead, LeadDocument } from '../leads/leads.entity';

export interface LeadResult {
  campaignId: string;
  campaignName: string;
  imported: number;
  syncedAt: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class MetaAdsService {
  private readonly logger = new Logger(MetaAdsService.name);

  constructor(
    @InjectModel(MetaAdsCampaign.name)
    private readonly campaignModel: Model<MetaAdsCampaignDocument>,

    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // CAMPAIGN CRUD
  // ══════════════════════════════════════════════════════════════════

  async createCampaign(dto: CreateMetaAdsCampaignDto) {
    const campaign = await this.campaignModel.create({
      clientName: dto.clientName,
      campaignName: dto.campaignName,
      pageId: dto.pageId,
      formId: dto.formId ?? '',
      adAccountId: dto.adAccountId ?? '',
      leadSource: dto.leadSource ?? 'Meta Ads',
      syncStatus: 'idle',
    });
    return campaign;
  }

  async getAllCampaigns() {
    return this.campaignModel.find().sort({ createdAt: -1 }).lean();
  }

  async getCampaignById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid campaign id');
    const campaign = await this.campaignModel.findById(id).lean();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateMetaAdsCampaignDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid campaign id');
    const campaign = await this.campaignModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async deleteCampaign(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid campaign id');
    await this.campaignModel.findByIdAndDelete(id);
    return { message: 'Campaign deleted' };
  }

  // ══════════════════════════════════════════════════════════════════
  // LEADS FOR A CAMPAIGN
  // ══════════════════════════════════════════════════════════════════

  async getCampaignLeads(
    campaignId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      priority?: string;
    } = {},
  ) {
    const campaign = await this.getCampaignById(campaignId);
    const { page = 1, limit = 50, search, status, priority } = query;

    const filter: Record<string, unknown> = {
      'metadata.campaignId': campaignId,
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
      this.leadModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      this.leadModel.countDocuments(filter),
    ]);

    return {
      campaign,
      data,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / Number(limit)),
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // WEBHOOK — Verification (GET)
  // ══════════════════════════════════════════════════════════════════

  verifyWebhook(mode: string, token: string, challenge: string): string {
    if (mode === 'subscribe' && token === process.env.FB_WEBHOOK_VERIFY_TOKEN) {
      console.log("This is Meta code", process.env.FB_WEBHOOK_VERIFY_TOKEN);
      this.logger.log('Facebook webhook verified');
      return challenge;
    }
    throw new UnauthorizedException('Webhook verification failed');
  }

  // ══════════════════════════════════════════════════════════════════
  // WEBHOOK — Incoming Event (POST)
  // ══════════════════════════════════════════════════════════════════

  async handleWebhookEvent(body: any, signature: string): Promise<{ status: string }> {
    this.validateSignature(JSON.stringify(body), signature);

    if (body.object === 'page') {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          if (change.field === 'leadgen') {
            const { leadgen_id, page_id, form_id } = change.value;
            await this.fetchAndSaveLead(leadgen_id, page_id, form_id);
          }
        }
      }
    }
    return { status: 'ok' };
  }

  // ══════════════════════════════════════════════════════════════════
  // FETCH LEAD from Facebook Graph API & Save
  // ══════════════════════════════════════════════════════════════════

  private async fetchAndSaveLead(leadId: string, pageId: string, formId: string) {
    try {
      const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
      const res = await fetch(
        `https://graph.facebook.com/v19.0/${leadId}?access_token=${accessToken}`,
      );

      if (!res.ok) {
        throw new Error(`Graph API error: ${res.status} ${await res.text()}`);
      }

      const data = (await res.json()) as {
        id: string;
        form_id: string;
        created_time: string;
        field_data: { name: string; values: string[] }[];
      };

      const fields = this.parseFieldData(data.field_data);

      // Find the campaign linked to this page (and optionally form)
      const campaign = await this.campaignModel.findOne({
        pageId,
        isActive: true,
        $or: [
          { formId: formId },
          { formId: '' },
          { formId: { $exists: false } },
        ],
      });

      const campaignId = campaign ? String(campaign._id) : undefined;
      const campaignName = campaign?.campaignName ?? 'Meta Ads';
      const leadSource = campaign?.leadSource ?? 'Meta Ads';

      // Deduplicate by email or phone
      const email = (fields['email'] ?? '').toLowerCase().trim();
      const phone = (fields['phone_number'] ?? fields['phone'] ?? '').trim();

      if (email || phone) {
        const dupeQuery: Record<string, unknown>[] = [];
        if (email) dupeQuery.push({ email });
        if (phone) dupeQuery.push({ phone });

        const existing = await this.leadModel.findOne({ $or: dupeQuery });
        if (existing) {
          this.logger.log(`Lead duplicate skipped: ${email || phone}`);
          return;
        }
      }

      // Save lead
      const lead = await this.leadModel.create({
        name: fields['full_name'] ?? fields['name'] ?? 'Unknown Lead',
        email: email || `fb.${leadId}@noemail.com`,
        phone: phone,
        company: fields['company_name'] ?? fields['company'] ?? '',
        source: leadSource,
        status: 'New',
        priority: 'Medium',
        notes: `Facebook Lead Ad — Form: ${formId}`,
        tags: ['Meta Ads', campaignName],
        metadata: {
          source: 'Meta Ads',
          leadId,
          formId,
          pageId,
          campaignId: campaignId ?? '',
          campaignName,
          ...fields,
        },
      });

      // Update campaign stats
      if (campaign) {
        campaign.totalLeadsImported = (campaign.totalLeadsImported ?? 0) + 1;
        campaign.lastSyncedAt = new Date();
        campaign.syncStatus = 'active';
        await campaign.save();
      }

      this.logger.log(`Meta lead saved: ${lead.email} (leadId: ${leadId})`);
      return lead;
    } catch (err) {
      this.logger.error(`Failed to process lead ${leadId}: ${(err as Error).message}`);
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // MANUAL FETCH — pull recent leads from Graph API for a campaign
  // ══════════════════════════════════════════════════════════════════

  async manualSync(campaignId: string): Promise<LeadResult> {
    const campaign = await this.campaignModel.findById(campaignId);
    if (!campaign) throw new NotFoundException('Campaign not found');

    campaign.syncStatus = 'syncing';
    await campaign.save();

    try {
      const accessToken = process.env.FB_PAGE_ACCESS_TOKEN;
      const url = `https://graph.facebook.com/v19.0/${campaign.pageId}/leadgen_forms?access_token=${accessToken}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Graph API error ${res.status}: ${await res.text()}`);
      }

      const formsData = (await res.json()) as { data: { id: string }[] };
      const forms = formsData.data ?? [];

      let imported = 0;

      for (const form of forms) {
        // Skip if campaign is filtered to a specific form
        if (campaign.formId && campaign.formId !== form.id) continue;

        const leadsUrl = `https://graph.facebook.com/v19.0/${form.id}/leads?access_token=${accessToken}&limit=100`;
        const leadsRes = await fetch(leadsUrl);
        if (!leadsRes.ok) continue;

        const leadsData = (await leadsRes.json()) as {
          data: { id: string; created_time: string; field_data: { name: string; values: string[] }[] }[];
        };

        for (const lead of leadsData.data ?? []) {
          const fields = this.parseFieldData(lead.field_data);
          const email = (fields['email'] ?? '').toLowerCase().trim();
          const phone = (fields['phone_number'] ?? fields['phone'] ?? '').trim();

          if (!email && !phone) continue;

          const dupeQuery: Record<string, unknown>[] = [];
          if (email) dupeQuery.push({ email });
          if (phone) dupeQuery.push({ phone });
          const existing = await this.leadModel.findOne({ $or: dupeQuery });
          if (existing) continue;

          await this.leadModel.create({
            name: fields['full_name'] ?? fields['name'] ?? 'Unknown Lead',
            email: email || `fb.${lead.id}@noemail.com`,
            phone,
            company: fields['company_name'] ?? '',
            source: campaign.leadSource ?? 'Meta Ads',
            status: 'New',
            priority: 'Medium',
            notes: `Facebook Lead Ad — Form: ${form.id}`,
            tags: ['Meta Ads', campaign.campaignName],
            metadata: {
              source: 'Meta Ads',
              leadId: lead.id,
              formId: form.id,
              pageId: campaign.pageId,
              campaignId: String(campaign._id),
              campaignName: campaign.campaignName,
              ...fields,
            },
          });
          imported++;
        }
      }

      campaign.syncStatus = 'active';
      campaign.lastSyncedAt = new Date();
      campaign.totalLeadsImported = (campaign.totalLeadsImported ?? 0) + imported;
      campaign.lastSyncError = '';
      await campaign.save();

      return {
        campaignId: String(campaign._id),
        campaignName: campaign.campaignName,
        imported,
        syncedAt: campaign.lastSyncedAt.toISOString(),
      };
    } catch (err) {
      const message = (err as Error).message;
      campaign.syncStatus = 'error';
      campaign.lastSyncError = message;
      await campaign.save();
      throw err;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════

  private parseFieldData(fieldData: { name: string; values: string[] }[]): Record<string, string> {
    const result: Record<string, string> = {};
    for (const field of fieldData ?? []) {
      result[field.name] = field.values?.[0] ?? '';
    }
    return result;
  }

  private validateSignature(payload: string, signature: string) {
    const appSecret = process.env.FB_APP_SECRET;
    if (!appSecret) return; // Skip validation if secret not set
    if (!signature) throw new UnauthorizedException('Missing x-hub-signature-256');
    const expected = 'sha256=' + crypto
      .createHmac('sha256', appSecret)
      .update(payload)
      .digest('hex');
    if (signature !== expected) {
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
