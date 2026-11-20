import { Link, useLocation } from 'react-router-dom';
import Icon from '../Icon/Icon';

export default function Breadcrumb({ items = [], className = '' }) {
  const location = useLocation();
  if (!items.length) return null;

  const currentHref = `${location.pathname}${location.search}${location.hash}`;

  return (
    <nav
      className={[`min-w-0 max-w-full overflow-x-auto text-sm text-slate-500 dark:text-slate-400`, className].filter(Boolean).join(' ')}
      aria-label="Breadcrumb"
    >
      <ol className="flex w-max min-w-full flex-nowrap items-center gap-2 whitespace-nowrap py-0.5">
        {items.map((item, idx) => {
          const isCurrent = idx === items.length - 1;
          const href = item.href || (isCurrent ? currentHref : null);

          return (
            <li
              className="inline-flex shrink-0 items-center gap-2"
              key={`${item.label}-${idx}`}
            >
              {idx > 0 && (
                <svg
                  className="mx-0.5 h-4 w-4 shrink-0 text-blue-400 dark:text-blue-500"
                  viewBox="0 0 16 16"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5.5 3.25 10.25 8l-4.75 4.75"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
              {item.onClick ? (
                <button
                  type="button"
                  onClick={item.onClick}
                  className={isCurrent
                    ? 'whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100'
                    : 'whitespace-nowrap text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300'}
                  aria-current={isCurrent ? 'page' : undefined}
                  title={item.label}
                >
                  {item.label}
                </button>
              ) : href ? (
                <Link
                  to={href}
                  className={isCurrent
                    ? 'whitespace-nowrap font-semibold text-slate-800 dark:text-slate-100'
                    : 'whitespace-nowrap text-slate-500 transition-colors hover:text-blue-700 dark:text-slate-400 dark:hover:text-blue-300'}
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
