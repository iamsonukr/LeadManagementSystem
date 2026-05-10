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
import { ProjectsService } from './projects.services';
import {
  CreateProjectDto,
  ProjectFilterDto,
  UpdateProjectDto,
} from './projects.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { RequestUser, ROLES } from '../auth/roles';

@Controller('projects')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProjectsController {
  constructor(private readonly service: ProjectsService) {}

  @Get()
  findAll(@Query() query: ProjectFilterDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findById(id, user);
  }

  @Post()
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  create(@Body() dto: CreateProjectDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  @Roles(ROLES.ADMIN, ROLES.MANAGER)
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(ROLES.ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
