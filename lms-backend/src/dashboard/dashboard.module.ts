import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Lead, LeadSchema } from 'src/leads/leads.entity';

import { CallLog, CallLogSchema } from 'src/calls/calls.entity';

import { FollowUp, FollowUpSchema } from 'src/followups/followups.entity';

import { Project, ProjectSchema } from 'src/projects/projects.entity';

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
    ]),
  ],

  controllers: [DashboardController],
})
export class DashboardModule {}
