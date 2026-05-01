import apiClient from './apiClient';
import { CallLog, Contact, Company } from '@/types';

// ─── Calls ─────────────────────────────────────────────────────
export const callsService = {
  getAll: async (params: Record<string, string | number> = {}): Promise<{ data: CallLog[]; pagination: unknown }> => {
    const q = new URLSearchParams(Object.entries(params).map(([k, v]) => [k, String(v)]));
    const { data } = await apiClient.get(`/calls?${q}`);
    return { data: data.data, pagination: data.pagination };
  },

  getById: async (id: string): Promise<CallLog> => {
    const { data } = await apiClient.get(`/calls/${id}`);
    return data.data;
  },

  create: async (payload: Partial<CallLog> & { lead: string }): Promise<CallLog> => {
    const { data } = await apiClient.post('/calls', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<CallLog>): Promise<CallLog> => {
    const { data } = await apiClient.put(`/calls/${id}`, payload);
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/calls/${id}`);
  },

  getStats: async (): Promise<{
    byStatus: Array<{ _id: string; count: number }>;
    byDirection: Array<{ _id: string; count: number }>;
    totalThisWeek: number;
  }> => {
    const { data } = await apiClient.get('/calls/stats');
    return data.data;
  },
};

// ─── Contacts ──────────────────────────────────────────────────
export const contactsService = {
  getAll: async (search = ''): Promise<Contact[]> => {
    const { data } = await apiClient.get(`/contacts?search=${search}`);
    return data.data;
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
    const { data } = await apiClient.get(`/companies?search=${search}`);
    return data.data;
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
