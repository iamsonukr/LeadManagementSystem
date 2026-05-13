import { NotificationRecord } from '@/types';
import { normalizeNotification, toPagination, unwrapApi } from './apiUtils';
import apiClient from './apiClient';

export interface NotificationsResult {
  data: NotificationRecord[];
  pagination: { page: number; limit: number; total: number; pages: number };
  unread: number;
}

const notificationsService = {
  getAll: async (params: Record<string, string | number | boolean> = {}): Promise<NotificationsResult> => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') query.set(key, String(value));
    });

    const { data } = await apiClient.get(`/notifications?${query}`);
    const payload = unwrapApi<{
      data: unknown[];
      total: number;
      unread: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(data);
    const paginated = toPagination(payload);

    return {
      data: paginated.data.map(normalizeNotification),
      pagination: paginated.pagination,
      unread: payload.unread,
    };
  },

  unreadCount: async (): Promise<number> => {
    const { data } = await apiClient.get('/notifications/unread-count');
    return unwrapApi<{ unread: number }>(data).unread;
  },

  checkReminders: async (): Promise<NotificationRecord[]> => {
    const { data } = await apiClient.post('/notifications/check-reminders');
    return unwrapApi<unknown[]>(data).map(normalizeNotification);
  },

  markAsRead: async (id: string): Promise<NotificationRecord> => {
    const { data } = await apiClient.patch(`/notifications/${id}/read`);
    return normalizeNotification(unwrapApi<unknown>(data));
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/notifications/read-all');
  },
};

export default notificationsService;
