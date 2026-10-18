/* components/Breadcrumb/Breadcrumb.jsx */
import { Link, useLocation } from 'react-router-dom';
import Icon from '../Icon/Icon';

export default function Breadcrumb({ items = [], className = '' }) {
  const location = useLocation();
  if (!items.length) return null;

  const currentHref = `${location.pathname}${location.search}${location.hash}`;

  return (
    <nav className={["breadcrumb", className].filter(Boolean).join(" ")} aria-label="Breadcrumb">
      <ol className="breadcrumb-list">
        {items.map((item, idx) => {
          const isCurrent = idx === items.length - 1;
          const href = item.href || (isCurrent ? currentHref : null);

          return (
            <li className="breadcrumb-item" key={`${item.label}-${idx}`}>
              {idx > 0 && <Icon name="chevron-right" className="breadcrumb-sep" />}
              {href ? (
                <Link
                  to={href}
                  className={`breadcrumb-link${isCurrent ? ' breadcrumb-current' : ''}`}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span className="breadcrumb-current" title={item.label}>{item.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
