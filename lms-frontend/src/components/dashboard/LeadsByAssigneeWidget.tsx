'use client';

import { useAppSelector } from '@/hooks/redux';

const dotColors = ['bg-indigo-500', 'bg-blue-400', 'bg-yellow-400', 'bg-red-400', 'bg-green-400', 'bg-teal-400', 'bg-purple-400', 'bg-pink-400', 'bg-orange-400', 'bg-gray-400'];

export default function LeadsByAssigneeWidget() {
  const byAssignee = useAppSelector((state) => state.leads.dashboardStats?.byAssignee ?? []);
  
  // Filter out any unassigned or null entries if needed, or label them as "Unassigned"
  const assigneeData = byAssignee.map(item => ({
    assignee: item._id || 'Unassigned',
    count: item.count,
  })).sort((a, b) => b.count - a.count);

  const total = assigneeData.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Leads by Assignee</h3>
      {assigneeData.length === 0 ? (
        <div className="flex items-center justify-center h-40">
          <p className="text-sm text-gray-500">No assignee data available.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assigneeData.map((data, i) => {
            const percentage = total > 0 ? Math.round((data.count / total) * 100) : 0;
            const barColor = dotColors[i % dotColors.length];
            return (
              <div key={data.assignee} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${barColor}`} />
                    <span className="text-xs font-medium text-gray-700">{data.assignee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900">{data.count}</span>
                    <span className="text-[10px] text-gray-400 w-8 text-right">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${barColor} rounded-full`} 
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
