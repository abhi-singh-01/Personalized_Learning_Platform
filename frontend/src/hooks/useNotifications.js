import { useState, useEffect, useCallback } from 'react';
import useApi from './useApi';
import { useSocket } from '../context/SocketContext';

/**
 * Notification hook — fetches notifications, tracks unread count, and listens for real-time updates
 */
export default function useNotifications() {
  const api = useApi();
  const socketCtx = useSocket();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (pg = 1) => {
    try {
      const res = await api.get(`/notifications?page=${pg}&limit=20`);
      if (res.data) {
        if (pg === 1) {
          setNotifications(res.data.notifications);
        } else {
          setNotifications(prev => [...prev, ...res.data.notifications]);
        }
        setTotal(res.data.total);
        setUnreadCount(res.data.unreadCount);
        setPage(pg);
      }
    } catch (err) {
      console.error('[Notifications] Fetch error:', err);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/notifications/unread-count');
      if (res.data) setUnreadCount(res.data.count);
    } catch { /* silent */ }
  }, []);

  const markRead = useCallback(async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, isRead: true, readAt: new Date() } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch { /* silent */ }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true, readAt: new Date() })));
      setUnreadCount(0);
    } catch { /* silent */ }
  }, []);

  const removeNotification = useCallback(async (id) => {
    try {
      await api.del(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n._id !== id));
      setTotal(prev => prev - 1);
    } catch { /* silent */ }
  }, []);

  const loadMore = useCallback(() => {
    if (notifications.length < total) {
      fetchNotifications(page + 1);
    }
  }, [notifications.length, total, page, fetchNotifications]);

  // Initial fetch
  useEffect(() => {
    fetchNotifications(1);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!socketCtx?.socket) return;

    const handleNewNotification = (data) => {
      setNotifications(prev => [data, ...prev]);
      setUnreadCount(prev => prev + 1);
      setTotal(prev => prev + 1);
    };

    socketCtx.on('notification:new', handleNewNotification);
    return () => socketCtx.off('notification:new', handleNewNotification);
  }, [socketCtx?.socket]);

  return {
    notifications,
    unreadCount,
    total,
    loading: api.loading,
    fetchNotifications,
    fetchUnreadCount,
    markRead,
    markAllRead,
    removeNotification,
    loadMore,
    hasMore: notifications.length < total,
  };
}
