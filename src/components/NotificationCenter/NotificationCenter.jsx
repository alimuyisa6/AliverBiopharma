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
  return String(body || '')
    .replace(/<br\s*\/?>(\s*)/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading,
    markRead,
    markAllRead,
    dismiss
  } = useNotifications();

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
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markRead(notification.id);
    }

    if (notification.action_url) {
      setOpen(false);
      navigate(notification.action_url);
    }
  };

  return (
    <div className="notification-center relative inline-flex shrink-0" ref={rootRef} style={{ display: "inline-flex", position: "relative", flexShrink: 0 }}>
      <button
        type="button"
        className={`header-action-button notification-bell${unreadCount > 0 ? ' notification-bell--unread' : ''}${hasNewNotification ? ' notification-bell--new' : ''}`} style={{ display: "inline-flex", position: "relative", width: "40px", height: "40px", minWidth: "40px", minHeight: "40px", alignItems: "center", justifyContent: "center", flexShrink: 0, border: "1px solid #dbe3ec", borderRadius: "12px", background: "#fff", color: "#183b5b", cursor: "pointer" }}
        onClick={() => setOpen((current) => !current)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <span className="notification-bell-icon" aria-hidden="true" style={{ display: "inline-flex", width: "20px", height: "20px", alignItems: "center", justifyContent: "center", color: "inherit" }}>
          <svg viewBox="0 0 24 24" focusable="false" style={{ width: "20px", height: "20px", display: "block", color: "inherit" }}>
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        {unreadCount > 0 && (
          <span className="notification-badge" style={{ position: "absolute", top: "-5px", right: "-5px", display: "inline-flex", minWidth: "18px", height: "18px", padding: "0 4px", alignItems: "center", justifyContent: "center", borderRadius: "999px", background: "#dc2626", color: "#fff", fontSize: "10px", fontWeight: 800, lineHeight: 1, border: "2px solid #fff" }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>{open && (
        <motion.div className="notification-dropdown" role="dialog" aria-label="Notifications" initial={{ opacity: 0, y: -24, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -12, scale: 0.985 }} transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }} style={{ position: "fixed", top: "calc(76px + 10px)", left: "50%", width: "min(92vw, 430px)", maxHeight: "min(72vh, 620px)", overflow: "hidden", zIndex: 100, borderRadius: 20, border: "1px solid #dbe5ef", background: "#fff", boxShadow: "0 24px 70px rgba(15, 23, 42, .22)", color: "#172b43" }}>
          <div className="notification-dropdown-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "16px 18px", borderBottom: "1px solid #e5edf5", background: "#f8fbff" }}>
            <span className="notification-dropdown-title" style={{ fontSize: 16, fontWeight: 800, color: "#15304b" }}>Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={markAllRead}
                disabled={loading}
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="notification-list" style={{ maxHeight: "calc(min(72vh, 620px) - 62px)", overflowY: "auto", background: "#fff" }}>
            {notifications.length === 0 ? (
              <div className="notification-empty" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, padding: "32px 20px", textAlign: "center", color: "#64748b" }}>
                <span className="notification-empty-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
                <span>{loading ? 'Loading your notifications…' : "You're all caught up. No new notifications."}</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  className={`notification-item${notification.is_read ? "" : " unread"}`} style={{ padding: "14px 16px", borderBottom: "1px solid #edf2f7", background: notification.is_read ? "#fff" : "#f0f7ff", cursor: notification.action_url ? "pointer" : "default" }}
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
                  <div className="notification-item-row" style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                    <span className="notification-item-icon" style={{ color: notification.color || 'var(--info)' }}>
                      <span className="notification-list-icon" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false"><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M10 21h4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg></span>
                    </span>
                    <div className="notification-item-content" style={{ minWidth: 0, flex: 1 }}>
                      <div className="notification-item-title" style={{ fontWeight: 750, color: "#15304b", fontSize: 14, lineHeight: 1.4 }}>{notification.title}</div>
                      <div className="notification-item-body" style={{ marginTop: 4, fontSize: 13, lineHeight: 1.55, color: "#475569", overflowWrap: "anywhere" }}>{notificationBody(notification.body)}</div>
                      <div className="notification-item-time" style={{ marginTop: 7, fontSize: 11, color: "#64748b", fontWeight: 600 }}>{formatNotificationTime(notification.created_at)}</div>
                    </div>
                    <button
                      type="button"
                      className="notification-dismiss" style={{ display: "inline-flex", width: 30, height: 30, minWidth: 30, alignItems: "center", justifyContent: "center", borderRadius: 8, border: "1px solid #dbe5ef", background: "#fff", color: "#475569" }}
                      onClick={(event) => {
                        event.stopPropagation();
                        dismiss(notification.id);
                      }}
                      aria-label="Dismiss notification"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 18, height: 18, display: "block" }}><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" /></svg>
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
