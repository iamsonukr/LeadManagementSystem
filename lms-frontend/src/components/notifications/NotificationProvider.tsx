'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { cn, formatRelativeTime } from '@/lib/utils';
import {
  getNotificationHref,
  isReminderNotification,
} from '@/lib/notifications';
import notificationsService from '@/services/notificationsService';
import { NotificationRecord } from '@/types';

const POLL_INTERVAL_MS = Math.max(
  Number(process.env.NEXT_PUBLIC_NOTIFICATION_POLL_MS) || 60_000,
  15_000,
);

interface NotificationContextValue {
  notifications: NotificationRecord[];
  unreadCount: number;
  isLoading: boolean;
  refresh: () => Promise<void>;
  checkReminders: () => Promise<NotificationRecord[]>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(
  null,
);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [toasts, setToasts] = useState<NotificationRecord[]>([]);
  const toastedReminderIds = useRef(new Set<string>());

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const enqueueToast = useCallback(
    (notification: NotificationRecord) => {
      if (toastedReminderIds.current.has(notification.id)) return;
      toastedReminderIds.current.add(notification.id);

      setToasts((current) =>
        current.some((item) => item.id === notification.id)
          ? current
          : [...current, notification].slice(-4),
      );

      window.setTimeout(() => removeToast(notification.id), 8_000);
    },
    [removeToast],
  );

  const refresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await notificationsService.getAll({ limit: 20 });
      setNotifications(result.data);
      setUnreadCount(result.unread);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const checkReminders = useCallback(async () => {
    if (!isAuthenticated) return [];

    const reminders = await notificationsService.checkReminders();
    reminders
      .filter((notification) => !notification.isRead)
      .filter(isReminderNotification)
      .forEach(enqueueToast);

    await refresh();
    return reminders;
  }, [enqueueToast, isAuthenticated, refresh]);

  const markAsRead = useCallback(
    async (id: string) => {
      await notificationsService.markAsRead(id);
      setNotifications((current) =>
        current.map((item) =>
          item.id === id ? { ...item, isRead: true } : item,
        ),
      );
      setUnreadCount((current) => Math.max(0, current - 1));
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    await notificationsService.markAllAsRead();
    setNotifications((current) =>
      current.map((item) => ({ ...item, isRead: true })),
    );
    setUnreadCount(0);
  }, []);

  const openNotification = useCallback(
    async (notification: NotificationRecord) => {
      removeToast(notification.id);
      if (!notification.isRead) {
        await markAsRead(notification.id);
      }
      router.push(getNotificationHref(notification));
    },
    [markAsRead, removeToast, router],
  );

  useEffect(() => {
    if (!isAuthenticated || !user) {
      const reset = window.setTimeout(() => {
        setNotifications([]);
        setUnreadCount(0);
        setToasts([]);
        toastedReminderIds.current.clear();
      }, 0);

      return () => window.clearTimeout(reset);
    }

    const initialCheck = window.setTimeout(() => {
      void checkReminders();
    }, 0);
    const interval = window.setInterval(() => {
      void checkReminders();
    }, POLL_INTERVAL_MS);

    return () => {
      window.clearTimeout(initialCheck);
      window.clearInterval(interval);
    };
  }, [checkReminders, isAuthenticated, user]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading,
      refresh,
      checkReminders,
      markAsRead,
      markAllAsRead,
    }),
    [
      checkReminders,
      isLoading,
      markAllAsRead,
      markAsRead,
      notifications,
      refresh,
      unreadCount,
    ],
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
      <div className="fixed right-4 top-20 z-50 flex w-[min(360px,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((notification) => {
          const overdue = notification.type === 'overdue_follow_up';
          return (
            <div
              key={notification.id}
              className={cn(
                'relative rounded-lg border bg-white p-4 pr-10 shadow-lg ring-1 ring-black/5',
                overdue ? 'border-red-100' : 'border-amber-100',
              )}
            >
              <button
                type="button"
                onClick={() => removeToast(notification.id)}
                className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                aria-label="Dismiss notification"
              >
                <X size={13} />
              </button>
              <button
                type="button"
                onClick={() => void openNotification(notification)}
                className="flex w-full gap-3 text-left"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    overdue
                      ? 'bg-red-50 text-red-600'
                      : 'bg-amber-50 text-amber-600',
                  )}
                >
                  {overdue ? <AlertTriangle size={16} /> : <Clock size={16} />}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-gray-900">
                    {notification.title}
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-gray-600">
                    {notification.message}
                  </span>
                  <span className="mt-1 block text-xs text-gray-400">
                    {formatRelativeTime(notification.createdAt)}
                  </span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used inside NotificationProvider');
  }

  return context;
}
