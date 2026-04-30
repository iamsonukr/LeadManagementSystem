import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Lead, LeadDocument } from '../leads/leads.entity';

import { CallLog, CallLogDocument } from '../calls/calls.entity';

import { FollowUp, FollowUpDocument } from '../followups/followups.entity';

import { Project, ProjectDocument } from '../projects/projects.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(
    @InjectModel(Lead.name)
    private leadModel: Model<LeadDocument>,

    @InjectModel(CallLog.name)
    private callModel: Model<CallLogDocument>,

    @InjectModel(FollowUp.name)
    private followUpModel: Model<FollowUpDocument>,

    @InjectModel(Project.name)
    private projectModel: Model<ProjectDocument>,
  ) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregated dashboard stats',
  })
  async getStats() {
    const [leads, calls, followUps, projects] = await Promise.all([
      this.leadModel.find(),
      this.callModel.find(),
      this.followUpModel.find(),
      this.projectModel.find(),
    ]);

    const total = leads.length;

    const newLeads = leads.filter((l) => l.status === 'New').length;

    const converted = leads.filter((l) => l.status === 'Won').length;

    const conversionRate =
      total > 0 ? +((converted / total) * 100).toFixed(2) : 0;

    const revenue = leads
      .filter((l) => l.status === 'Won')
      .reduce((sum, l) => sum + Number(l.leadValue || 0), 0);

    const byStatus: Record<string, number> = {};

    const bySource: Record<string, number> = {};

    const byPriority: Record<string, number> = {};

    for (const l of leads) {
      byStatus[l.status] = (byStatus[l.status] || 0) + 1;

      if (l.source) {
        bySource[l.source] = (bySource[l.source] || 0) + 1;
      }

      byPriority[l.priority] = (byPriority[l.priority] || 0) + 1;
    }

    const followUpOverview = {
      total: followUps.length,

      pending: followUps.filter((f) => f.status === 'Pending').length,

      completed: followUps.filter((f) => f.status === 'Completed').length,

      overdue: followUps.filter((f) => f.status === 'Overdue').length,
    };

    const callStats = {
      total: calls.length,

      connected: calls.filter((c) => c.status === 'Connected').length,

      notAnswered: calls.filter((c) => c.status === 'Not Answered').length,

      callbackScheduled: calls.filter((c) => c.status === 'Callback Scheduled')
        .length,
    };

    const projectStats = {
      total: projects.length,

      totalBudget: projects.reduce((sum, p) => sum + Number(p.budget || 0), 0),

      totalReceived: projects.reduce(
        (sum, p) => sum + Number(p.amountReceived || 0),
        0,
      ),
    };

    return {
      leads: {
        total,
        newLeads,
        converted,
        conversionRate,
        revenue,
        byStatus,
        bySource,
        byPriority,
      },

      followUpOverview,

      callStats,

      projectStats,
    };
  }
}
