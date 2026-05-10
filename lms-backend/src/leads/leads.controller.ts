import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { LeadServices } from './leads.services';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequestUser, ROLES } from '../auth/roles';

import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  LeadFilterDto,
} from './leads.dto';

@Controller('leads')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class LeadController {
  constructor(private readonly service: LeadServices) {}

  // =========================================
  // Get All Leads
  // =========================================

  @Get()
  findAll(@Query() query: LeadFilterDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  // =========================================
  // Get Single Lead
  // =========================================

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findById(id, user);
  }

  // =========================================
  // Create Lead
  // =========================================

  @Post()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  // =========================================
  // Update Lead
  // =========================================

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user);
  }

  // =========================================
  // Update Lead Status
  // =========================================

  @Patch(':id/status')
  toggleStatus(
    @Param('id') id: string,
    @Body() dto: UpdateLeadStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.toggleStatus(id, dto, user);
  }

  // =========================================
  // Delete Lead
  // =========================================

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
