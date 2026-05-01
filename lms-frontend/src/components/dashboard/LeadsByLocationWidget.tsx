'use client';

import { useAppSelector } from '@/hooks/redux';

const dotColors = ['bg-indigo-500', 'bg-blue-400', 'bg-yellow-400', 'bg-red-400', 'bg-green-400', 'bg-gray-400'];

export default function LeadsByLocationWidget() {
  const leads = useAppSelector((state) => state.leads.leads);
  const total = leads.length;
  const leadsByLocation = Object.entries(leads.reduce<Record<string, number>>((acc, lead) => {
    const location = lead.location || lead.address.country || 'Unspecified';
    acc[location] = (acc[location] ?? 0) + 1;
    return acc;
  }, {})).map(([country, count]) => ({
    country,
    leads: count,
    percentage: total ? Math.round((count / total) * 100) : 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads by Location</h3>
      {/* Simple world map placeholder */}
      <div className="w-full h-28 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mb-4 flex items-center justify-center border border-gray-100">
        <svg viewBox="0 0 200 100" className="w-full h-full opacity-30">
          {/* Simplified world map paths */}
          <ellipse cx="100" cy="50" rx="95" ry="45" fill="none" stroke="#6366F1" strokeWidth="0.5" />
          <path d="M20 40 Q40 20 60 35 Q80 50 100 40 Q120 30 140 45 Q160 60 180 45" fill="none" stroke="#6366F1" strokeWidth="0.8" />
          <circle cx="150" cy="45" r="3" fill="#6366F1" opacity="0.6" />
          <circle cx="100" cy="38" r="3" fill="#6366F1" opacity="0.6" />
          <circle cx="50" cy="42" r="4" fill="#6366F1" opacity="0.8" />
          <circle cx="35" cy="55" r="2" fill="#6366F1" opacity="0.5" />
          <circle cx="165" cy="65" r="2" fill="#6366F1" opacity="0.5" />
        </svg>
      </div>
      <div className="space-y-1.5">
        {leadsByLocation.map((loc, i) => (
          <div key={loc.country} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${dotColors[i]}`} />
              <span className="text-xs text-gray-600">{loc.country}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-700">{loc.leads}</span>
              <span className="text-xs text-gray-400">({loc.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
