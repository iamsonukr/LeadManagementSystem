import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Notification, NotificationSchema } from './notifications.entity';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { FollowUp, FollowUpSchema } from '../followups/followups.entity';
import { Lead, LeadSchema } from '../leads/leads.entity';
import { User, UserSchema } from '../users/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
      { name: User.name, schema: UserSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Lead.name, schema: LeadSchema },
    ]),
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
