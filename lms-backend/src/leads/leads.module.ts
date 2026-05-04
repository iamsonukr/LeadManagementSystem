import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Lead, LeadSchema } from './leads.entity';

import { LeadController } from './leads.controller';

import { LeadServices } from './leads.services';

import {
  Project,
  ProjectSchema,
} from '../projects/projects.entity';
import {
  FollowUp,
  FollowUpSchema,
} from '../followups/followups.entity';

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
    ]),
  ],

  controllers: [LeadController],

  providers: [LeadServices],

  exports: [LeadServices],
})
export class LeadsModule {}
