import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';

import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequestUser, ROLES } from '../auth/roles';
import { CurrentUser } from '../auth/current-user.decorator';

import { ApiTags, ApiOperation } from '@nestjs/swagger';

import { CreateUserDto, UpdateUserDto, ChangePasswordDto } from './user.dto';

import { UsersService } from './user.services';

@ApiTags('Users')
@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // =========================================
  // Get All Users
  // =========================================

  @Get()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Get all CRM users',
  })
  findAll(@CurrentUser() user: RequestUser) {
    return this.service.findAll(user);
  }

  // =========================================
  // Get Single User
  // =========================================

  @Get(':id')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Get user by id',
  })
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findOne(id, user);
  }

  // =========================================
  // Get Projects for User
  // =========================================

  @Get(':id/projects')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Get projects assigned to a user',
  })
  getProjectsForUser(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.getProjectsForUser(id, user);
  }

  // =========================================
  // Get Assignments for User
  // =========================================

  @Get(':id/assignments')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  @ApiOperation({
    summary: 'Get leads and projects assigned to a user',
  })
  getAssignmentsForUser(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.getAssignmentsForUser(id, user);
  }

  // =========================================
  // Create User
  // =========================================

  @Post()
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Create CRM user',
  })
  create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  // =========================================
  // Update User
  // =========================================

  @Patch(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Update CRM user',
  })
  update(
    @Param('id') id: string,

    @Body() dto: UpdateUserDto,
  ) {
    return this.service.update(id, dto);
  }

  // =========================================
  // Change Password
  // =========================================

  @Patch(':id/password')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Change user password',
  })
  changePassword(
    @Param('id') id: string,

    @Body() dto: ChangePasswordDto,
  ) {
    return this.service.changePassword(id, dto);
  }

  // =========================================
  // Delete User
  // =========================================

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  @ApiOperation({
    summary: 'Delete CRM user',
  })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
