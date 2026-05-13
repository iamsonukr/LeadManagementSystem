import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { CurrentUser } from '../auth/current-user.decorator';
import { RequestUser } from '../auth/roles';
import { NotificationFilterDto } from './notifications.dto';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findAll(
    @Query() query: NotificationFilterDto,
    @CurrentUser() user: RequestUser,
  ) {
    return this.notificationsService.findAll(query, user);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: RequestUser) {
    return this.notificationsService.unreadCount(user);
  }

  @Post('check-reminders')
  checkReminders(@CurrentUser() user: RequestUser) {
    return this.notificationsService.checkReminders(user);
  }

  @Patch('read-all')
  markAllAsRead(@CurrentUser() user: RequestUser) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.notificationsService.markAsRead(id, user);
  }
}
