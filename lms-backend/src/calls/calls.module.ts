import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallLog, CallLogSchema } from './calls.entity';
import { FollowUp, FollowUpSchema } from '../followups/followups.entity';
import { Lead, LeadSchema } from '../leads/leads.entity';
import { User, UserSchema } from '../users/user.entity';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
      { name: Lead.name, schema: LeadSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
