import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from '../leads/leads.entity';

import { CallLog, CallLogSchema } from '../calls/calls.entity';

import { FollowUp, FollowUpSchema } from '../followups/followups.entity';

import { Project, ProjectSchema } from '../projects/projects.entity';
import { User, UserSchema } from '../users/user.entity';

import { DashboardController } from './dashboard.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Lead.name,
        schema: LeadSchema,
      },

      {
        name: CallLog.name,
        schema: CallLogSchema,
      },

      {
        name: FollowUp.name,
        schema: FollowUpSchema,
      },

      {
        name: Project.name,
        schema: ProjectSchema,
      },
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
  ],

  controllers: [DashboardController],
})
export class DashboardModule {}
