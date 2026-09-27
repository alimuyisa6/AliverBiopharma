import React, { useCallback, useEffect, useState } from 'react';
import { getMaintenanceStatus } from '../../api/client';

function MaintenanceMessage({ data, boundary = false }) {
  if (!data) return null;
  const title = data.title || 'AliverBiopharm is under maintenance';
  const message = data.message || 'We are carrying out scheduled maintenance. Please check back shortly.';

  if (data.upcoming) {
    return (
      <div className="maintenance-alert" role="status">
        <strong>{title}</strong>
        <span>{message}</span>
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
  const [state, setState] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await getMaintenanceStatus(window.location.pathname);
      setState(data || null);
    } catch {
      // Maintenance status must never prevent the site from loading if the control service is unavailable.
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 60000);
    return () => window.clearInterval(timer);
  }, [load]);

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
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [boundaryKey]);

  if (state?.active) return <MaintenanceMessage data={state} boundary />;
  return children;
}
