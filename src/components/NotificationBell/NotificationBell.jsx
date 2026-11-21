/* components/NotificationBell/NotificationBell.jsx */
import { useState, useEffect, useRef, useCallback } from 'react';
import Icon from '../Icon/Icon';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  dismissNotification
} from '../../api/client';

export default function NotificationBell({ user }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);
  const pollRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);

    try {
      const data = await getNotifications({ limit: 50 });
      const list = Array.isArray(data?.notifications) ? data.notifications : [];

      setNotifications(list);
      setUnreadCount(
        typeof data?.unread_count === 'number'
          ? data.unread_count
          : list.filter((item) => !item.is_read).length
      );
    } catch {
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    pollRef.current = setInterval(fetchNotifications, 30000);

    return () => clearInterval(pollRef.current);
  }, [fetchNotifications, user?.id]);

  useEffect(() => {
    const handler = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handler);

    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleMarkRead(id, actionUrl) {
    try {
      await markNotificationRead(id);
    } catch {}

    setNotifications((prev) => prev.map((item) => (item.id === id ? { ...item, is_read: true } : item)));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    if (actionUrl) window.location.href = actionUrl;
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead();
    } catch {}

    setNotifications((prev) => prev.map((item) => ({ ...item, is_read: true })));
    setUnreadCount(0);
  }

  async function handleDismiss(event, id) {
    event.stopPropagation();

    try {
      await dismissNotification(id);
    } catch {}

    setNotifications((prev) => prev.filter((item) => item.id !== id));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function formatTime(dateStr) {
    if (!dateStr) return '';

    const date = new Date(dateStr);

    if (isNaN(date.getTime())) return '';

    const diff = Date.now() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

    return date.toLocaleDateString();
  }

  if (!user?.id) return null;

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary-800 transition hover:border-primary-200 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <Icon name="bell" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 w-[min(24rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 && (
              <button className="inline-flex min-h-8 items-center rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50" onClick={handleMarkAllRead}>Mark all as read</button>
            )}
          </div>

          <div className="hidden" />

          <div className="max-h-[min(70vh,32rem)] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-8 text-center text-sm text-slate-500">
                <Icon name="bell" className="h-7 w-7 text-slate-400" />
                <p>Loading your notifications…</p>
              </div>
            ) : !loading && notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-5 py-8 text-center text-sm text-slate-500">
                <Icon name="bell" className="h-7 w-7 text-slate-400" />
                <p>You're all caught up. No new notifications.</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-slate-100 p-3 transition last:border-b-0 hover:bg-slate-50 ${notification.is_read ? 'bg-white' : 'bg-primary-50/70'}`}
                  onClick={() => handleMarkRead(notification.id, notification.action_url)}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      name={notification.icon === 'dna' ? 'microscope' : notification.icon || 'bell'}
                      className="mt-1 h-5 w-5 shrink-0"
                      style={{ color: notification.color || 'var(--primary)' }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold leading-5 text-slate-900">{notification.title}</div>
                      {notification.body && <div className="mt-1 break-words text-sm leading-5 text-slate-600">{notification.body}</div>}
                      <div className="mt-1.5 text-xs font-medium text-slate-500">{formatTime(notification.created_at)}</div>
                    </div>
                    <button className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900" onClick={(event) => handleDismiss(event, notification.id)}>
                      <Icon name="xmark" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 
