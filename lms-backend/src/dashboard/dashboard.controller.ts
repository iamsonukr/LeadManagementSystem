import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from '../leads/leads.entity';
import { CallLog, CallLogDocument } from '../calls/calls.entity';
import { FollowUp, FollowUpDocument } from '../followups/followups.entity';
import { Project, ProjectDocument } from '../projects/projects.entity';
import { User, UserDocument } from '../users/user.entity';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  isAdmin,
  isManager,
  RequestUser,
  userAssignmentKeys,
  userAssignmentIds,
} from '../auth/roles';

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

    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  private async getLeadScope(user: RequestUser) {
    if (isAdmin(user)) {
      return {
        leadMatch: {},
        leadIds: null as null | unknown[],
        relatedMatch: {},
      };
    }

    const ownKeys = userAssignmentIds(user);
    let assignmentKeys = ownKeys;

    if (isManager(user)) {
      const teamMembers = await this.userModel
        .find({ reportingManager: user.id })
        .select('_id')
        .lean();

      assignmentKeys = [
        ...ownKeys,
        ...teamMembers.map((member) => member._id),
      ];
    }

    const leadMatch = { assignedTo: { $in: assignmentKeys } };
    const leads = await this.leadModel.find(leadMatch).select('_id').lean();
    const leadIds = leads.map((lead) => lead._id);

    return {
      leadMatch,
      leadIds,
      relatedMatch: { lead: { $in: leadIds } },
    };
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregated dashboard stats',
  })
  async getStats(@CurrentUser() user: RequestUser) {
    const { leadMatch, relatedMatch } = await this.getLeadScope(user);
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
      byAssigneeResult,
    ] = await Promise.all([
      this.leadModel.countDocuments(leadMatch),
      this.leadModel.countDocuments({ ...leadMatch, status: 'New' }),
      this.leadModel.countDocuments({ ...leadMatch, status: 'Won' }),
      this.leadModel.aggregate<{ total: number }>([
        { $match: { ...leadMatch, status: 'Won' } },
        {
          $group: {
            _id: null,
            total: { $sum: { $ifNull: ['$leadValue', 0] } },
          },
        },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $match: leadMatch },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $match: { ...leadMatch, source: { $exists: true, $ne: null } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $match: leadMatch },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),
      Promise.all([
        this.followUpModel.countDocuments(relatedMatch),
        this.followUpModel.countDocuments({ ...relatedMatch, status: 'Pending' }),
        this.followUpModel.countDocuments({
          ...relatedMatch,
          status: 'Completed',
        }),
        this.followUpModel.countDocuments({ ...relatedMatch, status: 'Overdue' }),
      ]),
      Promise.all([
        this.callModel.countDocuments(relatedMatch),
        this.callModel.countDocuments({ ...relatedMatch, status: 'Connected' }),
        this.callModel.countDocuments({ ...relatedMatch, status: 'Not Answered' }),
        this.callModel.countDocuments({
          ...relatedMatch,
          status: 'Callback Scheduled',
        }),
      ]),
      this.projectModel.aggregate<{
        total: number;
        totalBudget: number;
        totalReceived: number;
      }>([
        {
          $match: relatedMatch,
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalBudget: { $sum: { $ifNull: ['$budget', 0] } },
            totalReceived: { $sum: { $ifNull: ['$amountReceived', 0] } },
          },
        },
      ]),
      this.leadModel.aggregate<{ _id: string; count: number }>([
        { $match: { ...leadMatch, assignedTo: { $exists: true, $ne: null } } },
        { $group: { _id: '$assignedTo', count: { $sum: 1 } } },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
        {
          $project: {
            _id: {
              $cond: {
                if: { $eq: [{ $type: '$user.firstName' }, 'missing'] },
                then: '$_id',
                else: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              },
            },
            count: 1,
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
        byAssignee: toRecord(byAssigneeResult),
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