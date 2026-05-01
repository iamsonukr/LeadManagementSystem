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
import { dashboardStats } from '@/data/mockData';
import { formatCurrency, formatNumber } from '@/lib/utils';

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-5">
      {/* Page title */}
      <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-5 gap-4">
        <StatCard
          title="Total Leads"
          value={formatNumber(dashboardStats.totalLeads)}
          delta={dashboardStats.totalLeadsDelta}
          iconBg="bg-indigo-100"
          icon={<Users size={18} className="text-indigo-600" />}
        />
        <StatCard
          title="New Leads"
          value={formatNumber(dashboardStats.newLeads)}
          delta={dashboardStats.newLeadsDelta}
          iconBg="bg-green-100"
          icon={<UserPlus size={18} className="text-green-600" />}
        />
        <StatCard
          title="Won Leads"
          value={formatNumber(dashboardStats.convertedLeads)}
          delta={dashboardStats.convertedLeadsDelta}
          iconBg="bg-blue-100"
          icon={<CheckCircle2 size={18} className="text-blue-600" />}
        />
        <StatCard
          title="Conversion Rate"
          value={`${dashboardStats.conversionRate}%`}
          delta={dashboardStats.conversionRateDelta}
          iconBg="bg-yellow-100"
          icon={<Filter size={18} className="text-yellow-600" />}
        />
        <StatCard
          title="Revenue Generated"
          value={formatCurrency(dashboardStats.revenueGenerated)}
          delta={dashboardStats.revenueDelta}
          iconBg="bg-teal-100"
          icon={<DollarSign size={18} className="text-teal-600" />}
        />
      </div>

      {/* Row 2: Charts */}
      <div className="grid grid-cols-3 gap-4">
        <LeadsOverTimeChart />
        <LeadsBySourceChart />
        <ConversionRateChart />
      </div>

      {/* Row 3: Status + Location + Recent Leads */}
      <div className="grid grid-cols-3 gap-4">
        <LeadsByStatusTable />
        <LeadsByLocationWidget />
        <RecentLeadsTable />
      </div>

      {/* Row 4: Top Sources + Lead Funnel + Follow Ups */}
      <div className="grid grid-cols-3 gap-4">
        <TopSourcesWidget />
        <LeadFunnel />
        <FollowUpOverviewWidget />
      </div>
    </div>
  );
}
