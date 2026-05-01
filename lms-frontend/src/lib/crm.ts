import { Lead, LeadSource, LeadStatus, ProjectRecord } from '@/types';

export const leadStatusOptions: LeadStatus[] = [
  'New',
  'Contacted',
  'Qualified',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'On Hold',
  'Duplicate',
  'Spam',
];

export const leadSourceOptions: LeadSource[] = [
  'Website',
  'Referral',
  'Social Media',
  'Paid Ads',
  'Email Campaign',
  'Trade India',
  'WhatsApp',
  'Facebook',
  'LinkedIn',
  'Other',
];

export const serviceCategoryOptions = [
  'Website',
  'Google SEO',
  'Sales CRM',
  'Mobile Application',
  'Social Media Marketing',
  'Google Ads',
  'Meta Ads',
  'YouTube Ads',
  'Corporate Film',
  'Product Film',
  'Other',
] as const;

export function normalizeServices(value: string) {
  const allowed = new Set<string>(serviceCategoryOptions);
  const services = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      if (allowed.has(item)) return item;

      const lower = item.toLowerCase();
      if (lower.includes('seo')) return 'Google SEO';
      if (lower.includes('crm')) return 'Sales CRM';
      if (lower.includes('mobile') || lower.includes('application') || lower.includes('app')) return 'Mobile Application';
      if (lower.includes('social')) return 'Social Media Marketing';
      if (lower.includes('google ads')) return 'Google Ads';
      if (lower.includes('meta')) return 'Meta Ads';
      if (lower.includes('youtube')) return 'YouTube Ads';
      if (lower.includes('corporate')) return 'Corporate Film';
      if (lower.includes('product film') || lower.includes('video')) return 'Product Film';
      if (lower.includes('website') || lower.includes('web')) return 'Website';
      return 'Other';
    });

  return Array.from(new Set(services));
}

export const projectLeadStatuses = new Set<LeadStatus>(['Won']);

export function hasProjectStage(lead: Lead) {
  return projectLeadStatuses.has(lead.status);
}

export function deriveProjectsFromLeads(leads: Lead[], projects: ProjectRecord[]): ProjectRecord[] {
  return leads
    .filter(hasProjectStage)
    .map((lead) => {
      const existing = projects.find((project) => project.leadId === lead.id);

      return existing ?? {
        id: `proj-${lead.id}`,
        leadId: lead.id,
        name: `${lead.company} - ${lead.services[0] ?? 'Project'}`,
        client: lead.company,
        service: lead.services.join(', ') || 'General Services',
        owner: lead.assignedTo,
        status: 'Kickoff' as ProjectRecord['status'],
        priority: lead.priority,
        budget: lead.leadValue || lead.budget,
        amountReceived: 0,
        startDate: lead.expectedCloseDate ?? lead.updatedAt,
        deliveryDate: undefined,
        lastMilestone: lead.nextAction || 'Awaiting kickoff planning',
        paymentStatus: 'Advance Pending' as ProjectRecord['paymentStatus'],
        source: lead.source,
      };
    });
}
