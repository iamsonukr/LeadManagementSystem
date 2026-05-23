import apiClient from './apiClient';
import { unwrapApi, normalizeLead } from './apiUtils';
import { Lead } from '@/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomFieldMapping {
  websiteField: string;
  lmsField: string;
  label: string;
}

export interface WebsiteSource {
  _id: string;
  name: string;
  allowedDomains: string[];
  nameField: string;
  emailField: string;
  phoneField: string;
  messageField: string;
  customFields: CustomFieldMapping[];
  leadSource: string;
  totalLeadsReceived: number;
  lastLeadAt?: string;
  isActive: boolean;
  acceptUnknownDomains: boolean;
  createdAt: string;
  updatedAt: string;
  domainStats?: { _id: string; count: number }[];
}

export interface CreateWebsiteSourcePayload {
  name: string;
  allowedDomains: string[];
  nameField?: string;
  emailField?: string;
  phoneField?: string;
  messageField?: string;
  customFields?: CustomFieldMapping[];
  leadSource?: string;
  acceptUnknownDomains?: boolean;
}

export interface SourceLeadsResult {
  source: WebsiteSource;
  data: Lead[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DomainStat { _id: string; count: number; }

export interface SourceStat {
  source: WebsiteSource;
  totalLeads: number;
  byDomain: DomainStat[];
  recentLeads: Lead[];
}

export interface DashboardStats {
  sources: SourceStat[];
  totalAllSources: number;
}

export interface SourceLeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  priority?: string;
  domain?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

const websiteLeadsService = {
  getAll: async (): Promise<WebsiteSource[]> => {
    const { data } = await apiClient.get('/website-leads/sources');
    return unwrapApi<WebsiteSource[]>(data);
  },

  getById: async (id: string): Promise<WebsiteSource> => {
    const { data } = await apiClient.get(`/website-leads/sources/${id}`);
    return unwrapApi<WebsiteSource>(data);
  },

  create: async (payload: CreateWebsiteSourcePayload): Promise<WebsiteSource> => {
    const { data } = await apiClient.post('/website-leads/sources', payload);
    return unwrapApi<WebsiteSource>(data);
  },

  update: async (
    id: string,
    payload: Partial<CreateWebsiteSourcePayload> & { isActive?: boolean },
  ): Promise<WebsiteSource> => {
    const { data } = await apiClient.patch(`/website-leads/sources/${id}`, payload);
    return unwrapApi<WebsiteSource>(data);
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/website-leads/sources/${id}`);
  },

  getSourceLeads: async (id: string, filters: SourceLeadFilters = {}): Promise<SourceLeadsResult> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    const { data } = await apiClient.get(`/website-leads/sources/${id}/leads?${params}`);
    const payload = unwrapApi<{
      source: WebsiteSource;
      data: unknown[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(data);
    return { ...payload, data: payload.data.map(normalizeLead) };
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/website-leads/stats');
    return unwrapApi<DashboardStats>(data);
  },
};

export default websiteLeadsService;
