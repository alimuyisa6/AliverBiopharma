import { Link, useLocation } from 'react-router-dom';
import { UI } from '../../design-system';

export default function Breadcrumb({ items = [], className = '' }) {
  const location = useLocation();
  if (!items.length) return null;

  const currentHref = `${location.pathname}${location.search}${location.hash}`;

  return (
    <nav
      className={`${UI.breadcrumbNav} ${className}`.trim()}
      aria-label="Breadcrumb"
    >
      <ol className={UI.breadcrumbList}>
        {items.map((item, idx) => {
          const isCurrent = idx === items.length - 1;
          const href = item.href || (isCurrent ? currentHref : null);
          const itemClass = isCurrent ? UI.breadcrumbCurrent : UI.breadcrumbLink;

          return (
            <li className={UI.breadcrumbItem} key={`${item.label}-${idx}`}>
              {idx > 0 && (
                <svg className={UI.breadcrumbSeparator} viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <path d="M5.5 3.25 10.25 8l-4.75 4.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={itemClass}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </button>
              ) : href ? (
                <Link
                  to={href}
                  className={itemClass}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span className={isCurrent ? UI.breadcrumbCurrent : UI.breadcrumbText} title={item.label}>
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
