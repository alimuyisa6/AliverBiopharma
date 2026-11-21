import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../contexts/NotificationContext';

function formatNotificationTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  if (diff < minute) return 'Just now';
  if (diff < hour) return `${Math.floor(diff / minute)} min ago`;
  if (diff < day) return `${Math.floor(diff / hour)} hr ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return date.toLocaleDateString();
}

function notificationBody(body) {
  return String(body || '').replace(/<br\s*\/?>(\s*)/gi, ' ').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

function BellIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false">
      <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markRead, markAllRead, dismiss } = useNotifications();
  const [open, setOpen] = useState(false);
  const [hasNewNotification, setHasNewNotification] = useState(false);
  const rootRef = useRef(null);
  const latestNotificationRef = useRef(null);

  useEffect(() => {
    const latest = notifications[0];
    if (!latest) return;
    const signature = `${latest.id}:${latest.created_at || ''}`;
    if (latestNotificationRef.current === null) {
      latestNotificationRef.current = signature;
      return;
    }
    if (signature !== latestNotificationRef.current && !latest.is_read) {
      setHasNewNotification(true);
      const timeout = setTimeout(() => setHasNewNotification(false), 2400);
      latestNotificationRef.current = signature;
      return () => clearTimeout(timeout);
    }
    latestNotificationRef.current = signature;
  }, [notifications]);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) await markRead(notification.id);
    if (notification.action_url) {
      setOpen(false);
      navigate(notification.action_url);
    }
  };

  return (
    <div className="relative inline-flex shrink-0" ref={rootRef}>
      <button
        type="button"
        className={`relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-primary-800 transition hover:border-primary-200 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${hasNewNotification ? 'ring-2 ring-secondary-300' : ''}`}
        onClick={() => setOpen((current) => !current)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <BellIcon className="h-5 w-5" />
        {unreadCount > 0 && <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      <AnimatePresence>{open && (
        <motion.div className="fixed left-3 right-3 top-[5.25rem] z-[100] mx-auto w-full max-w-[27rem] overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-800 shadow-2xl shadow-slate-900/20" role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.985 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}>
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unreadCount > 0 && <button type="button" className="inline-flex min-h-8 items-center rounded-lg px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 disabled:opacity-50" onClick={markAllRead} disabled={loading}>Mark all as read</button>}
          </div>
          <div className="max-h-[min(72vh,38rem)] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-8 text-center text-sm text-slate-500">
                <BellIcon className="h-7 w-7 text-slate-400" />
                <span>{loading ? 'Loading your notifications…' : "You're all caught up. No new notifications."}</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  className={`border-b border-slate-100 p-3 transition last:border-b-0 ${notification.is_read ? 'bg-white' : 'bg-primary-50/70'} ${notification.action_url ? 'cursor-pointer hover:bg-slate-50' : ''}`}
                  key={notification.id}
                  role={notification.action_url ? 'button' : undefined}
                  tabIndex={notification.action_url ? 0 : undefined}
                  onClick={() => handleNotificationClick(notification)}
                  onKeyDown={(event) => {
                    if (notification.action_url && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      handleNotificationClick(notification);
                    }
                  }}
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700" style={{ color: notification.color || undefined }}><BellIcon className="h-5 w-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold leading-5 text-slate-900">{notification.title}</div>
                      <div className="mt-1 break-words text-sm leading-5 text-slate-600">{notificationBody(notification.body)}</div>
                      <div className="mt-1.5 text-xs font-medium text-slate-500">{formatNotificationTime(notification.created_at)}</div>
                    </div>
                    <button type="button" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" onClick={(event) => { event.stopPropagation(); dismiss(notification.id); }} aria-label="Dismiss notification">
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      )}</AnimatePresence>
    </div>
  );
}
