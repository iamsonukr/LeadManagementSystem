'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useAppSelector } from '@/hooks/redux';

const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#6B7280'];

export default function LeadsBySourceChart() {
  const stats = useAppSelector((state) => state.leads.dashboardStats);
  const total = stats?.totalLeads ?? 0;
  const leadsBySource = (stats?.bySource ?? []).map((row, index) => ({
    name: row._id,
    value: row.count,
    percentage: total ? +((row.count / total) * 100).toFixed(1) : 0,
    color: colors[index % colors.length],
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads by Source</h3>
      <div className="flex items-center gap-4">
        <div className="relative">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={leadsBySource}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={72}
                paddingAngle={2}
                dataKey="value"
              >
                {leadsBySource.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#fff', border: '1px solid #E5E7EB', borderRadius: 8, fontSize: 11 }}
                formatter={(val) => [Number(val ?? 0), '']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-xl font-bold text-gray-900">{total.toLocaleString()}</span>
            <span className="text-[10px] text-gray-400">Total</span>
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {leadsBySource.map((s) => (
            <div key={s.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                <span className="text-xs text-gray-600">{s.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700">{s.percentage}%</span>
                <span className="text-xs text-gray-400">({s.value})</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
