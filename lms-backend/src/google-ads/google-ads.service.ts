import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';

import {
  GoogleAdsCampaign,
  GoogleAdsCampaignDocument,
  ColumnMapping,
} from './google-ads-campaign.entity';
import {
  CreateGoogleAdsCampaignDto,
  UpdateGoogleAdsCampaignDto,
} from './google-ads.dto';
import { Lead, LeadDocument } from '../leads/leads.entity';

// ─── Types ───────────────────────────────────────────────────────────────────

interface SheetRow {
  [header: string]: string;
}

export interface SyncResult {
  campaignId: string;
  campaignName: string;
  rowsFetched: number;
  imported: number;
  skipped: number;
  errors: number;
  syncedAt: string;
}

// ─── Fuzzy header matching helpers ───────────────────────────────────────────

/**
 * Given a list of actual sheet headers and a mapping of our field → user-chosen header,
 * returns a resolved mapping: our field → actual matched header (or '' if not found).
 */
function resolveHeaders(
  sheetHeaders: string[],
  columnMapping: Partial<ColumnMapping>,
): Record<string, string> {
  const resolved: Record<string, string> = {};

  // For each configured field, find the exact matching sheet header (case-insensitive)
  for (const [field, mappedHeader] of Object.entries(columnMapping)) {
    if (!mappedHeader) continue;
    const match = sheetHeaders.find(
      (h) => h.trim().toLowerCase() === mappedHeader.trim().toLowerCase(),
    );
    resolved[field] = match ?? '';
  }

  // Auto-detect any fields still missing via fuzzy matching
  const autoDetect: Array<[string, (h: string) => boolean]> = [
    ['name',    (h) => /name|full.?name|contact.?name/i.test(h)],
    ['email',   (h) => /email|e.?mail/i.test(h)],
    ['phone',   (h) => /phone|mobile|contact.?no|number|cell/i.test(h)],
    ['company', (h) => /company|organisation|organization|firm|business/i.test(h)],
    ['message', (h) => /message|notes?|description|query|requirement/i.test(h)],
  ];

  for (const [field, test] of autoDetect) {
    if (!resolved[field]) {
      const match = sheetHeaders.find(test);
      resolved[field] = match ?? '';
    }
  }

  return resolved;
}

// ─── Google Sheets API helper ─────────────────────────────────────────────────

/**
 * Extracts the spreadsheet ID from any Google Sheets URL format.
 */
function extractSheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

/**
 * Builds the Google Sheets API v4 URL (no auth — only works for public sheets).
 */
function sheetsApiUrl(sheetId: string, range = 'Sheet1'): string {
  return `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?key=${process.env.GOOGLE_SHEETS_API_KEY ?? ''}`;
}

/**
 * Builds a published-CSV export URL from a Google Sheets URL.
 */
function csvExportUrl(url: string): string | null {
  const sheetId = extractSheetId(url);
  if (!sheetId) return null;

  // Check for gid (tab id) in URL
  const gidMatch = url.match(/[?&#]gid=(\d+)/);
  const gid = gidMatch ? gidMatch[1] : '0';

  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable()
export class GoogleAdsService {
  private readonly logger = new Logger(GoogleAdsService.name);

  constructor(
    @InjectModel(GoogleAdsCampaign.name)
    private readonly campaignModel: Model<GoogleAdsCampaignDocument>,

    @InjectModel(Lead.name)
    private readonly leadModel: Model<LeadDocument>,
  ) {}

  // ══════════════════════════════════════════════════════════════════
  // CAMPAIGN CRUD
  // ══════════════════════════════════════════════════════════════════

  async createCampaign(dto: CreateGoogleAdsCampaignDto) {
    const campaign = await this.campaignModel.create({
      clientName: dto.clientName,
      campaignName: dto.campaignName,
      sheetUrl: dto.sheetUrl,
      leadSource: dto.leadSource ?? 'Google Form',
      columnMapping: dto.columnMapping ?? {},
    });
    return campaign;
  }

  async getAllCampaigns() {
    return this.campaignModel.find().sort({ createdAt: -1 }).lean();
  }

  async getCampaignById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid campaign id');
    }
    const campaign = await this.campaignModel.findById(id).lean();
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async updateCampaign(id: string, dto: UpdateGoogleAdsCampaignDto) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid campaign id');
    }
    const campaign = await this.campaignModel.findByIdAndUpdate(
      id,
      { $set: dto },
      { new: true },
    );
    if (!campaign) throw new NotFoundException('Campaign not found');
    return campaign;
  }

  async deleteCampaign(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid campaign id');
    }
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
      source?: string;
      priority?: string;
    } = {},
  ) {
    const campaign = await this.getCampaignById(campaignId);
    const {
      page = 1,
      limit = 50,
      search,
      status,
      source,
      priority,
    } = query;

    const filter: Record<string, unknown> = {
      'metadata.campaignId': campaignId,
    };

    if (status) filter.status = status;
    if (source) filter.source = source;
    if (priority) filter.priority = priority;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [data, total] = await Promise.all([
      this.leadModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
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
  // SYNC — Manual trigger for a single campaign
  // ══════════════════════════════════════════════════════════════════

  async syncCampaign(id: string): Promise<SyncResult> {
    const campaign = await this.campaignModel.findById(id);
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Mark as syncing
    campaign.syncStatus = 'syncing';
    campaign.lastSyncError = '';
    await campaign.save();

    try {
      const rows = await this.fetchSheetRows(campaign.sheetUrl);
      const result = await this.importRows(campaign, rows);

      campaign.syncStatus = 'success';
      campaign.lastSyncedAt = new Date();
      campaign.totalLeadsImported = result.imported + (campaign.totalLeadsImported ?? 0);
      await campaign.save();

      return {
        campaignId: String(campaign._id),
        campaignName: campaign.campaignName,
        rowsFetched: result.rowsFetched,
        imported: result.imported,
        skipped: result.skipped,
        errors: result.errors,
        syncedAt: campaign.lastSyncedAt.toISOString(),
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      campaign.syncStatus = 'error';
      campaign.lastSyncError = message;
      await campaign.save();
      throw err;
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // AUTO-SYNC — every 15 minutes for all active campaigns
  // ══════════════════════════════════════════════════════════════════

  @Cron(CronExpression.EVERY_5_MINUTES) // runs every 5 min, but skips if last sync < 15m ago
  async autoSyncAll() {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
    const campaigns = await this.campaignModel.find({
      isActive: true,
      syncStatus: { $ne: 'syncing' },
      $or: [
        { lastSyncedAt: { $lt: fifteenMinAgo } },
        { lastSyncedAt: { $exists: false } },
      ],
    });

    for (const campaign of campaigns) {
      try {
        await this.syncCampaign(String(campaign._id));
        this.logger.log(`Auto-synced campaign: ${campaign.campaignName}`);
      } catch (err) {
        this.logger.warn(
          `Auto-sync failed for ${campaign.campaignName}: ${(err as Error).message}`,
        );
      }
    }
  }

  // ══════════════════════════════════════════════════════════════════
  // FETCH SHEET ROWS — tries Sheets API v4 first, falls back to CSV
  // ══════════════════════════════════════════════════════════════════

  async fetchSheetRows(url: string): Promise<SheetRow[]> {
    // Strategy 1: Google Sheets API v4 (needs API key in env)
    const apiKey = process.env.GOOGLE_SHEETS_API_KEY;
    const sheetId = extractSheetId(url);

    if (apiKey && sheetId) {
      try {
        return await this.fetchViaApiV4(sheetId, apiKey);
      } catch (err) {
        this.logger.warn(
          `Sheets API v4 failed, falling back to CSV: ${(err as Error).message}`,
        );
      }
    }

    // Strategy 2: Published CSV export URL
    const csvUrl = csvExportUrl(url) ?? url;
    try {
      return await this.fetchViaCsv(csvUrl);
    } catch (err) {
      throw new Error(
        `Could not fetch sheet data. Make sure the sheet is published to web (File → Share → Publish to Web → CSV). Error: ${(err as Error).message}`,
      );
    }
  }

  private async fetchViaApiV4(sheetId: string, apiKey: string): Promise<SheetRow[]> {
    const url = sheetsApiUrl(sheetId);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Sheets API returned ${res.status}: ${await res.text()}`);
    }
    const json = (await res.json()) as { values?: string[][] };
    const values = json.values ?? [];
    if (values.length < 2) return [];
    const [headers, ...dataRows] = values;
    return dataRows.map((row) => {
      const obj: SheetRow = {};
      headers.forEach((h, i) => { obj[h] = row[i] ?? ''; });
      return obj;
    });
  }

  private async fetchViaCsv(url: string): Promise<SheetRow[]> {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} when fetching CSV`);
    }
    const text = await res.text();
    return this.parseCsv(text);
  }

  // ══════════════════════════════════════════════════════════════════
  // IMPORT ROWS — deduplicate by phone/email, insert new leads
  // ══════════════════════════════════════════════════════════════════

  private async importRows(
    campaign: GoogleAdsCampaignDocument,
    rows: SheetRow[],
  ) {
    if (rows.length === 0) {
      return { rowsFetched: 0, imported: 0, skipped: 0, errors: 0 };
    }

    const headers = Object.keys(rows[0]);
    const resolved = resolveHeaders(headers, campaign.columnMapping ?? {});

    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (const row of rows) {
      try {
        const name = this.cell(row, resolved.name) || 'Unknown Lead';
        const email = this.cell(row, resolved.email).toLowerCase();
        const phone = this.cell(row, resolved.phone);
        const company = this.cell(row, resolved.company) || 'Unknown Company';
        const message = this.cell(row, resolved.message);

        // Skip rows with no useful contact info
        if (!email && !phone) {
          skipped++;
          continue;
        }

        // Duplicate check by email OR phone
        const duplicateQuery: Record<string, unknown>[] = [];
        if (email) duplicateQuery.push({ email });
        if (phone) duplicateQuery.push({ phone });

        const existing = await this.leadModel.findOne({ $or: duplicateQuery });
        if (existing) {
          skipped++;
          continue;
        }

        // Create the lead
        await this.leadModel.create({
          name,
          email: email || `noemail.${Date.now()}@unknown.com`,
          phone,
          company,
          source: campaign.leadSource ?? 'Google Form',
          status: 'New',
          priority: 'Medium',
          notes: message || `Imported via Google Form campaign: ${campaign.campaignName}`,
          tags: ['Google Form', campaign.campaignName],
          currency: 'USD',
          // Campaign metadata stored so we can filter by campaign
          'metadata.source': 'Google Form',
          'metadata.clientName': campaign.clientName,
          'metadata.campaignName': campaign.campaignName,
          'metadata.campaignId': String(campaign._id),
        });

        imported++;
      } catch (err) {
        errors++;
        this.logger.warn(`Row import error: ${(err as Error).message}`);
      }
    }

    return { rowsFetched: rows.length, imported, skipped, errors };
  }

  // ══════════════════════════════════════════════════════════════════
  // CSV PARSER — handles quoted fields, commas inside quotes
  // ══════════════════════════════════════════════════════════════════

  private parseCsv(text: string): SheetRow[] {
    const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
    if (lines.length < 2) return [];

    const parseRow = (line: string): string[] => {
      const fields: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (ch === ',' && !inQuotes) {
          fields.push(current);
          current = '';
        } else {
          current += ch;
        }
      }
      fields.push(current);
      return fields;
    };

    const headers = parseRow(lines[0]);
    const result: SheetRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = parseRow(lines[i]);
      const row: SheetRow = {};
      headers.forEach((h, idx) => {
        row[h.trim()] = (values[idx] ?? '').trim();
      });
      result.push(row);
    }

    return result;
  }

  private cell(row: SheetRow, header: string): string {
    if (!header) return '';
    return (row[header] ?? '').trim();
  }

  // ══════════════════════════════════════════════════════════════════
  // PREVIEW — fetch headers only, for the column mapping UI
  // ══════════════════════════════════════════════════════════════════

  async previewSheetHeaders(sheetUrl: string): Promise<{ headers: string[] }> {
    try {
      const rows = await this.fetchSheetRows(sheetUrl);
      const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
      return { headers };
    } catch (err) {
      throw new BadRequestException(
        `Cannot read sheet: ${(err as Error).message}`,
      );
    }
  }
}