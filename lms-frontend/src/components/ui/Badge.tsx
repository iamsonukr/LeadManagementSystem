import { cn } from '@/lib/utils';

interface BadgeProps {
  label: string;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}

const variantClasses = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-green-100 text-green-700',
  warning: 'bg-yellow-100 text-yellow-700',
  danger: 'bg-red-100 text-red-700',
  info: 'bg-blue-100 text-blue-700',
  purple: 'bg-purple-100 text-purple-700',
};

export default function Badge({ label, className, variant = 'default' }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      variantClasses[variant],
      className
    )}>
      {label}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    'New': 'bg-blue-100 text-blue-700',
    'Contacted': 'bg-yellow-100 text-yellow-700',
    'Qualified': 'bg-orange-100 text-orange-700',
    'Proposal Sent': 'bg-purple-100 text-purple-700',
    'Negotiation': 'bg-pink-100 text-pink-700',
    'Won': 'bg-green-100 text-green-700',
    'Lost': 'bg-red-100 text-red-700',
    'Connected': 'bg-green-100 text-green-700',
    'Not Answered': 'bg-red-100 text-red-700',
    'Busy': 'bg-yellow-100 text-yellow-700',
    'Callback Scheduled': 'bg-blue-100 text-blue-700',
    'Wrong Number': 'bg-gray-100 text-gray-700',
    'Voicemail': 'bg-purple-100 text-purple-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[status] ?? 'bg-gray-100 text-gray-700')}>
      {status}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    'High': 'bg-red-100 text-red-700',
    'Medium': 'bg-yellow-100 text-yellow-700',
    'Low': 'bg-green-100 text-green-700',
  };
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[priority] ?? 'bg-gray-100 text-gray-700')}>
      {priority}
    </span>
  );
}
