import {
  Body, Controller, Delete, Get, Param,
  Patch, Post, Query, UseGuards, Headers, HttpCode,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ROLES } from '../auth/roles';
import { WebsiteLeadsService } from './website-leads.service';
import { CreateWebsiteSourceDto, UpdateWebsiteSourceDto } from './website-leads.dto';

@ApiTags('Website Leads')
@Controller('website-leads')
export class WebsiteLeadsController {
  constructor(private readonly service: WebsiteLeadsService) {}

  // ─── Public endpoint — called by external websites ───────────────

  @Post('sources/:id/submit')
  @HttpCode(200)
  submitLead(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
    @Headers('origin') origin: string,
    @Headers('referer') referer: string,
  ) {
    // Use Origin header first, fall back to Referer
    return this.service.submitLead(id, body, origin || referer);
  }

  // ─── Dashboard stats — no source needed ──────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('stats')
  getDashboardStats() {
    return this.service.getDashboardStats();
  }

  // ─── Source CRUD ─────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Post('sources')
  createSource(@Body() dto: CreateWebsiteSourceDto) {
    return this.service.createSource(dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('sources')
  getAllSources() {
    return this.service.getAllSources();
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('sources/:id')
  getSource(@Param('id') id: string) {
    return this.service.getSourceById(id);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Patch('sources/:id')
  updateSource(@Param('id') id: string, @Body() dto: UpdateWebsiteSourceDto) {
    return this.service.updateSource(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN)
  @Delete('sources/:id')
  deleteSource(@Param('id') id: string) {
    return this.service.deleteSource(id);
  }

  // ─── Leads for a source ───────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @Get('sources/:id/leads')
  getSourceLeads(
    @Param('id') id: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('domain') domain?: string,
  ) {
    return this.service.getSourceLeads(id, {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
      search,
      status,
      priority,
      domain,
    });
  }
}
