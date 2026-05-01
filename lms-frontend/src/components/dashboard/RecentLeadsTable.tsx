'use client';

import Link from 'next/link';
import { StatusBadge } from '@/components/ui/Badge';
import { formatRelativeTime } from '@/lib/utils';
import { useAppSelector } from '@/hooks/redux';

export default function RecentLeadsTable() {
  const recentLeads = useAppSelector((state) => state.leads.leads.slice(0, 5));

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-800">Recent Leads</h3>
        <Link href="/leads" className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">View All</Link>
      </div>
      <table className="w-full">
        <thead>
          <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
            <th className="text-left pb-2">Lead Name</th>
            <th className="text-left pb-2">Company</th>
            <th className="text-left pb-2">Status</th>
            <th className="text-left pb-2">Added On</th>
          </tr>
        </thead>
        <tbody>
          {recentLeads.map((lead) => (
            <tr key={lead.id} className="border-b border-gray-50 last:border-0 hover:bg-indigo-50/30 transition-colors">
              <td className="py-2.5">
                <Link href={`/leads/${lead.id}`} className="text-sm font-medium text-gray-800 hover:text-indigo-600">
                  {lead.name}
                </Link>
              </td>
              <td className="py-2.5 text-xs text-gray-500">{lead.company}</td>
              <td className="py-2.5"><StatusBadge status={lead.status} /></td>
              <td className="py-2.5 text-xs text-gray-400">{formatRelativeTime(lead.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
