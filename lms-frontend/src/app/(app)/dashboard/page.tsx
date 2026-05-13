'use client';

import { useEffect } from 'react';
import { Users, UserPlus, CheckCircle2, Filter, DollarSign } from 'lucide-react';
import StatCard from '@/components/ui/StatCard';
import LeadsOverTimeChart from '@/components/dashboard/LeadsOverTimeChart';
import LeadsBySourceChart from '@/components/dashboard/LeadsBySourceChart';
import ConversionRateChart from '@/components/dashboard/ConversionRateChart';
import LeadsByStatusTable from '@/components/dashboard/LeadsByStatusTable';
import RecentLeadsTable from '@/components/dashboard/RecentLeadsTable';
import LeadFunnel from '@/components/dashboard/LeadFunnel';
import FollowUpOverviewWidget from '@/components/dashboard/FollowUpOverviewWidget';
import TopSourcesWidget from '@/components/dashboard/TopSourcesWidget';
import LeadsByLocationWidget from '@/components/dashboard/LeadsByLocationWidget';
import LeadsByAssigneeWidget from '@/components/dashboard/LeadsByAssigneeWidget';
import { useNotifications } from '@/components/notifications/NotificationProvider';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchDashboardStats, fetchLeads } from '@/store/slices/leadsSlice';

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { checkReminders } = useNotifications();
  const dashboardStats = useAppSelector((state) => state.leads.dashboardStats);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLeads({ limit: 5 }));
    void checkReminders();
  }, [checkReminders, dispatch]);

  return (
    <div className="space-y-5 p-4 sm:p-6">
      {/* Page title */}
      <h1 className="text-lg font-bold text-gray-900 sm:text-xl">Dashboard</h1>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Leads"
          value={formatNumber(dashboardStats?.totalLeads ?? 0)}
          delta={dashboardStats?.totalLeadsDelta ?? 0}
          iconBg="bg-indigo-100"
          icon={<Users size={18} className="text-indigo-600" />}
        />
        <StatCard
          title="New Leads"
          value={formatNumber(dashboardStats?.newLeads ?? 0)}
          delta={dashboardStats?.newLeadsDelta ?? 0}
          iconBg="bg-green-100"
          icon={<UserPlus size={18} className="text-green-600" />}
        />
        <StatCard
          title="Won Leads"
          value={formatNumber(dashboardStats?.convertedLeads ?? 0)}
          delta={dashboardStats?.convertedLeadsDelta ?? 0}
          iconBg="bg-blue-100"
          icon={<CheckCircle2 size={18} className="text-blue-600" />}
        />
        <StatCard
          title="Conversion Rate"
          value={`${dashboardStats?.conversionRate ?? 0}%`}
          delta={dashboardStats?.conversionRateDelta ?? 0}
          iconBg="bg-yellow-100"
          icon={<Filter size={18} className="text-yellow-600" />}
        />
        <StatCard
          title="Revenue Generated"
          value={formatCurrency(dashboardStats?.revenueGenerated ?? 0)}
          delta={dashboardStats?.revenueDelta ?? 0}
          iconBg="bg-teal-100"
          icon={<DollarSign size={18} className="text-teal-600" />}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeadsOverTimeChart />
        <LeadsBySourceChart />
        <ConversionRateChart />
      </div>

      {/* Row 3: Status + Location + Recent Leads */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <LeadsByStatusTable />
        <LeadsByLocationWidget />
        <RecentLeadsTable />
      </div>

      {/* Row 4: Top Sources + Lead Funnel + Follow Ups */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <TopSourcesWidget />
        <LeadsByAssigneeWidget />
        <LeadFunnel />
        <FollowUpOverviewWidget />
      </div>
    </div>
  );
}
