'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  Clock,
  FolderKanban,
  UserPlus,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useNotifications } from '@/components/notifications/NotificationProvider';
import { getNotificationHref } from '@/lib/notifications';
import { cn, formatRelativeTime } from '@/lib/utils';
import { NotificationRecord } from '@/types';

const notificationIcon = (notification: NotificationRecord) => {
  if (notification.type === 'lead_assigned') {
    return <UserPlus size={15} />;
  }

  if (notification.type === 'project_assigned') {
    return <FolderKanban size={15} />;
  }

  if (notification.type === 'overdue_follow_up') {
    return <AlertTriangle size={15} />;
  }

  return <Clock size={15} />;
};

const iconClass = (type: NotificationRecord['type']) => {
  if (type === 'lead_assigned') return 'bg-blue-50 text-blue-600';
  if (type === 'project_assigned') return 'bg-indigo-50 text-indigo-600';
  if (type === 'overdue_follow_up') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-600';
};

export default function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    refresh,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    if (open) void refresh();
  }, [open, refresh]);

  const openNotification = async (notification: NotificationRecord) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }
    setOpen(false);
    router.push(getNotificationHref(notification));
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="relative flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-gray-50 text-gray-500 transition-colors hover:bg-gray-100"
        aria-label="Open notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-20 mt-2 w-[min(380px,calc(100vw-1rem))] overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <div className="text-sm font-semibold text-gray-900">
                  Notifications
                </div>
                <div className="text-xs text-gray-400">
                  {unreadCount} unread
                </div>
              </div>
              <button
                type="button"
                onClick={() => void markAllAsRead()}
                disabled={unreadCount === 0}
                className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-indigo-600 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:text-gray-300 disabled:hover:bg-transparent"
              >
                <CheckCheck size={13} /> Mark all
              </button>
            </div>

            <div className="max-h-[440px] overflow-y-auto">
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'flex gap-3 border-b border-gray-50 px-4 py-3 last:border-0',
                      !notification.isRead && 'bg-indigo-50/40',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void openNotification(notification)}
                      className="flex min-w-0 flex-1 gap-3 text-left"
                    >
                      <span
                        className={cn(
                          'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                          iconClass(notification.type),
                        )}
                      >
                        {notificationIcon(notification)}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-start gap-2">
                          <span className="line-clamp-1 text-sm font-semibold text-gray-900">
                            {notification.title}
                          </span>
                          {!notification.isRead && (
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                          )}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-xs leading-5 text-gray-500">
                          {notification.message}
                        </span>
                        <span className="mt-1 block text-[11px] text-gray-400">
                          {formatRelativeTime(notification.createdAt)}
                        </span>
                      </span>
                    </button>
                    {!notification.isRead && (
                      <button
                        type="button"
                        onClick={() => void markAsRead(notification.id)}
                        className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-gray-400 hover:bg-white hover:text-indigo-600"
                        aria-label="Mark notification as read"
                      >
                        <Check size={13} />
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="px-4 py-10 text-center">
                  <Bell size={24} className="mx-auto text-gray-300" />
                  <div className="mt-2 text-sm font-medium text-gray-500">
                    No notifications
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {isLoading ? 'Loading...' : 'You are all caught up.'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
