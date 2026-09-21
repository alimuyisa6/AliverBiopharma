import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  dismissNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead
} from '../api/client';

import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);
const POLL_INTERVAL = 60 * 1000;

export function NotificationProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);

    try {
      const result = await getNotifications({ limit: 50 });
      setNotifications(result?.notifications || []);
      setUnreadCount(Number(result?.unread_count) || 0);
    } catch (error) {
      console.error('[Notifications] refresh failed:', error);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      refreshNotifications();
      return undefined;
    }

    let idleId;
    let timeoutId;

    const loadInitialNotifications = () => {
      refreshNotifications();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(loadInitialNotifications, { timeout: 2000 });
    } else {
      timeoutId = setTimeout(loadInitialNotifications, 0);
    }

    const interval = setInterval(refreshNotifications, POLL_INTERVAL);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      clearTimeout(timeoutId);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, refreshNotifications]);

  const markRead = useCallback(async (id) => {
    if (!id) return;

    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: true, read_at: notification.read_at || new Date().toISOString() }
          : notification
      )
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    try {
      await markNotificationRead(id);
    } catch (error) {
      console.error('[Notifications] mark read failed:', error);
      await refreshNotifications();
    }
  }, [refreshNotifications]);

  const markAllRead = useCallback(async () => {
    const previous = notifications;
    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || new Date().toISOString()
      }))
    );
    setUnreadCount(0);

    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.error('[Notifications] mark all read failed:', error);
      setNotifications(previous);
      await refreshNotifications();
    }
  }, [notifications, refreshNotifications]);

  const dismiss = useCallback(async (id) => {
    if (!id) return;

    const dismissed = notifications.find((notification) => notification.id === id);
    setNotifications((current) => current.filter((notification) => notification.id !== id));

    if (dismissed && !dismissed.is_read) {
      setUnreadCount((count) => Math.max(0, count - 1));
    }

    try {
      await dismissNotification(id);
    } catch (error) {
      console.error('[Notifications] dismiss failed:', error);
      await refreshNotifications();
    }
  }, [notifications, refreshNotifications]);

  const value = useMemo(() => ({
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markRead,
    markAllRead,
    dismiss
  }), [
    notifications,
    unreadCount,
    loading,
    refreshNotifications,
    markRead,
    markAllRead,
    dismiss
  ]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }

  return context;
}
