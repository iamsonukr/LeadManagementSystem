'use client';

import { ChevronDown } from 'lucide-react';
import { useAppSelector } from '@/hooks/redux';

const barColors = ['bg-indigo-500', 'bg-blue-400', 'bg-cyan-400', 'bg-teal-400', 'bg-emerald-400', 'bg-lime-400', 'bg-amber-400', 'bg-orange-400', 'bg-rose-400', 'bg-pink-400', 'bg-gray-400'];

export default function TopSourcesWidget() {
  const leads = useAppSelector((state) => state.leads.leads);
  const counts = leads.reduce<Record<string, number>>((acc, lead) => {
    lead.services.forEach((service) => {
      acc[service] = (acc[service] ?? 0) + 1;
    });
    return acc;
  }, {});
  const max = Math.max(...Object.values(counts), 1);
  const topServices = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([service, count]) => ({ service, percentage: Math.round((count / max) * 100) }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Top Performing Services</h3>
        <button className="flex items-center gap-1.5 text-xs text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1.5 hover:bg-gray-50">
          By Conversion <ChevronDown size={12} />
        </button>
      </div>
      <div className="space-y-3">
        {topServices.map((s, i) => (
          <div key={s.service}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">{s.service}</span>
              <span className="text-xs font-semibold text-gray-700">{s.percentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${barColors[i % barColors.length]}`}
                style={{ width: `${s.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
