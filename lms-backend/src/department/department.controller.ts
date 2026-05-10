import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { ROLES } from '../auth/roles';

import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { DepartmentService } from './department.services';

import { CreateDepartmentDto, UpdateDepartmentDto } from './department.dto';

@ApiTags('Departments')
@Controller('departments')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles(ROLES.ADMIN)
export class DepartmentController {
  constructor(private readonly service: DepartmentService) {}

  // =========================================
  // Get All Departments
  // =========================================

  @Get()
  @ApiOperation({
    summary: 'Get all departments',
  })
  findAll() {
    return this.service.findAll();
  }

  // =========================================
  // Get Single Department
  // =========================================

  @Get(':id')
  @ApiOperation({
    summary: 'Get department by id',
  })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // =========================================
  // Create Department
  // =========================================

  @Post()
  @ApiOperation({
    summary: 'Create department',
  })
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  // =========================================
  // Update Department
  // =========================================

  @Patch(':id')
  @ApiOperation({
    summary: 'Update department',
  })
  update(
    @Param('id') id: string,

    @Body() dto: UpdateDepartmentDto,
  ) {
    return this.service.update(id, dto);
  }

  // =========================================
  // Delete Department
  // =========================================

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete department',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
