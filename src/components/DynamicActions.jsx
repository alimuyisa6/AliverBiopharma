import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDynamicActions } from '../api/client';

export default function DynamicActions({ pageId, contentType = null, contentId = null, className = '' }) {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await getDynamicActions(pageId, { content_type: contentType, content_id: contentId });
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
  }, [pageId, contentType, contentId]);

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
        const configuredDestination = action.destination.trim();
        const destinationTemplate = action.config?.destination_template;
        const destination = typeof destinationTemplate === 'string' && destinationTemplate.trim()
          ? destinationTemplate
              .replace(/\{content_id\}/g, encodeURIComponent(String(contentId || action.content_id || '')))
              .replace(/\{content_type\}/g, encodeURIComponent(String(contentType || action.content_type || '')))
          : configuredDestination;

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
