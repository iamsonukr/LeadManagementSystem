import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationLeadQueryDto } from './integrations.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('Integrations')
@ApiBearerAuth()
@Controller('integrations')
@UseGuards(AuthGuard('jwt'))
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('trade-india/leads')
  fetchTradeIndiaLeads(@Query() query: IntegrationLeadQueryDto) {
    return this.integrationsService.fetchTradeIndiaLeads(query.limit);
  }

  @Get('whatsapp/leads')
  fetchWhatsappLeads(@Query() query: IntegrationLeadQueryDto) {
    return this.integrationsService.fetchWhatsappLeads(query.limit);
  }

  @Get('facebook/leads')
  fetchFacebookLeads(@Query() query: IntegrationLeadQueryDto) {
    return this.integrationsService.fetchFacebookLeads(query.limit);
  }

  @Get('linkedin/leads')
  fetchLinkedinLeads(@Query() query: IntegrationLeadQueryDto) {
    return this.integrationsService.fetchLinkedinLeads(query.limit);
  }
}

