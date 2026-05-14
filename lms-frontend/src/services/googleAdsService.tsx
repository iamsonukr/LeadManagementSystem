import apiClient from './apiClient';
import { unwrapApi, normalizeLead } from './apiUtils';
import { Lead } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ColumnMapping {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  message?: string;
}

export interface GoogleAdsCampaign {
  _id: string;
  clientName: string;
  campaignName: string;
  sheetUrl: string;
  leadSource: string;
  columnMapping: ColumnMapping;
  syncStatus: 'idle' | 'syncing' | 'success' | 'error';
  lastSyncedAt?: string;
  lastSyncError?: string;
  totalLeadsImported: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCampaignPayload {
  clientName: string;
  campaignName: string;
  sheetUrl: string;
  leadSource?: string;
  columnMapping?: ColumnMapping;
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

export interface CampaignLeadsResult {
  campaign: GoogleAdsCampaign;
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CampaignLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const googleAdsService = {
  // ── Campaigns ─────────────────────────────────────────────────────

  getAll: async (): Promise<GoogleAdsCampaign[]> => {
    const { data } = await apiClient.get('/google-ads/campaigns');
    return unwrapApi<GoogleAdsCampaign[]>(data);
  },

  getById: async (id: string): Promise<GoogleAdsCampaign> => {
    const { data } = await apiClient.get(`/google-ads/campaigns/${id}`);
    return unwrapApi<GoogleAdsCampaign>(data);
  },

  create: async (payload: CreateCampaignPayload): Promise<GoogleAdsCampaign> => {
    const { data } = await apiClient.post('/google-ads/campaigns', payload);
    return unwrapApi<GoogleAdsCampaign>(data);
  },

  update: async (
    id: string,
    payload: Partial<CreateCampaignPayload> & { isActive?: boolean },
  ): Promise<GoogleAdsCampaign> => {
    const { data } = await apiClient.patch(`/google-ads/campaigns/${id}`, payload);
    return unwrapApi<GoogleAdsCampaign>(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/google-ads/campaigns/${id}`);
  },

  // ── Campaign Leads ─────────────────────────────────────────────────

  getCampaignLeads: async (
    campaignId: string,
    filters: CampaignLeadFilters = {},
  ): Promise<CampaignLeadsResult> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await apiClient.get(
      `/google-ads/campaigns/${campaignId}/leads?${params}`,
    );
    const payload = unwrapApi<{
      campaign: GoogleAdsCampaign;
      data: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(data);

    return {
      campaign: payload.campaign,
      data: payload.data.map(normalizeLead),
      total: payload.total,
      page: payload.page,
      limit: payload.limit,
      totalPages: payload.totalPages,
    };
  },

  // ── Sync ────────────────────────────────────────────────────────────

  sync: async (campaignId: string): Promise<SyncResult> => {
    const { data } = await apiClient.post(
      `/google-ads/campaigns/${campaignId}/sync`,
    );
    return unwrapApi<SyncResult>(data);
  },

  // ── Sheet preview (column mapping) ──────────────────────────────────

  previewHeaders: async (sheetUrl: string): Promise<{ headers: string[] }> => {
    const { data } = await apiClient.post('/google-ads/preview-headers', {
      sheetUrl,
    });
    return unwrapApi<{ headers: string[] }>(data);
  },
};

export default googleAdsService;