import {
  CallLog,
  Company,
  FollowUpRecord,
  Lead,
  ProjectRecord,
  TeamMemberRecord,
  UserRecord,
} from '@/types';

type ApiEnvelope<T> = {
  success?: boolean;
  data: T;
  message?: string;
};

type PaginatedApi<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type MongoRef<T> = string | ({ _id?: string; id?: string } & Partial<T>);

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const toUniqueStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  return value
    .map((item) => String(item).trim())
    .filter((item) => {
      if (!item || seen.has(item)) return false;
      seen.add(item);
      return true;
    });
};

export const unwrapApi = <T>(response: ApiEnvelope<T> | T): T => {
  if (response && typeof response === 'object' && 'data' in response) {
    return (response as ApiEnvelope<T>).data;
  }
  return response as T;
};

export const toPagination = <T>(payload: PaginatedApi<T>) => ({
  data: payload.data,
  pagination: {
    page: payload.page,
    limit: payload.limit,
    total: payload.total,
    pages: payload.totalPages,
  },
});

export const getId = (value: unknown): string => {
  const record = asRecord(value);
  return String(record.id ?? record._id ?? '');
};

const getRefId = <T>(value: MongoRef<T> | undefined): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return getId(value);
};

const getDepartmentName = (value: unknown): string => {
  if (!value) return '';
  if (typeof value === 'string') return value;

  const record = asRecord(value);
  return String(record.name ?? record.title ?? record.department ?? '');
};

export const normalizeLead = (raw: unknown): Lead => {
  const item = asRecord(raw);
  const address = asRecord(item.address);

  return {
    id: getId(item),
    name: String(item.name ?? ''),
    email: String(item.email ?? ''),
    phone: String(item.phone ?? ''),
    company: String(item.company ?? ''),
    status: (item.status as Lead['status']) ?? 'New',
    services: Array.isArray(item.services) ? item.services.map(String) : [],
    source: (item.source as Lead['source']) ?? 'Other',
    priority: (item.priority as Lead['priority']) ?? 'Medium',
    assignedTo: String(item.assignedTo ?? ''),
    department: getDepartmentName(item.department),
    leadValue: Number(item.leadValue ?? 0),
    stageProbability: Number(item.stageProbability ?? 0),
    expectedCloseDate: item.expectedCloseDate ? String(item.expectedCloseDate) : undefined,
    lastActivityAt: item.lastActivityAt ? String(item.lastActivityAt) : undefined,
    lastContactedAt: item.lastContactedAt ? String(item.lastContactedAt) : undefined,
    nextAction: item.nextAction ? String(item.nextAction) : undefined,
    location: item.location ? String(item.location) : undefined,
    industry: String(item.industry ?? ''),
    companySize: String(item.companySize ?? ''),
    budget: Number(item.budget ?? 0),
    currency: String(item.currency ?? 'USD'),
    address: {
      line1: String(address.line1 ?? ''),
      line2: address.line2 ? String(address.line2) : undefined,
      city: String(address.city ?? ''),
      state: String(address.state ?? ''),
      postalCode: String(address.postalCode ?? ''),
      country: String(address.country ?? ''),
    },
    tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
    aiScore: Number(item.aiScore ?? 0),
    callCount: Number(item.callCount ?? 0),
    lastCallDate: item.lastCallDate ? String(item.lastCallDate) : undefined,
    nextFollowUp: item.nextFollowUp ? String(item.nextFollowUp) : undefined,
    notes: item.notes ? String(item.notes) : undefined,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? item.createdAt ?? new Date().toISOString()),
  };
};

export const normalizeCall = (raw: unknown): CallLog => {
  const item = asRecord(raw);
  const lead = asRecord(item.lead);

  return {
    id: getId(item),
    leadId: getRefId(item.lead as MongoRef<Lead>),
    leadName: String(lead.name ?? item.leadName ?? ''),
    leadCompany: lead.company ? String(lead.company) : item.leadCompany ? String(item.leadCompany) : undefined,
    status: (item.status as CallLog['status']) ?? 'Connected',
    direction: (item.direction as CallLog['direction']) ?? 'Outgoing',
    duration: Number(item.duration ?? 0),
    notes: String(item.notes ?? ''),
    callDate: item.callDate ? String(item.callDate) : undefined,
    discussionPoints: String(item.discussionPoints ?? ''),
    nextAction: String(item.nextAction ?? ''),
    followUpDate: item.followUpDate ? String(item.followUpDate) : undefined,
    calledBy: String(item.calledBy ?? ''),
    callbackDate: item.callbackDate ? String(item.callbackDate) : undefined,
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  };
};

export const normalizeFollowUp = (raw: unknown): FollowUpRecord => {
  const item = asRecord(raw);
  const lead = asRecord(item.lead);

  return {
    id: getId(item),
    leadId: getRefId(item.lead as MongoRef<Lead>),
    leadName: String(lead.name ?? item.leadName ?? ''),
    company: String(lead.company ?? item.company ?? ''),
    owner: String(item.owner ?? lead.assignedTo ?? ''),
    type: (item.type as FollowUpRecord['type']) ?? 'Call',
    status: (item.status as FollowUpRecord['status']) ?? 'Pending',
    priority:
      (item.priority as FollowUpRecord['priority']) ??
      ((lead.priority as FollowUpRecord['priority']) || 'Medium'),
    dueAt: String(item.dueAt ?? new Date().toISOString()),
    completedAt: item.completedAt ? String(item.completedAt) : undefined,
    notes: String(item.notes ?? ''),
    nextAction: String(item.nextAction ?? lead.nextAction ?? ''),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
  };
};

export const normalizeProject = (
  raw: unknown,
): ProjectRecord => {
  const item = asRecord(raw);

  const lead = asRecord(item.lead);
  const projectServices = toUniqueStringArray(item.services);
  const leadServices = toUniqueStringArray(lead.services);

  return {
    id: getId(item),

    leadId: String(lead._id ?? ''),

    // =========================================
    // Lead Data
    // =========================================

    name: String(lead.name ?? ''),

    client: String(lead.company ?? ''),

    services: projectServices.length ? projectServices : leadServices,

    budget: Number(lead.budget ?? 0),

    source:
      (lead.source as ProjectRecord['source']) ||
      'Other',

    // =========================================
    // Project Data
    // =========================================

    owner: String(item.owner ?? ''),

    status:
      (item.status as ProjectRecord['status']) ??
      'Kickoff',

    priority:
      (item.priority as ProjectRecord['priority']) ??
      ((lead.priority as ProjectRecord['priority']) ||
        'Medium'),

    amountReceived: Number(
      item.amountReceived ?? 0,
    ),

    startDate: String(
      item.startDate ??
        item.createdAt ??
        new Date().toISOString(),
    ),

    deliveryDate: item.deliveryDate
      ? String(item.deliveryDate)
      : undefined,

    lastMilestone: String(
      item.lastMilestone ?? '',
    ),

    paymentStatus:
      (item.paymentStatus as ProjectRecord['paymentStatus']) ??
      'Advance Pending',
  };
};

export const normalizeTeamMember = (raw: unknown): TeamMemberRecord => {
  const item = asRecord(raw);

  return {
    id: getId(item),
    fullName: String(item.fullName ?? item.name ?? ''),
    email: String(item.email ?? ''),
    phone: String(item.phone ?? ''),
    employeeId: String(item.employeeId ?? ''),
    role: String(item.role ?? ''),
    department: getDepartmentName(item.department),
    employmentType: (item.employmentType as TeamMemberRecord['employmentType']) ?? 'Full-time',
    joiningDate: String(item.joiningDate ?? ''),
    workLocation: String(item.workLocation ?? ''),
    reportingManager: String(item.reportingManager ?? ''),
    skills: Array.isArray(item.skills) ? item.skills.map(String) : [],
    currentProject: String(item.currentProject ?? item.description ?? ''),
    status: (item.status as TeamMemberRecord['status']) ?? 'Active',
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? item.createdAt ?? new Date().toISOString()),
  };
};

export const normalizeUser = (raw: unknown): UserRecord => {
  const item = asRecord(raw);
  const name = String(
    item.name ??
      [item.firstName, item.lastName].filter(Boolean).join(' ') ??
      '',
  ).trim();

  return {
    id: getId(item),
    name,
    email: String(item.email ?? ''),
    role: (item.role as UserRecord['role']) ?? 'Sales Executive',
    department: getDepartmentName(item.department),
    phone: String(item.phone ?? ''),
    status: (item.status as UserRecord['status']) ?? 'Active',
    leads: Number(item.leads ?? 0),
    createdAt: String(item.createdAt ?? new Date().toISOString()),
    updatedAt: String(item.updatedAt ?? item.createdAt ?? new Date().toISOString()),
  };
};

export const deriveCompaniesFromLeads = (leads: Lead[]): Company[] => {
  const companies = new Map<string, Company>();
  leads.forEach((lead) => {
    if (!lead.company) return;
    const key = lead.company.toLowerCase();
    const existing = companies.get(key);
    companies.set(key, {
      id: existing?.id ?? key.replace(/[^a-z0-9]+/g, '-'),
      name: lead.company,
      industry: existing?.industry || lead.industry || '',
      size: existing?.size || lead.companySize || '',
      website: existing?.website ?? '',
      address: existing?.address || lead.location || '',
      totalLeads: (existing?.totalLeads ?? 0) + 1,
      revenue: (existing?.revenue ?? 0) + (lead.status === 'Won' ? lead.leadValue || lead.budget : 0),
      createdAt: existing?.createdAt ?? lead.createdAt,
    });
  });
  return Array.from(companies.values());
};
