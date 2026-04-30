import { Body, Controller, Get, Param, Patch, Post, Put } from '@nestjs/common';
import { TeamMemberServices } from './teamMember.services';
import { CreateTeamMemberDto, UpdateTeamMemberDto } from './teamMember.dto';

@Controller('team')
export class TeamMemberController {
  constructor(private readonly service: TeamMemberServices) {}

  @Get()
  findAllMembers() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findById(id);
  }

  @Post()
  create(@Body() dto: CreateTeamMemberDto) {
    return this.service.create(dto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.service.update(id, dto);
  }

  @Patch('/toggle-status/:id')
  toggleStatus(@Param('id') id: string, @Body() dto: UpdateTeamMemberDto) {
    return this.service.toggleStatus(id, dto);
  }
}
