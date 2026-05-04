import { normalizeServices } from '@/lib/crm';
import { Lead } from '@/types';
import apiClient from './apiClient';
import leadsService from './leadsService';
import { unwrapApi } from './apiUtils';

export type IntegrationPlatform = 'trade-india' | 'whatsapp' | 'facebook' | 'linkedin';

type PlatformLead = {
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  company?: string;
  companyName?: string;
  source?: string;
  message?: string;
  notes?: string;
  services?: string[] | string;
  createdAt?: string;
};

const platformSourceMap: Record<IntegrationPlatform, Lead['source']> = {
  'trade-india': 'Trade India',
  whatsapp: 'WhatsApp',
  facebook: 'Facebook',
  linkedin: 'LinkedIn',
};

const normalizePlatformLeads = (payload: unknown): PlatformLead[] => {
  if (Array.isArray(payload)) return payload as PlatformLead[];
  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    if (Array.isArray(record.data)) return record.data as PlatformLead[];
    if (Array.isArray(record.leads)) return record.leads as PlatformLead[];
    if (Array.isArray(record.items)) return record.items as PlatformLead[];
  }
  return [];
};

const toLeadPayload = (item: PlatformLead, platform: IntegrationPlatform): Partial<Lead> => {
  const fullName = String(item.name || item.fullName || '').trim() || 'New Lead';
  const source = platformSourceMap[platform];
  const servicesText = Array.isArray(item.services) ? item.services.join(', ') : String(item.services || '');
  const message = String(item.message || item.notes || '').trim();
  const company = String(item.company || item.companyName || '').trim();

  return {
    name: fullName,
    email: String(item.email || '').trim(),
    phone: String(item.phone || item.mobile || '').trim(),
    company: company || 'Unknown Company',
    source,
    status: 'New',
    priority: 'Medium',
    services: normalizeServices(servicesText || 'Other'),
    department: '',
    assignedTo: '',
    leadValue: 0,
    budget: 0,
    currency: 'USD',
    stageProbability: 10,
    industry: '',
    companySize: '',
    address: {
      line1: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
    },
    tags: [source],
    aiScore: 0,
    callCount: 0,
    notes: message || `Imported from ${source}`,
  };
};

const endpointCandidates = (platform: IntegrationPlatform) => [
  `/integrations/${platform}/leads`,
  `/integrations/leads/${platform}`,
  `/integrations/leads?platform=${platform}`,
];

const integrationsService = {
  fetchPlatformLeads: async (platform: IntegrationPlatform, limit = 50): Promise<PlatformLead[]> => {
    const failures: string[] = [];

    for (const endpoint of endpointCandidates(platform)) {
      try {
        const separator = endpoint.includes('?') ? '&' : '?';
        const { data } = await apiClient.get(`${endpoint}${separator}limit=${limit}`);
        return normalizePlatformLeads(unwrapApi<unknown>(data));
      } catch (error) {
        failures.push((error as Error).message);
      }
    }

    throw new Error(failures[failures.length - 1] || 'Unable to fetch platform leads');
  },

  importPlatformLeads: async (platform: IntegrationPlatform, limit = 50): Promise<{ fetched: number; imported: number; failed: number }> => {
    const fetchedLeads = await integrationsService.fetchPlatformLeads(platform, limit);
    const candidates = fetchedLeads
      .map((item) => toLeadPayload(item, platform))
      .filter((item) => item.name || item.email || item.phone);

    const results = await Promise.allSettled(candidates.map((payload) => leadsService.create(payload)));
    const imported = results.filter((result) => result.status === 'fulfilled').length;

    return {
      fetched: fetchedLeads.length,
      imported,
      failed: candidates.length - imported,
    };
  },
};

export default integrationsService;
