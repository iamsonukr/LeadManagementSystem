import apiClient from './apiClient';
import { unwrapApi, normalizeLead } from './apiUtils';
import { Lead } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetaAdsCampaign {
  _id: string;
  clientName: string;
  campaignName: string;
  pageId: string;
  formId?: string;
  adAccountId?: string;
  leadSource: string;
  syncStatus: 'idle' | 'syncing' | 'active' | 'error';
  lastSyncedAt?: string;
  lastSyncError?: string;
  totalLeadsImported: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMetaCampaignPayload {
  clientName: string;
  campaignName: string;
  pageId: string;
  formId?: string;
  adAccountId?: string;
  leadSource?: string;
}

export interface MetaSyncResult {
  campaignId: string;
  campaignName: string;
  imported: number;
  syncedAt: string;
}

export interface MetaCampaignLeadsResult {
  campaign: MetaAdsCampaign;
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface MetaCampaignLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const metaAdsService = {
  getAll: async (): Promise<MetaAdsCampaign[]> => {
    const { data } = await apiClient.get('/meta-ads/campaigns');
    return unwrapApi<MetaAdsCampaign[]>(data);
  },

  getById: async (id: string): Promise<MetaAdsCampaign> => {
    const { data } = await apiClient.get(`/meta-ads/campaigns/${id}`);
    return unwrapApi<MetaAdsCampaign>(data);
  },

  create: async (payload: CreateMetaCampaignPayload): Promise<MetaAdsCampaign> => {
    const { data } = await apiClient.post('/meta-ads/campaigns', payload);
    return unwrapApi<MetaAdsCampaign>(data);
  },

  update: async (
    id: string,
    payload: Partial<CreateMetaCampaignPayload> & { isActive?: boolean },
  ): Promise<MetaAdsCampaign> => {
    const { data } = await apiClient.patch(`/meta-ads/campaigns/${id}`, payload);
    return unwrapApi<MetaAdsCampaign>(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/meta-ads/campaigns/${id}`);
  },

  getCampaignLeads: async (
    campaignId: string,
    filters: MetaCampaignLeadFilters = {},
  ): Promise<MetaCampaignLeadsResult> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await apiClient.get(
      `/meta-ads/campaigns/${campaignId}/leads?${params}`,
    );
    const payload = unwrapApi<{
      campaign: MetaAdsCampaign;
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

  sync: async (campaignId: string): Promise<MetaSyncResult> => {
    const { data } = await apiClient.post(`/meta-ads/campaigns/${campaignId}/sync`);
    return unwrapApi<MetaSyncResult>(data);
  },
};

export default metaAdsService;
