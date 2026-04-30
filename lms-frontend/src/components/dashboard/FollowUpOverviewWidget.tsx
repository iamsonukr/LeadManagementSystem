import { Calendar, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { followUpOverview } from '@/data/mockData';

const items = [
  { label: 'Total Follow Ups', value: followUpOverview.total, icon: Calendar, color: 'text-indigo-500 bg-indigo-50' },
  { label: 'Pending', value: followUpOverview.pending, icon: Clock, color: 'text-yellow-500 bg-yellow-50' },
  { label: 'Completed', value: followUpOverview.completed, icon: CheckCircle, color: 'text-green-500 bg-green-50' },
  { label: 'Overdue', value: followUpOverview.overdue, icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
];

export default function FollowUpOverviewWidget() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Follow Ups Overview</h3>
      <div className="grid grid-cols-2 gap-3">
        {items.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="text-center">
            <div className={`w-10 h-10 rounded-xl mx-auto mb-2 flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div className="text-lg font-bold text-gray-900">{value}</div>
            <div className="text-[11px] text-gray-400 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
