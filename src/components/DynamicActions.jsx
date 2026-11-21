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

  const variantStyles = { primary: 'bg-primary-700 text-white hover:bg-primary-800', secondary: 'border border-slate-200 bg-white text-primary-800 hover:bg-primary-50', ghost: 'bg-transparent text-slate-700 hover:bg-slate-100', danger: 'bg-red-700 text-white hover:bg-red-800', success: 'bg-emerald-700 text-white hover:bg-emerald-800', warning: 'bg-amber-500 text-amber-950 hover:bg-amber-600', info: 'bg-sky-700 text-white hover:bg-sky-800', outline: 'border border-primary-300 bg-white text-primary-800 hover:bg-primary-50', gradient: 'bg-gradient-to-r from-primary-700 to-secondary-600 text-white', warm: 'bg-secondary-600 text-white hover:bg-secondary-700' };\n\n  const available = actions.filter(
    (action) =>
      action.visible === true &&
      action.enabled === true &&
      (
        (typeof action.destination === 'string' && action.destination.trim()) ||
        (typeof action.config?.destination_template === 'string' &&
          action.config.destination_template.trim())
      )
  );

  if (!available.length) return null;

  return (
    <div className={className} aria-label="Available actions">
      {available.map((action) => {
        const label = action.label || action.action_key;
        const variant = action.variant || 'primary';
        const configuredDestination = typeof action.destination === 'string' ? action.destination.trim() : '';
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
              className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-bold shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${variantStyles[variant] || variantStyles.primary}`}
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
