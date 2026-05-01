'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';

export default function ConversionRateChart() {
  const stats = useAppSelector((state) => state.leads.dashboardStats);
  const conversionRateData = [{ date: 'Current', rate: stats?.conversionRate ?? 0 }];

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Conversion Rate Over Time</h3>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
          Daily <ChevronDown size={12} />
        </button>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={conversionRateData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} domain={[0, 40]} />
          <Tooltip
            contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 12 }}
            formatter={(val) => [`${Number(val ?? 0)}%`, 'Conversion Rate']}
          />
          <Line type="monotone" dataKey="rate" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
