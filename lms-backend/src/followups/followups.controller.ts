import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FollowupsServices } from './followups.services';
import {
  CreateFollowUpDto,
  UpdateFollowUpDto,
  FollowUpFilterDto,
  UpdateFollowUpStatusDto,
} from './followups.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/roles';

@Controller('followups')
@UseGuards(AuthGuard('jwt'))
export class FollowupsController {
  constructor(private readonly followupsService: FollowupsServices) {}

  // ✅ Create FollowUp
  @Post()
  create(@Body() dto: CreateFollowUpDto, @CurrentUser() user: RequestUser) {
    return this.followupsService.create(dto, user);
  }

  // ✅ Get all (with filters + pagination)
  @Get()
  findAll(@Query() query: FollowUpFilterDto, @CurrentUser() user: RequestUser) {
    return this.followupsService.findAll(query, user);
  }

  // ✅ Get single FollowUp
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.followupsService.findOne(id, user);
  }

  // ✅ Update full FollowUp
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.followupsService.update(id, dto, user);
  }

  // ✅ Update only status (clean API design)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateFollowUpStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.followupsService.updateStatus(id, dto.status, user);
  }

  // ✅ Delete FollowUp
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.followupsService.remove(id, user);
  }
}
