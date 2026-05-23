import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { WebsiteSource, WebsiteSourceDocument } from './website-source.entity';
import { CreateWebsiteSourceDto, UpdateWebsiteSourceDto } from './website-leads.dto';
import { Lead, LeadDocument } from '../leads/leads.entity';

const LEAD_ARRAY_FIELDS = new Set(['services', 'tags']);
const LEAD_NUMBER_FIELDS = new Set([
  'leadValue',
  'stageProbability',
  'budget',
  'aiScore',
  'callCount',
]);
const LEAD_DATE_FIELDS = new Set([
  'expectedCloseDate',
  'lastActivityAt',
  'lastContactedAt',
  'lastCallDate',
  'nextFollowUp',
]);
const LEAD_OBJECT_FIELDS = new Set(['address']);
const LEAD_OBJECT_ID_FIELDS = new Set(['assignedTo', 'department']);

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class WebsiteLeadsService {
  private readonly logger = new Logger(WebsiteLeadsService.name);

  constructor(
    @InjectModel(WebsiteSource.name)
    private readonly sourceModel: Model<WebsiteSourceDocument>,

    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // SOURCE CRUD
  // ══════════════════════════════════════════════════════════════════

  async createSource(dto: CreateWebsiteSourceDto) {
    return this.sourceModel.create({
      name: dto.name,
      allowedDomains: dto.allowedDomains ?? [],
      nameField: dto.nameField ?? 'name',
      emailField: dto.emailField ?? 'email',
      phoneField: dto.phoneField ?? 'phone',
      messageField: dto.messageField ?? 'message',
      customFields: dto.customFields ?? [],
      leadSource: dto.leadSource ?? 'Website',
      acceptUnknownDomains: dto.acceptUnknownDomains ?? true,
    });
  }

  async getAllSources() {
    const sources = await this.sourceModel.find().sort({ createdAt: -1 }).lean();

    // Attach per-source lead counts grouped by domain
    const enriched = await Promise.all(
      sources.map(async (s) => {
        const domainStats = await this.leadModel.aggregate([
          { $match: { 'metadata.sourceId': String(s._id) } },
          { $group: { _id: '$metadata.originDomain', count: { $sum: 1 } } },
        ]);
        return { ...s, domainStats };
      }),
    );

    return enriched;
  }

  async getSourceById(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid source id');
    const source = await this.sourceModel.findById(id).lean();
    if (!source) throw new NotFoundException('Website source not found');
    return source;
  }

  async updateSource(id: string, dto: UpdateWebsiteSourceDto) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid source id');
    const source = await this.sourceModel.findByIdAndUpdate(
      id, { $set: dto }, { new: true },
    );
    if (!source) throw new NotFoundException('Website source not found');
    return source;
  }

  async deleteSource(id: string) {
    if (!Types.ObjectId.isValid(id)) throw new BadRequestException('Invalid source id');
    await this.sourceModel.findByIdAndDelete(id);
    return { message: 'Source deleted' };
  }

  // ══════════════════════════════════════════════════════════════════
  // SUBMIT LEAD (called by external website)
  // ══════════════════════════════════════════════════════════════════

  async submitLead(
    sourceId: string,
    body: Record<string, unknown>,
    originHeader: string | undefined,
  ) {
    if (!Types.ObjectId.isValid(sourceId)) {
      throw new BadRequestException('Invalid source id');
    }

    const source = await this.sourceModel.findById(sourceId);
    if (!source || !source.isActive) {
      throw new NotFoundException('Website source not found or inactive');
    }

    // ── Domain check ─────────────────────────────────────────────
    const originDomain = this.extractDomain(originHeader ?? '');
    const isKnownDomain = source.allowedDomains.some((d) =>
      originDomain.includes(d) || d.includes(originDomain),
    );

    if (!isKnownDomain && !source.acceptUnknownDomains) {
      throw new ForbiddenException('Domain not whitelisted');
    }

    const domainTag = isKnownDomain ? originDomain : 'Unknown Source';

    // ── Extract standard fields using configured field names ──────
    const getString = (key: string) => {
      const value = body[key];
      if (typeof value === 'string') return value.trim();
      if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value).trim();
      }
      return '';
    };

    const standardName = getString(source.nameField) || getString('name') || getString('full_name') || '';
    const standardEmail = getString(source.emailField) || getString('email') || '';
    const standardPhone = getString(source.phoneField) || getString('phone') || getString('mobile') || '';
    const standardMessage = getString(source.messageField) || getString('message') || getString('notes') || '';

    const mappedLead: Record<string, unknown> = {};
    const mappedMetadata: Record<string, string> = {};

    for (const mapping of source.customFields ?? []) {
      const value = getString(mapping.websiteField);
      if (!value) continue;

      this.applyCustomFieldMapping(mapping, value, mappedLead, mappedMetadata);
    }

    const name = standardName || this.stringValue(mappedLead.name);
    const email = (standardEmail || this.stringValue(mappedLead.email)).toLowerCase();
    const phone = standardPhone || this.stringValue(mappedLead.phone);
    const message = standardMessage || this.stringValue(mappedLead.notes);

    if (!name && !email && !phone) {
      throw new BadRequestException('At least one of name, email, or phone is required');
    }

    // ── Deduplicate ───────────────────────────────────────────────
    if (email || phone) {
      const dupeQuery: Record<string, unknown>[] = [];
      if (email) dupeQuery.push({ email: email.toLowerCase() });
      if (phone) dupeQuery.push({ phone });
      const existing = await this.leadModel.findOne({ $or: dupeQuery });
      if (existing) {
        this.logger.log(`Duplicate lead skipped: ${email || phone}`);
        return { success: true, message: 'Lead already exists', duplicate: true };
      }
    }

    // ── Extract custom fields ─────────────────────────────────────
    const mappedTags = Array.isArray(mappedLead.tags) ? (mappedLead.tags as string[]) : [];

    // ── Save lead ─────────────────────────────────────────────────
    const lead = await this.leadModel.create({
      ...mappedLead,
      name: name || 'Website Lead',
      email: email || `website.${Date.now()}@noemail.com`,
      phone,
      notes: message,
      source: this.stringValue(mappedLead.source) || source.leadSource || 'Website',
      status: this.stringValue(mappedLead.status) || 'New',
      priority: this.stringValue(mappedLead.priority) || 'Medium',
      currency: this.stringValue(mappedLead.currency) || 'USD',
      tags: [...new Set(['Website', domainTag, source.name, ...mappedTags])],
      metadata: {
        source: 'Website',
        sourceId: String(source._id),
        sourceName: source.name,
        originDomain: domainTag,
        isKnownDomain: String(isKnownDomain),
        ...mappedMetadata,
      },
    });

    // ── Update source stats ───────────────────────────────────────
    source.totalLeadsReceived = (source.totalLeadsReceived ?? 0) + 1;
    source.lastLeadAt = new Date();
    await source.save();

    this.logger.log(`Website lead saved from ${domainTag}: ${lead.email}`);

    return {
      success: true,
      message: 'Lead received',
      leadId: String(lead._id),
    };
  }

  // ══════════════════════════════════════════════════════════════════
  // LEADS FOR A SOURCE
  // ══════════════════════════════════════════════════════════════════

  async getSourceLeads(
    sourceId: string,
    query: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
      priority?: string;
      domain?: string;
    } = {},
  ) {
    const source = await this.getSourceById(sourceId);
    const { page = 1, limit = 50, search, status, priority, domain } = query;

    const filter: Record<string, unknown> = {
      'metadata.sourceId': sourceId,
    };

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (domain) filter['metadata.originDomain'] = domain;

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

    return { source, data, total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / Number(limit)) };
  }

  // ══════════════════════════════════════════════════════════════════
  // DASHBOARD STATS
  // ══════════════════════════════════════════════════════════════════

  async getDashboardStats() {
    const sources = await this.sourceModel.find().lean();

    const stats = await Promise.all(
      sources.map(async (s) => {
        const [total, byDomain, recentLeads] = await Promise.all([
          this.leadModel.countDocuments({ 'metadata.sourceId': String(s._id) }),
          this.leadModel.aggregate([
            { $match: { 'metadata.sourceId': String(s._id) } },
            { $group: { _id: '$metadata.originDomain', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ]),
          this.leadModel
            .find({ 'metadata.sourceId': String(s._id) })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean(),
        ]);

        return {
          source: s,
          totalLeads: total,
          byDomain,
          recentLeads,
        };
      }),
    );

    const totalAllSources = stats.reduce((acc, s) => acc + s.totalLeads, 0);
    return { sources: stats, totalAllSources };
  }

  // ══════════════════════════════════════════════════════════════════
  // HELPERS
  // ══════════════════════════════════════════════════════════════════

  private applyCustomFieldMapping(
    mapping: { websiteField: string; lmsField?: string },
    value: string,
    lead: Record<string, unknown>,
    metadata: Record<string, string>,
  ) {
    const target = (mapping.lmsField || 'metadata.custom').trim();

    if (target === 'metadata' || target === 'metadata.custom') {
      metadata[mapping.websiteField] = value;
      return;
    }

    if (target.startsWith('metadata.')) {
      const metadataKey = target.slice('metadata.'.length).trim();
      metadata[metadataKey || mapping.websiteField] = value;
      return;
    }

    const coerced = this.coerceLeadValue(target, value);
    if (coerced === undefined) return;

    this.setNestedLeadValue(lead, target, coerced);
  }

  private coerceLeadValue(fieldPath: string, value: string): unknown {
    const field = fieldPath.split('.')[0];

    if (LEAD_ARRAY_FIELDS.has(field)) {
      return value
        .split(/[,;\n]/)
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (LEAD_NUMBER_FIELDS.has(field)) {
      const parsed = Number(value.replace(/,/g, ''));
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    if (LEAD_DATE_FIELDS.has(field)) {
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }

    if (LEAD_OBJECT_ID_FIELDS.has(field)) {
      return Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : undefined;
    }

    if (LEAD_OBJECT_FIELDS.has(field) && !fieldPath.includes('.')) {
      try {
        return JSON.parse(value) as Record<string, unknown>;
      } catch {
        return { value };
      }
    }

    return value.trim();
  }

  private setNestedLeadValue(
    target: Record<string, unknown>,
    path: string,
    value: unknown,
  ) {
    const parts = path.split('.').map((part) => part.trim()).filter(Boolean);
    if (parts.length === 0) return;

    let cursor = target;
    for (let i = 0; i < parts.length - 1; i++) {
      const key = parts[i];
      const existing = cursor[key];
      if (!existing || typeof existing !== 'object' || Array.isArray(existing)) {
        cursor[key] = {};
      }
      cursor = cursor[key] as Record<string, unknown>;
    }

    cursor[parts[parts.length - 1]] = value;
  }

  private stringValue(value: unknown) {
    if (value === undefined || value === null) return '';
    return String(value).trim();
  }

  private extractDomain(origin: string): string {
    try {
      if (!origin) return 'unknown';
      const url = origin.startsWith('http') ? origin : `https://${origin}`;
      return new URL(url).hostname.replace(/^www\./, '');
    } catch {
      return origin.replace(/^www\./, '') || 'unknown';
    }
  }
}
