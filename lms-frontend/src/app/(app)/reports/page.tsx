'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { fetchDashboardStats, fetchLeads } from '@/store/slices/leadsSlice';

const monthlyRevenue = [
  { month: 'Dec', revenue: 82000 }, { month: 'Jan', revenue: 95000 },
  { month: 'Feb', revenue: 88000 }, { month: 'Mar', revenue: 110000 },
  { month: 'Apr', revenue: 103000 }, { month: 'May', revenue: 128750 },
];

export default function ReportsPage() {
  const dispatch = useAppDispatch();
  const leads = useAppSelector((state) => state.leads.leads);
  const stats = useAppSelector((state) => state.leads.dashboardStats);
  const total = stats?.totalLeads ?? 0;
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];
  const leadsOverTimeData = Object.entries(leads.reduce<Record<string, number>>((acc, lead) => {
    const date = new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    acc[date] = (acc[date] ?? 0) + 1;
    return acc;
  }, {})).map(([date, count]) => ({ date, leads: count }));
  const leadsBySource = (stats?.bySource ?? []).map((row, index) => ({
    name: row._id,
    value: row.count,
    percentage: total ? +((row.count / total) * 100).toFixed(1) : 0,
    color: colors[index % colors.length],
  }));
  const leadFunnel = (stats?.byStatus ?? []).map((row) => ({ stage: row._id, leads: row.count }));

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchLeads({ limit: 100 }));
  }, [dispatch]);

  return (
    <div className="p-6 space-y-5">
      <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>

      <div className="grid grid-cols-2 gap-5">
        {/* Revenue Trend */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Revenue Trend (6 Months)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyRevenue} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`$${Number(v ?? 0).toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Leads Over Time */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Generation Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={leadsOverTimeData} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Source Distribution */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Source Distribution</h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={leadsBySource} cx="50%" cy="50%" outerRadius={80} dataKey="value" paddingAngle={2}>
                  {leadsBySource.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2">
              {leadsBySource.map(s => (
                <div key={s.name} className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-xs text-gray-600">{s.name}</span>
                  <span className="text-xs font-medium text-gray-700 ml-auto">{s.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Funnel */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Conversion Funnel</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadFunnel} layout="vertical" margin={{ left: 60, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="stage" tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="leads" fill="#6366F1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
    </div>
  );
}
