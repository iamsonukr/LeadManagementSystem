import apiClient from './apiClient';
import { Lead } from '@/types';
import { normalizeCall, normalizeLead, toPagination, unwrapApi } from './apiUtils';

export interface LeadFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  source?: string;
  priority?: string;
  assignedTo?: string;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface PaginatedLeads {
  data: Lead[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  convertedLeads: number;
  conversionRate: number;
  totalLeadsDelta: number;
  newLeadsDelta: number;
  convertedLeadsDelta: number;
  conversionRateDelta: number;
  byStatus: Array<{ _id: string; count: number }>;
  bySource: Array<{ _id: string; count: number }>;
  byAssignee: Array<{ _id: string; count: number }>;
  leadsOverTime: Array<{ _id: string; count: number }>;
  revenueGenerated: number;
  revenueDelta: number;
  followUpOverview: { total: number; pending: number; completed: number; overdue: number };
  callStats: { total: number; connected: number; notAnswered: number; callbackScheduled: number };
  projectStats: { total: number; totalBudget: number; totalReceived: number };
}

type BackendDashboardStats = {
  leads: {
    total: number;
    newLeads: number;
    converted: number;
    conversionRate: number;
    revenue: number;
    byStatus: Record<string, number>;
    bySource: Record<string, number>;
    byAssignee: Record<string, number>;
  };
  followUpOverview: DashboardStats['followUpOverview'];
  callStats: DashboardStats['callStats'];
  projectStats: DashboardStats['projectStats'];
};

const recordToRows = (record: Record<string, number> = {}) =>
  Object.entries(record).map(([_id, count]) => ({ _id, count }));

const leadsService = {
  getAll: async (filters: LeadFilters = {}): Promise<PaginatedLeads> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    const { data } = await apiClient.get(`/leads?${params}`);
    const payload = unwrapApi<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(data);
    const paginated = toPagination(payload);
    return { data: paginated.data.map(normalizeLead), pagination: paginated.pagination };
  },

  getById: async (id: string): Promise<{ lead: Lead; calls: unknown[] }> => {
    const { data } = await apiClient.get(`/leads/${id}`);
    const lead = normalizeLead(unwrapApi<unknown>(data));
    const callsResponse = await apiClient.get(`/calls?${new URLSearchParams({ lead: id, limit: '100' })}`);
    const callsPayload = unwrapApi<{ data: unknown[] }>(callsResponse.data);
    return { lead, calls: callsPayload.data.map(normalizeCall) };
  },

  create: async (payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.post('/leads', payload);
    return normalizeLead(unwrapApi<unknown>(data));
  },

  update: async (id: string, payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.patch(`/leads/${id}`, payload);
    return normalizeLead(unwrapApi<unknown>(data));
  },

  updateStatus: async (id: string, status: string): Promise<Lead> => {
    const { data } = await apiClient.patch(`/leads/${id}/status`, { status });
    return normalizeLead(unwrapApi<unknown>(data));
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/dashboard/stats');
    const stats = unwrapApi<BackendDashboardStats>(data);
    return {
      totalLeads: stats.leads.total,
      newLeads: stats.leads.newLeads,
      convertedLeads: stats.leads.converted,
      conversionRate: stats.leads.conversionRate,
      revenueGenerated: stats.leads.revenue,
      totalLeadsDelta: 0,
      newLeadsDelta: 0,
      convertedLeadsDelta: 0,
      conversionRateDelta: 0,
      revenueDelta: 0,
      byStatus: recordToRows(stats.leads.byStatus),
      bySource: recordToRows(stats.leads.bySource),
      byAssignee: recordToRows(stats.leads.byAssignee),
      leadsOverTime: [],
      followUpOverview: stats.followUpOverview,
      callStats: stats.callStats,
      projectStats: stats.projectStats,
    };
  },
};

export default leadsService;
