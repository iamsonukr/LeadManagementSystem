import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FollowUp, FollowUpSchema } from './followups.entity';
import { FollowupsController } from './followups.controller';
import { FollowupsServices } from './followups.services';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: FollowUp.name, schema: FollowUpSchema },
    ]),
  ],
  controllers: [FollowupsController],
  providers: [FollowupsServices],
  exports: [FollowupsServices],
})
export class FollowUpsModule {}
