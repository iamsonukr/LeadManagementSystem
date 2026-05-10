import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Lead, LeadSchema } from './leads.entity';

import { LeadController } from './leads.controller';

import { LeadServices } from './leads.services';

import { Project, ProjectSchema } from '../projects/projects.entity';
import { FollowUp, FollowUpSchema } from '../followups/followups.entity';
import { CallLog, CallLogSchema } from '../calls/calls.entity';
import { User, UserSchema } from '../users/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Lead.name,
        schema: LeadSchema,
      },
      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: FollowUp.name,
        schema: FollowUpSchema,
      },
      {
        name: CallLog.name,
        schema: CallLogSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [LeadController],

  providers: [LeadServices],

  exports: [LeadServices],
})
export class LeadsModule {}
