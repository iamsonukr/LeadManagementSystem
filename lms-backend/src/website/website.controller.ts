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
  Headers,
  Res,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ROLES } from '../auth/roles';
import { MetaAdsService } from './website.service';
import { CreateMetaAdsCampaignDto, UpdateMetaAdsCampaignDto } from './website.dto';

@ApiTags('Meta Ads')
@Controller('meta-ads')
export class MetaAdsController {
  constructor(private readonly service: MetaAdsService) {}

  // ─── Facebook Webhook (no auth - public) ────────────────────────

  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const result = this.service.verifyWebhook(mode, token, challenge);
    return res.status(200).send(result);
  }

  @Post('webhook')
  @HttpCode(200)
  handleWebhook(
    @Body() body: any,
    @Headers('x-hub-signature-256') signature: string,
  ) {
    return this.service.handleWebhookEvent(body, signature);
  }

  // ─── Campaigns (protected) ────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Post('campaigns')
  @Roles(ROLES.ADMIN)
  createCampaign(@Body() dto: CreateMetaAdsCampaignDto) {
    return this.service.createCampaign(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('campaigns')
  getAllCampaigns() {
    return this.service.getAllCampaigns();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('campaigns/:id')
  getCampaign(@Param('id') id: string) {
    return this.service.getCampaignById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Patch('campaigns/:id')
  updateCampaign(@Param('id') id: string, @Body() dto: UpdateMetaAdsCampaignDto) {
    return this.service.updateCampaign(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN)
  @Delete('campaigns/:id')
  deleteCampaign(@Param('id') id: string) {
    return this.service.deleteCampaign(id);
  }

  // ─── Campaign Leads ────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('campaigns/:id/leads')
  getCampaignLeads(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.service.getCampaignLeads(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      status,
      priority,
    });
  }

  // ─── Manual Sync (pull from Graph API) ───────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Post('campaigns/:id/sync')
  manualSync(@Param('id') id: string) {
    return this.service.manualSync(id);
  }
}
