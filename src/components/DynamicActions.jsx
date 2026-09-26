import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon/Icon';
import { getDynamicActions } from '../api/client';

export default function DynamicActions({ pageId, className = '' }) {
  const [actions, setActions] = useState([]);

  useEffect(() => {
    let cancelled = false;
    getDynamicActions(pageId)
      .then((data) => {
        if (!cancelled) setActions(Array.isArray(data?.actions) ? data.actions : []);
      })
      .catch(() => {
        if (!cancelled) setActions([]);
      });
    return () => { cancelled = true; };
  }, [pageId]);

  const available = actions.filter((action) => action.visible && action.enabled && action.destination);
  if (!available.length) return null;

  return (
    <div className={className} aria-label="Available actions">
      {available.map((action) => {
        const content = (
          <>
            {action.icon && <Icon name={action.icon} />}
            <span>{action.label}</span>
          </>
        );

        return action.destination.startsWith('/') ? (
          <Link key={action.id} to={action.destination} className={`btn btn-${action.variant || 'primary'}`}>
            {content}
          </Link>
        ) : (
          <a key={action.id} href={action.destination} className={`btn btn-${action.variant || 'primary'}`}>
            {content}
          </a>
        );
      })}
    </div>
  );
}
