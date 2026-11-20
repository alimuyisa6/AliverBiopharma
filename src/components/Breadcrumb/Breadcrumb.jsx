import { Link, useLocation } from 'react-router-dom';
import Icon from '../Icon/Icon';

export default function Breadcrumb({ items = [], className = '' }) {
  const location = useLocation();
  if (!items.length) return null;

  const currentHref = `${location.pathname}${location.search}${location.hash}`;

  return (
    <nav
      className={[`min-w-0 text-sm text-slate-500 dark:text-slate-400`, className].filter(Boolean).join(' ')}
      aria-label="Breadcrumb"
    >
      <ol className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, idx) => {
          const isCurrent = idx === items.length - 1;
          const href = item.href || (isCurrent ? currentHref : null);

          return (
            <li
              className="inline-flex min-w-0 items-center gap-2"
              key={`${item.label}-${idx}`}
            >
              {idx > 0 && (
                <Icon
                  name="chevron-right"
                  className="shrink-0 text-slate-300 dark:text-slate-600"
                  plain
                  size="0.65rem"
                  aria-hidden="true"
                />
              )}
              {href ? (
                <Link
                  to={href}
                  className={isCurrent
                    ? 'min-w-0 break-words font-semibold text-slate-800 dark:text-slate-100'
                    : 'min-w-0 break-words text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300'}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  className={isCurrent
                    ? 'min-w-0 break-words font-semibold text-slate-800 dark:text-slate-100'
                    : 'min-w-0 break-words text-slate-500 dark:text-slate-400'}
                  title={item.label}
                >
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
