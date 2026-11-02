import './PageSkeleton.css';

export default function PageSkeleton({ variant = 'page' }) {
  const compact = variant === 'compact';

  return (
    <div className={`page-skeleton${compact ? ' page-skeleton--compact' : ''}`} role="status" aria-label="Loading content">
      <span className="page-skeleton__sr-only">Loading content</span>
      <div className="page-skeleton__heading">
        <span className="page-skeleton__bar page-skeleton__bar--eyebrow" />
        <span className="page-skeleton__bar page-skeleton__bar--title" />
        <span className="page-skeleton__bar page-skeleton__bar--description" />
      </div>
      <div className="page-skeleton__toolbar">
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill" />
        <span className="page-skeleton__pill page-skeleton__pill--short" />
      </div>
      <div className="page-skeleton__grid">
        <div className="page-skeleton__card page-skeleton__card--feature">
          <span className="page-skeleton__bar page-skeleton__bar--card-title" />
          <span className="page-skeleton__bar" />
          <span className="page-skeleton__bar page-skeleton__bar--medium" />
          <span className="page-skeleton__block" />
          <span className="page-skeleton__bar page-skeleton__bar--medium" />
        </div>
        <div className="page-skeleton__card">
          <span className="page-skeleton__block page-skeleton__block--small" />
          <span className="page-skeleton__bar page-skeleton__bar--card-title" />
          <span className="page-skeleton__bar" />
          <span className="page-skeleton__bar page-skeleton__bar--medium" />
        </div>
        <div className="page-skeleton__card">
          <span className="page-skeleton__block page-skeleton__block--small" />
          <span className="page-skeleton__bar page-skeleton__bar--card-title" />
          <span className="page-skeleton__bar" />
          <span className="page-skeleton__bar page-skeleton__bar--medium" />
        </div>
      </div>
    </div>
  );
}
