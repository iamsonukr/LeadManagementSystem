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

import {
  CreateLeadDto,
  UpdateLeadDto,
  UpdateLeadStatusDto,
  LeadFilterDto,
} from './leads.dto';

@Controller('leads')
@UseGuards(AuthGuard('jwt'))
export class LeadController {
  constructor(private readonly service: LeadServices) {}

  // =========================================
  // Get All Leads
  // =========================================

  @Get()
  findAll(@Query() query: LeadFilterDto) {
    return this.service.findAll(query);
  }

  // =========================================
  // Get Single Lead
  // =========================================

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.service.findById(id);
  }

  // =========================================
  // Create Lead
  // =========================================

  @Post()
  create(@Body() dto: CreateLeadDto) {
    return this.service.create(dto);
  }

  // =========================================
  // Update Lead
  // =========================================

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.service.update(id, dto);
  }

  // =========================================
  // Update Lead Status
  // =========================================

  @Patch(':id/status')
  toggleStatus(@Param('id') id: string, @Body() dto: UpdateLeadStatusDto) {
    return this.service.toggleStatus(id, dto);
  }

  // =========================================
  // Delete Lead
  // =========================================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
