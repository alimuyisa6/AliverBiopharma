import { useId } from 'react';
import './charts.css';

export default function ChartCard({
  title,
  subtitle,
  action,
  children,
  loading = false,
  empty = false,
  error = null,
  summary = '',
  className = ''
}) {
  const titleId = useId();

  return (
    <section className={`ch-shell ${className}`} aria-labelledby={titleId}>
      <div className="ch-card">
        <header className="ch-card-head">
          <div className="ch-card-heading">
            {title && <h2 id={titleId} className="ch-card-title">{title}</h2>}
            {subtitle && <p className="ch-card-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="ch-card-action">{action}</div>}
        </header>

        <div className="ch-card-body">
          {loading ? (
            <div className="ch-skeleton" role="status" aria-label="Loading chart">
              <span className="ch-skeleton-line" />
              <span className="ch-skeleton-line" />
              <span className="ch-skeleton-line" />
            </div>
          ) : error ? (
            <div className="ch-error" role="alert">{error}</div>
          ) : empty ? (
            <div className="ch-empty" role="status">No chart data available.</div>
          ) : (
            <>
              {children}
              {summary && <p className="ch-chart-summary">{summary}</p>}
            </>
          )}
        </div>
      </div>
    </section>
  );
}