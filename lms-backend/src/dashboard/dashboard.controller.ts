import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Lead, LeadDocument } from '../leads/leads.entity';

import { CallLog, CallLogDocument } from '../calls/calls.entity';

import { FollowUp, FollowUpDocument } from '../followups/followups.entity';

import { Project, ProjectDocument } from '../projects/projects.entity';

@ApiTags('Dashboard')
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
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
    const [
      total,
      newLeads,
      converted,
      revenueResult,
      byStatusResult,
      bySourceResult,
      byPriorityResult,
      followUpOverview,
      callStats,
      projectStatsResult,
    ] = await Promise.all([
      this.leadModel.countDocuments(),
      this.leadModel.countDocuments({ status: 'New' }),
      this.leadModel.countDocuments({ status: 'Won' }),
      this.leadModel.aggregate<{ total: number }>([
        { $match: { status: 'Won' } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$leadValue', 0] } },
          },
        },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $match: { source: { $exists: true, $ne: null } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Promise.all([
        this.followUpModel.countDocuments(),
        this.followUpModel.countDocuments({ status: 'Pending' }),
        this.followUpModel.countDocuments({ status: 'Completed' }),
        this.followUpModel.countDocuments({ status: 'Overdue' }),
      ]),
      Promise.all([
        this.callModel.countDocuments(),
        this.callModel.countDocuments({ status: 'Connected' }),
        this.callModel.countDocuments({ status: 'Not Answered' }),
        this.callModel.countDocuments({ status: 'Callback Scheduled' }),
      ]),
      this.projectModel.aggregate<{
        total: number;
        totalBudget: number;
        totalReceived: number;
      }>([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalBudget: { $sum: { $ifNull: ['$budget', 0] } },
            totalReceived: { $sum: { $ifNull: ['$amountReceived', 0] } },
          },
        },
      ]),
    ]);

    const conversionRate =
      total > 0 ? +((converted / total) * 100).toFixed(2) : 0;
    const revenue = revenueResult[0]?.total ?? 0;
    const [followUpsTotal, pending, completed, overdue] = followUpOverview;
    const [callsTotal, connected, notAnswered, callbackScheduled] = callStats;
    const projectStats = projectStatsResult[0] ?? {
      total: 0,
      totalBudget: 0,
      totalReceived: 0,
    };

    const toRecord = (rows: { _id: string; count: number }[]) =>
      Object.fromEntries(
        rows.filter((row) => row._id).map((row) => [row._id, row.count]),
      );

    return {
      leads: {
        total,
        newLeads,
        converted,
        conversionRate,
        revenue,
        byStatus: toRecord(byStatusResult),
        bySource: toRecord(bySourceResult),
        byPriority: toRecord(byPriorityResult),
      },

      followUpOverview: {
        total: followUpsTotal,
        pending,
        completed,
        overdue,
      },

      callStats: {
        total: callsTotal,
        connected,
        notAnswered,
        callbackScheduled,
      },

      projectStats,
    };
  }
}
