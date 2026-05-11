import apiClient from './apiClient';
import {
  CallLog,
  Company,
  Contact,
  FollowUpRecord,
  Lead,
  ProjectRecord,
  TeamMemberRecord,
  UserAssignments,
  UserRecord,
} from '@/types';
import {
  deriveCompaniesFromLeads,
  normalizeCall,
  normalizeFollowUp,
  normalizeLead,
  normalizeProject,
  normalizeTeamMember,
  normalizeUser,
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
export const teamMembersService = {
  getAll: async (): Promise<TeamMemberRecord[]> => {
    const { data } = await apiClient.get('/departments');
    return unwrapApi<unknown[]>(data).map(normalizeTeamMember);
  },

  create: async (
    payload: Omit<TeamMemberRecord, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TeamMemberRecord> => {
    const { data } = await apiClient.post('/departments', {
      name: payload.fullName,
      description: payload.currentProject,
      status: payload.status,
    });
    return normalizeTeamMember(unwrapApi<unknown>(data));
  },

  update: async (
    id: string,
    payload: Partial<TeamMemberRecord>,
  ): Promise<TeamMemberRecord> => {
    const { data } = await apiClient.patch(`/departments/${id}`, {
      name: payload.fullName,
      description: payload.currentProject,
      status: payload.status,
    });
    return normalizeTeamMember(unwrapApi<unknown>(data));
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/departments/${id}`);
  },
};

const toUserApiPayload = (
  payload: Partial<UserRecord> & { password?: string },
) => {
  const [firstName = '', ...lastNameParts] = String(payload.name ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return {
    firstName,
    lastName: lastNameParts.join(' ') || firstName,
    email: payload.email,
    password: payload.password,
    role: payload.role,
    department: payload.department,
    phone: payload.phone,
    status: payload.status,
  };
};

export const usersService = {
  getAll: async (): Promise<UserRecord[]> => {
    const { data } = await apiClient.get('/users');
    return unwrapApi<unknown[]>(data).map(normalizeUser);
  },

  getById: async (id: string): Promise<UserRecord> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return normalizeUser(unwrapApi<unknown>(data));
  },

  create: async (
    payload: Omit<UserRecord, 'id' | 'createdAt' | 'updatedAt'> & { password: string },
  ): Promise<UserRecord> => {
    const { data } = await apiClient.post('/users', toUserApiPayload(payload));
    return normalizeUser(unwrapApi<unknown>(data));
  },

  update: async (id: string, payload: Partial<UserRecord>): Promise<UserRecord> => {
    const { data } = await apiClient.patch(`/users/${id}`, toUserApiPayload(payload));
    return normalizeUser(unwrapApi<unknown>(data));
  },

  changePassword: async (id: string, password: string): Promise<void> => {
    await apiClient.patch(`/users/${id}/password`, { password });
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/users/${id}`);
  },

  getProjectsForUser: async (id: string): Promise<ProjectRecord[]> => {
    const { data } = await apiClient.get(`/users/${id}/projects`);
    return unwrapApi<unknown[]>(data).map(normalizeProject);
  },

  getAssignmentsForUser: async (id: string): Promise<UserAssignments> => {
    const { data } = await apiClient.get(`/users/${id}/assignments`);
    const payload = unwrapApi<{ leads?: unknown[]; projects?: unknown[] }>(data);

    return {
      leads: (payload.leads ?? []).map(normalizeLead),
      projects: (payload.projects ?? []).map(normalizeProject),
    };
  },
};
