import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CallLog, CallLogSchema } from './calls.entity';
import { FollowUp, FollowUpSchema } from '../followups/followups.entity';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CallLog.name, schema: CallLogSchema },
      { name: FollowUp.name, schema: FollowUpSchema },
    ]),
  ],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
