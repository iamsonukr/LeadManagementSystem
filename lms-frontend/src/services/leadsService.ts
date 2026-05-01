import apiClient from './apiClient';
import { Lead } from '@/types';

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
  leadsOverTime: Array<{ _id: string; count: number }>;
}

const leadsService = {
  getAll: async (filters: LeadFilters = {}): Promise<PaginatedLeads> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v !== undefined && v !== '') params.set(k, String(v)); });
    const { data } = await apiClient.get(`/leads?${params}`);
    return { data: data.data, pagination: data.pagination };
  },

  getById: async (id: string): Promise<{ lead: Lead; calls: unknown[] }> => {
    const { data } = await apiClient.get(`/leads/${id}`);
    return data.data;
  },

  create: async (payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.post('/leads', payload);
    return data.data;
  },

  update: async (id: string, payload: Partial<Lead>): Promise<Lead> => {
    const { data } = await apiClient.put(`/leads/${id}`, payload);
    return data.data;
  },

  updateStatus: async (id: string, status: string): Promise<Lead> => {
    const { data } = await apiClient.patch(`/leads/${id}/status`, { status });
    return data.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/leads/${id}`);
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get('/leads/stats/dashboard');
    return data.data;
  },
};

export default leadsService;
