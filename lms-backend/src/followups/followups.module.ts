import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowUp, FollowUpSchema } from './followups.entity';
import { FollowupsController } from './followups.controller';
import { FollowupsServices } from './followups.services';
import { Lead, LeadSchema } from '../leads/leads.entity';
import { User, UserSchema } from '../users/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [FollowupsController],
  providers: [FollowupsServices],
  exports: [FollowupsServices],
})
export class FollowUpsModule {}
