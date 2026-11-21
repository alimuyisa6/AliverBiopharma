import { useId } from 'react';

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  error = null,
  summary = '',
  className = '',
  embedded = false
}) {
  const titleId = useId();

  if (embedded) {
    if (loading) return <div className="grid gap-3 rounded-xl bg-slate-50 p-4" role="status" aria-label="Loading chart"><span className="h-4 animate-pulse rounded bg-slate-200" /><span className="h-4 animate-pulse rounded bg-slate-200" /><span className="h-4 animate-pulse rounded bg-slate-200" /></div>;
    if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</div>;
    if (empty) return <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500" role="status">No chart data available.</div>;
    return <>{children}{summary && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{summary}</p>}</>;
  }

  return (
    <section className={`w-full min-w-0 ${className}`} aria-labelledby={titleId}>
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <header className="flex flex-col gap-3 border-b border-slate-100 px-4 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-5">
          <div className="min-w-0">
            {title && <h2 id={titleId} className="text-base font-bold leading-6 text-slate-900 sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm leading-5 text-slate-600">{subtitle}</p>}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>

        <div className="min-w-0 p-4 sm:p-5">
          {loading ? (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4" role="status" aria-label="Loading chart">
              <span className="h-4 animate-pulse rounded bg-slate-200" />
              <span className="h-4 animate-pulse rounded bg-slate-200" />
              <span className="h-4 animate-pulse rounded bg-slate-200" />
            </div>
          ) : error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800" role="alert">{error}</div>
          ) : empty ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500" role="status">No chart data available.</div>
          ) : (
            <>
              {children}
              {summary && <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">{summary}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}