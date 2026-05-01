'use client';

import { useAppSelector } from '@/hooks/redux';

const barColors: Record<string, string> = {
  New: 'bg-blue-500',
  Contacted: 'bg-emerald-500',
  Qualified: 'bg-yellow-500',
  'Proposal Sent': 'bg-purple-500',
  Won: 'bg-teal-500',
};

export default function LeadsByStatusTable() {
  const stats = useAppSelector((state) => state.leads.dashboardStats);
  const total = stats?.totalLeads ?? 0;
  const leadsByStatus = (stats?.byStatus ?? []).map((row) => ({
    status: row._id,
    leads: row.count,
    percentage: total ? +((row.count / total) * 100).toFixed(1) : 0,
  }));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads by Status</h3>
      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
            <th className="text-left pb-2">Status</th>
            <th className="text-right pb-2 w-16">Leads</th>
            <th className="text-right pb-2 w-16">%</th>
          </tr>
        </thead>
        <tbody>
          {leadsByStatus.map((row) => (
            <tr key={row.status} className="border-b border-gray-50 last:border-0">
              <td className="py-2.5 pr-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    <div className="text-sm text-gray-700 mb-1">{row.status}</div>
                    <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColors[row.status] ?? 'bg-gray-400'}`}
                        style={{ width: `${row.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </td>
              <td className="py-2.5 text-right text-sm font-medium text-gray-700">{row.leads}</td>
              <td className="py-2.5 text-right text-sm text-gray-500">{row.percentage}%</td>
            </tr>
          ))}
          <tr className="border-t-2 border-gray-200">
            <td className="pt-2 text-sm font-semibold text-gray-800">Total</td>
            <td className="pt-2 text-right text-sm font-semibold text-gray-800">{total.toLocaleString()}</td>
            <td className="pt-2 text-right text-sm font-semibold text-gray-800">100%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
