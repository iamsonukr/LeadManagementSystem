import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ROLES } from '../auth/roles';
import { MetaAdsService } from './meta-ads.service';
import {
  CreateMetaAdsCampaignDto,
  UpdateMetaAdsCampaignDto,
} from './meta-ads.dto';

@ApiTags('Meta Ads')
@ApiBearerAuth()
@Controller('meta-ads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN, ROLES.MANAGER)
export class MetaAdsController {
  constructor(private readonly service: MetaAdsService) {}

  // ─── Campaigns ──────────────────────────────────────────────────

  @Post('campaigns')
  @Roles(ROLES.ADMIN)
  createCampaign(@Body() dto: CreateMetaAdsCampaignDto) {
    return this.service.createCampaign(dto);
  }

  @Get('campaigns')
  getAllCampaigns() {
    return this.service.getAllCampaigns();
  }

  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string) {
    return this.service.getCampaignById(id);
  }

  @Patch('campaigns/:id')
  @Roles(ROLES.ADMIN)
  updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateMetaAdsCampaignDto,
  ) {
    return this.service.updateCampaign(id, dto);
  }

  @Delete('campaigns/:id')
  @Roles(ROLES.ADMIN)
  deleteCampaign(@Param('id') id: string) {
    return this.service.deleteCampaign(id);
  }

  // ─── Campaign Leads ──────────────────────────────────────────────

  @Get('campaigns/:id/leads')
  getCampaignLeads(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Query('priority') priority?: string,
  ) {
    return this.service.getCampaignLeads(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      status,
      source,
      priority,
    });
  }

  // ─── Sync ────────────────────────────────────────────────────────

  @Post('campaigns/:id/sync')
  syncCampaign(@Param('id') id: string) {
    return this.service.syncCampaign(id);
  }

  // ─── Sheet Preview (for column mapping UI) ───────────────────────

  @Post('preview-headers')
  previewHeaders(@Body('sheetUrl') sheetUrl: string) {
    return this.service.previewSheetHeaders(sheetUrl);
  }
}