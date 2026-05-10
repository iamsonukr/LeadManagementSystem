import {
  Body,
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CallsService } from './calls.services';

import {
  CreateCallLogDto,
  UpdateCallLogDto,
  UpdateCallStatusDto,
  CallLogFilterDto,
} from './calls.dto';
import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/roles';

@Controller('calls')
@UseGuards(AuthGuard('jwt'))
export class CallsController {
  constructor(private readonly service: CallsService) {}

  @Get()
  findAll(@Query() query: CallLogFilterDto, @CurrentUser() user: RequestUser) {
    return this.service.findAll(query, user);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.findById(id, user);
  }

  @Post()
  create(@Body() dto: CreateCallLogDto, @CurrentUser() user: RequestUser) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCallLogDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.update(id, dto, user);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCallStatusDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.service.updateStatus(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.service.remove(id, user);
  }
}
