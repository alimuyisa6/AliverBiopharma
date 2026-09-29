import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getMaintenanceStatus } from '../../api/client';

function formatCountdown(ms) {
  if (ms <= 0) return 'Starting now';
  const total = Math.ceil(ms / 1000);
  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function hasUnsavedInput() {
  const fields = Array.from(document.querySelectorAll('input, textarea, select'));
  return fields.some((field) => {
    if (field.disabled || field.type === 'hidden' || field.type === 'submit' || field.type === 'button') return false;
    if (field.type === 'checkbox' || field.type === 'radio') return field.checked !== field.defaultChecked;
    return field.value !== field.defaultValue;
  });
}

function MaintenanceMessage({ data, boundary = false }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!data?.starts_at) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [data?.starts_at]);

  const countdown = useMemo(() => {
    if (!data?.starts_at) return null;
    return formatCountdown(new Date(data.starts_at).getTime() - now);
  }, [data?.starts_at, now]);

  if (!data) return null;
  const title = data.title || 'AliverBiopharm is under maintenance';
  const message = data.message || 'We are carrying out scheduled maintenance. Please check back shortly.';

  if (data.upcoming) {
    const unsaved = hasUnsavedInput();
    return (
      <div className="maintenance-alert" role="status" aria-live="polite">
        <strong>{title}</strong>
        <span>{message}</span>
        {countdown && <span className="maintenance-countdown">Starts in {countdown}</span>}
        {unsaved && <strong className="maintenance-unsaved-warning">Please save or submit your current work before maintenance begins.</strong>}
        {data.starts_at && <time dateTime={data.starts_at}>Starts {new Date(data.starts_at).toLocaleString()}</time>}
      </div>
    );
  }

  return (
    <div className={boundary ? 'maintenance-boundary' : 'maintenance-screen'} role="alert" aria-live="assertive">
      <div className="maintenance-card">
        <div className="maintenance-mark" aria-hidden="true">⏳</div>
        <h1>{title}</h1>
        <p>{message}</p>
        {data.ends_at && <time dateTime={data.ends_at}>Expected completion {new Date(data.ends_at).toLocaleString()}</time>}
        <p className="maintenance-note">Your account and saved work remain protected. Please check back after maintenance is complete.</p>
      </div>
    </div>
  );
}

export default function MaintenanceGate() {
  const location = useLocation();
  const [state, setState] = useState(null);

  const load = useCallback(async () => {
    if (location.pathname === '/login') {
      setState(null);
      return;
    }

    try {
      const data = await getMaintenanceStatus(window.location.pathname);
      setState(data || null);
    } catch {
      // Maintenance status must never prevent the site from loading if the control service is unavailable.
    }
  }, [location.pathname]);

  useEffect(() => {
    if (location.pathname === '/login') {
      setState(null);
      return undefined;
    }

    load();
    const timer = window.setInterval(load, 30000);
    return () => window.clearInterval(timer);
  }, [load, location.pathname]);

  if (location.pathname === '/login') return null;
  if (!state) return null;
  if (state.active) return <MaintenanceMessage data={state} />;
  if (state.upcoming) return <MaintenanceMessage data={state} />;

  return null;
}

export function MaintenanceBoundary({ boundaryKey, children }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    if (!boundaryKey) return undefined;
    let active = true;

    const load = async () => {
      try {
        const data = await getMaintenanceStatus(window.location.pathname, boundaryKey);
        if (active) setState(data || null);
      } catch {}
    };

    load();
    const timer = window.setInterval(load, 30000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [boundaryKey]);

  if (state?.active) return <MaintenanceMessage data={state} boundary />;
  return children;
}
