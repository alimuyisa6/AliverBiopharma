import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../Icon/Icon';
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
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

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
  const rootRef = useRef(null);

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
    <div className="notification-center" ref={rootRef}>
      <button
        type="button"
        className="btn btn-ghost btn-sm btn-icon header-action-button notification-bell"
        onClick={() => setOpen((current) => !current)}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Icon name="bell" plain />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notification-dropdown" role="dialog" aria-label="Notifications">
          <div className="notification-dropdown-header">
            <span className="notification-dropdown-title">Notifications</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={markAllRead}
                disabled={loading}
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <Icon name="bell" plain className="notification-empty-icon" />
                <span>{loading ? 'Loading notifications...' : 'You are all caught up.'}</span>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  className={`notification-item${notification.is_read ? '' : ' unread'}`}
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
                  <div className="notification-item-row">
                    <span className="notification-item-icon" style={{ color: notification.color || 'var(--info)' }}>
                      <Icon name="bell" plain />
                    </span>
                    <div className="notification-item-content">
                      <div className="notification-item-title">{notification.title}</div>
                      <div className="notification-item-body">{notificationBody(notification.body)}</div>
                      <div className="notification-item-time">{formatNotificationTime(notification.created_at)}</div>
                    </div>
                    <button
                      type="button"
                      className="notification-dismiss"
                      onClick={(event) => {
                        event.stopPropagation();
                        dismiss(notification.id);
                      }}
                      aria-label="Dismiss notification"
                    >
                      <Icon name="xmark" plain />
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
