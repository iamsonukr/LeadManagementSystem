import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
} from '@nestjs/common';
import { FollowupsServices } from './followups.services';
import {
  CreateFollowUpDto,
  UpdateFollowUpDto,
  FollowUpFilterDto,
  UpdateFollowUpStatusDto,
} from './followups.dto';

@Controller('followups')
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsServices) {}

  // ✅ Create FollowUp
  @Post()
  create(@Body() dto: CreateFollowUpDto) {
    return this.followupsService.create(dto);
  }

  // ✅ Get all (with filters + pagination)
  @Get()
  findAll(@Query() query: FollowUpFilterDto) {
    return this.followupsService.findAll(query);
  }

  // ✅ Get single FollowUp
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.followupsService.findOne(id);
  }

  // ✅ Update full FollowUp
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateFollowUpDto) {
    return this.followupsService.update(id, dto);
  }

  // ✅ Update only status (clean API design)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateFollowUpStatusDto) {
    return this.followupsService.updateStatus(id, dto.status);
  }

  // ✅ Delete FollowUp
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.followupsService.remove(id);
  }
}
