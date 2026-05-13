import { NotificationRecord } from '@/types';

export const isReminderNotification = (notification: NotificationRecord) =>
  notification.type === 'upcoming_follow_up' ||
  notification.type === 'overdue_follow_up';

export const getNotificationHref = (notification: NotificationRecord) => {
  if (notification.type === 'lead_assigned') {
    return `/leads/${notification.relatedId}`;
  }

  if (notification.type === 'project_assigned') {
    return '/project';
  }

  return '/followups';
};
