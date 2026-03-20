import { get, put, ENDPOINTS } from './api';

export const getNotifications = (page = 1, limit = 20) =>
  get(`${ENDPOINTS.NOTIFICATIONS.LIST}?page=${page}&limit=${limit}`);

export const getUnreadCount = () => get(ENDPOINTS.NOTIFICATIONS.UNREAD_COUNT);

export const markAsRead = (id) => put(ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {});

export const markAllAsRead = () => put(ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {});
