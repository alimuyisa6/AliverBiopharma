import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDynamicActions } from '../api/client';

export default function DynamicActions({ pageId, className = '' }) {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDynamicActions(pageId);
        if (!cancelled) {
          setActions(Array.isArray(data?.actions) ? data.actions : []);
        }
      } catch {
        if (!cancelled) setActions([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [pageId]);

  const available = actions.filter(
    (action) =>
      action.visible === true &&
      action.enabled === true &&
      typeof action.destination === 'string' &&
      action.destination.trim()
  );

  if (!available.length) return null;

  return (
    <div className={className} aria-label="Available actions">
      {available.map((action) => {
        const label = action.label || action.action_key;
        const variant = action.variant || 'primary';
        const destination = action.destination.trim();

        if (destination.startsWith('/')) {
          return (
            <Link
              key={action.id}
              to={destination}
              className={`btn btn-${variant}`}
            >
              {label}
            </Link>
          );
        }

        return (
          <a
            key={action.id}
            href={destination}
            className={`btn btn-${variant}`}
            rel="noopener noreferrer"
          >
            {label}
          </a>
        );
      })}
    </div>
  );
}
