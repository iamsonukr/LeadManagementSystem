import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type IntegrationPlatform =
  | 'trade-india'
  | 'whatsapp'
  | 'facebook'
  | 'linkedin';

type IntegrationLead = {
  name: string;
  email: string;
  phone: string;
  company: string;
  source: string;
  message?: string;
  services?: string[] | string;
  createdAt: string;
};

type ProviderConfig = {
  url?: string;
  token?: string;
};

@Injectable()
export class IntegrationsService {
  constructor(private readonly configService: ConfigService) {}

  async fetchTradeIndiaLeads(limit = 50) {
    return this.fetchPlatformLeads('trade-india', limit);
  }

  async fetchWhatsappLeads(limit = 50) {
    return this.fetchPlatformLeads('whatsapp', limit);
  }

  async fetchFacebookLeads(limit = 50) {
    return this.fetchPlatformLeads('facebook', limit);
  }

  async fetchLinkedinLeads(limit = 50) {
    return this.fetchPlatformLeads('linkedin', limit);
  }

  async fetchPlatformLeads(platform: IntegrationPlatform, limit = 50) {
    const provider = this.getProviderConfig(platform);
    const leads = provider.url
      ? await this.fetchProviderLeads(provider, platform, limit)
      : this.getFallbackLeads(platform, limit);

    return {
      platform,
      count: leads.length,
      fetchedAt: new Date().toISOString(),
      leads,
    };
  }

  private getProviderConfig(platform: IntegrationPlatform): ProviderConfig {
    const key = platform.toUpperCase().replace('-', '_');
    return {
      url: this.configService.get<string>(`${key}_LEADS_URL`),
      token: this.configService.get<string>(`${key}_LEADS_TOKEN`),
    };
  }

  private async fetchProviderLeads(
    provider: ProviderConfig,
    platform: IntegrationPlatform,
    limit: number,
  ): Promise<IntegrationLead[]> {
    const requestUrl = new URL(provider.url as string);
    requestUrl.searchParams.set('limit', String(limit));

    const response = await fetch(requestUrl, {
      headers: {
        Accept: 'application/json',
        ...(provider.token
          ? { Authorization: `Bearer ${provider.token}` }
          : {}),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch ${platform} leads: ${response.status} ${response.statusText}`,
      );
    }

    const payload: unknown = await response.json();
    return this.extractLeads(payload)
      .slice(0, limit)
      .map((lead) => {
        const source = this.platformToSource(platform);
        return {
          name: this.asText(lead.name ?? lead.fullName, 'Unknown Lead'),
          email: this.asText(lead.email),
          phone: this.asText(lead.phone ?? lead.mobile ?? lead.contactNumber),
          company: this.asText(
            lead.company ?? lead.companyName,
            'Unknown Company',
          ),
          source,
          message: this.asText(lead.message ?? lead.notes),
          services: Array.isArray(lead.services)
            ? lead.services
                .map((value: unknown) => this.asText(value))
                .filter(Boolean)
            : this.asText(lead.services),
          createdAt: this.asText(lead.createdAt, new Date().toISOString()),
        };
      });
  }

  private extractLeads(payload: unknown): Array<Record<string, unknown>> {
    if (Array.isArray(payload)) {
      return payload.filter(this.isRecord);
    }

    if (!this.isRecord(payload)) {
      return [];
    }

    const dataCandidates = [
      payload.data,
      payload.leads,
      payload.items,
      payload.results,
    ];

    for (const candidate of dataCandidates) {
      if (Array.isArray(candidate)) {
        return candidate.filter(this.isRecord);
      }
    }

    return [];
  }

  private getFallbackLeads(
    platform: IntegrationPlatform,
    limit: number,
  ): IntegrationLead[] {
    const source = this.platformToSource(platform);
    const count = Math.min(limit, 10);

    return Array.from({ length: count }).map((_, index) => ({
      name: `${source} Lead ${index + 1}`,
      email: `${platform.replace('-', '')}.lead${index + 1}@example.com`,
      phone: `9000000${String(index + 1).padStart(3, '0')}`,
      company: `${source} Prospect ${index + 1}`,
      source,
      message: `Sample ${source} lead generated because provider URL is not configured.`,
      services: ['Website'],
      createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
    }));
  }

  private platformToSource(platform: IntegrationPlatform) {
    switch (platform) {
      case 'trade-india':
        return 'Trade India';
      case 'whatsapp':
        return 'WhatsApp';
      case 'facebook':
        return 'Facebook';
      case 'linkedin':
        return 'LinkedIn';
      default:
        return 'Other';
    }
  }

  private asText(value: unknown, fallback = ''): string {
    if (typeof value === 'string') return value.trim();
    if (typeof value === 'number') return String(value);
    return fallback;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return !!value && typeof value === 'object';
  }
}
