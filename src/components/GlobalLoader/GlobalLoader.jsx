import { useEffect } from 'react';
import './GlobalLoader.css';

export default function GlobalLoader({
  tagline = 'Welcome to biology & pharmacy',
  onAnimationComplete
}) {
  useEffect(() => {
    if (!onAnimationComplete) return undefined;
    const timer = window.setTimeout(onAnimationComplete, 1300);
    return () => window.clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="aliver-global-loader" role="status" aria-live="polite" aria-label="Loading AliverBiopharm">
      <div className="aliver-loader-content">
        <p className="aliver-loader-brand">AliverBiopharm</p>
        <p className="aliver-loader-tagline">{tagline}</p>
        <div className="aliver-loader-progress" aria-hidden="true"><span /></div>
        <span className="aliver-loader-status">Loading your learning space…</span>
      </div>
    </div>
  );
}
