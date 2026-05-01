'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';

export default function LeadsOverTimeChart() {
  const leads = useAppSelector((state) => state.leads.leads);
  const leadsOverTimeData = Object.entries(
    leads.reduce<Record<string, number>>((acc, lead) => {
      const date = new Date(lead.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      acc[date] = (acc[date] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([date, count]) => ({ date, leads: count }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Leads Generated Over Time</h3>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
          Daily <ChevronDown size={12} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={leadsOverTimeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="leadsGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366F1" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
            labelStyle={{ color: '#374151', fontWeight: 600 }}
          />
          <Area type="monotone" dataKey="leads" stroke="#6366F1" strokeWidth={2} fill="url(#leadsGrad)" dot={{ fill: '#6366F1', r: 4, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
