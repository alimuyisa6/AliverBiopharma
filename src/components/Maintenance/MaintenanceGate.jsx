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
      <div className="my-4 flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950" role="status" aria-live="polite">
        <strong>{title}</strong>
        <span>{message}</span>
        {countdown && <span className="inline-flex w-fit rounded-lg bg-white px-3 py-1 text-xs font-bold tabular-nums text-amber-900">Starts in {countdown}</span>}
        {unsaved && <strong className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">Please save or submit your current work before maintenance begins.</strong>}
        {data.starts_at && <time dateTime={data.starts_at}>Starts {new Date(data.starts_at).toLocaleString()}</time>}
      </div>
    );
  }

  return (
    <div className={boundary ? 'fixed inset-0 z-[95] flex items-center justify-center bg-slate-950/50 p-4' : 'fixed inset-0 z-[95] flex items-center justify-center bg-slate-950 p-5'} role="alert" aria-live="assertive">
      <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-white p-6 text-center shadow-2xl sm:p-8">
        <div className="mb-4 text-4xl" aria-hidden="true">⏳</div>
        <h1>{title}</h1>
        <p>{message}</p>
        {data.ends_at && <time dateTime={data.ends_at}>Expected completion {new Date(data.ends_at).toLocaleString()}</time>}
        <p className="mt-4 text-sm leading-6 text-slate-600">Your account and saved work remain protected. Please check back after maintenance is complete.</p>
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

    let interval = null;
    let idleId;
    let timeoutId;

    const startMonitoring = () => {
      load();
      interval = window.setInterval(load, 30000);
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(startMonitoring, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(startMonitoring, 1000);
    }

    return () => {
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
      if (interval !== null) window.clearInterval(interval);
    };
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

    let interval = null;
    let idleId;
    let timeoutId;

    const startMonitoring = () => {
      if (!active) return;
      load();
      interval = window.setInterval(load, 30000);
    };

    if ('requestIdleCallback' in window) {
      idleId = window.requestIdleCallback(startMonitoring, { timeout: 2500 });
    } else {
      timeoutId = window.setTimeout(startMonitoring, 1000);
    }

    return () => {
      active = false;
      if (idleId !== undefined && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      window.clearTimeout(timeoutId);
      if (interval !== null) window.clearInterval(interval);
    };
  }, [boundaryKey]);

  if (state?.active) return <MaintenanceMessage data={state} boundary />;
  return children;
}
