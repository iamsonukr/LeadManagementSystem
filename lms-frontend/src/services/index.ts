import apiClient from './apiClient';
import { CallLog, Company, Contact, FollowUpRecord, Lead, ProjectRecord } from '@/types';
import {
  deriveCompaniesFromLeads,
  normalizeCall,
  normalizeFollowUp,
  normalizeLead,
  normalizeProject,
  toPagination,
  unwrapApi,
} from './apiUtils';
import leadsService from './leadsService';

// ─── Calls ─────────────────────────────────────────────────────
export const callsService = {
  getAll: async (params: Record<string, string | number> = {}): Promise<{ data: CallLog[]; pagination: unknown }> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await apiClient.get(`/calls?${q}`);
    const payload = unwrapApi<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(data);
    const paginated = toPagination(payload);
    return { data: paginated.data.map(normalizeCall), pagination: paginated.pagination };
  },

  getById: async (id: string): Promise<CallLog> => {
    const { data } = await apiClient.get(`/calls/${id}`);
    return normalizeCall(unwrapApi<unknown>(data));
  },

  create: async (payload: Partial<CallLog> & { lead: string }): Promise<CallLog> => {
    const { data } = await apiClient.post('/calls', payload);
    return normalizeCall(unwrapApi<unknown>(data));
  },

  update: async (id: string, payload: Partial<CallLog>): Promise<CallLog> => {
    const { data } = await apiClient.patch(`/calls/${id}`, payload);
    return normalizeCall(unwrapApi<unknown>(data));
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/calls/${id}`);
  },

  getStats: async (): Promise<{
    byStatus: Array<{ _id: string; count: number }>;
    byDirection: Array<{ _id: string; count: number }>;
    totalThisWeek: number;
  }> => {
    const { data } = await apiClient.get('/dashboard/stats');
    const stats = unwrapApi<{ callStats: { total: number; connected: number; notAnswered: number; callbackScheduled: number } }>(data).callStats;
    return {
      byStatus: [
        { _id: 'Connected', count: stats.connected },
        { _id: 'Not Answered', count: stats.notAnswered },
        { _id: 'Callback Scheduled', count: stats.callbackScheduled },
      ],
      byDirection: [],
      totalThisWeek: stats.total,
    };
  },
};

export const followUpsService = {
  getAll: async (params: Record<string, string | number> = {}): Promise<{ data: FollowUpRecord[]; pagination: unknown }> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await apiClient.get(`/followups?${q}`);
    const payload = unwrapApi<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(data);
    const paginated = toPagination(payload);
    return { data: paginated.data.map(normalizeFollowUp), pagination: paginated.pagination };
  },
  create: async (payload: Partial<FollowUpRecord> & { lead: string }): Promise<FollowUpRecord> => {
    const { data } = await apiClient.post('/followups', payload);
    return normalizeFollowUp(unwrapApi<unknown>(data));
  },
  update: async (id: string, payload: Partial<FollowUpRecord>): Promise<FollowUpRecord> => {
    const { data } = await apiClient.patch(`/followups/${id}`, payload);
    return normalizeFollowUp(unwrapApi<unknown>(data));
  },
  updateStatus: async (id: string, status: FollowUpRecord['status']): Promise<FollowUpRecord> => {
    const { data } = await apiClient.patch(`/followups/${id}/status`, { status });
    return normalizeFollowUp(unwrapApi<unknown>(data));
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/followups/${id}`);
  },
};

export const projectsService = {
  getAll: async (params: Record<string, string | number> = {}): Promise<{ data: ProjectRecord[]; pagination: unknown }> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await apiClient.get(`/projects?${q}`);
    const payload = unwrapApi<{ data: unknown[]; total: number; page: number; limit: number; totalPages: number }>(data);
    const paginated = toPagination(payload);
    return { data: paginated.data.map(normalizeProject), pagination: paginated.pagination };
  },
  create: async (payload: Partial<ProjectRecord> & { lead: string }): Promise<ProjectRecord> => {
    const { data } = await apiClient.post('/projects', payload);
    return normalizeProject(unwrapApi<unknown>(data));
  },
  update: async (id: string, payload: Partial<ProjectRecord>): Promise<ProjectRecord> => {
    const { data } = await apiClient.patch(`/projects/${id}`, payload);
    return normalizeProject(unwrapApi<unknown>(data));
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/projects/${id}`);
  },
};

// ─── Contacts ──────────────────────────────────────────────────
export const contactsService = {
  getAll: async (search = ''): Promise<Contact[]> => {
    const { data } = await leadsService.getAll({ search, limit: 100 });
    return data.map((lead: Lead) => ({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      company: lead.company,
      role: lead.department || 'Lead',
      leadId: lead.id,
      createdAt: lead.createdAt,
    }));
  },

  getById: async (id: string): Promise<Contact> => {
    const { data } = await apiClient.get(`/contacts/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Contact>): Promise<Contact> => {
    const { data } = await apiClient.post('/contacts', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Contact>): Promise<Contact> => {
    const { data } = await apiClient.put(`/contacts/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/contacts/${id}`);
  },
};

// ─── Companies ─────────────────────────────────────────────────
export const companiesService = {
  getAll: async (search = ''): Promise<Company[]> => {
    const { data } = await leadsService.getAll({ search, limit: 100 });
    return deriveCompaniesFromLeads(data);
  },

  getById: async (id: string): Promise<Company> => {
    const { data } = await apiClient.get(`/companies/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Company>): Promise<Company> => {
    const { data } = await apiClient.post('/companies', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Company>): Promise<Company> => {
    const { data } = await apiClient.put(`/companies/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/companies/${id}`);
  },
};

// ─── Reports ───────────────────────────────────────────────────
export const reportsService = {
  getAll: async (from?: string, to?: string) => {
    const q = new URLSearchParams();
    if (from) q.set('from', from);
    if (to) q.set('to', to);
    const { data } = await apiClient.get(`/reports?${q}`);
    return data.data;
  },
};

// ─── Tasks ─────────────────────────────────────────────────────
export const tasksService = {
  getAll: async (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params);
    const { data } = await apiClient.get(`/tasks?${q}`);
    return data.data;
  },

  create: async (payload: Record<string, unknown>) => {
    const { data } = await apiClient.post('/tasks', payload);
    return data.data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put(`/tasks/${id}`, payload);
    return data.data;
  },

  toggle: async (id: string) => {
    const { data } = await apiClient.patch(`/tasks/${id}/toggle`);
    return data.data;
  },

  delete: async (id: string) => {
    await apiClient.delete(`/tasks/${id}`);
  },
};

// ─── Users ─────────────────────────────────────────────────────
export const usersService = {
  getAll: async () => {
    const { data } = await apiClient.get('/users');
    return data.data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.data;
  },

  update: async (id: string, payload: Record<string, unknown>) => {
    const { data } = await apiClient.put(`/users/${id}`, payload);
    return data.data;
  },

  deactivate: async (id: string) => {
    await apiClient.delete(`/users/${id}`);
  },
};
