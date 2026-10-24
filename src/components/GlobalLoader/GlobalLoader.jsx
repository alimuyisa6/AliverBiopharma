import { useEffect } from 'react';
import './GlobalLoader.css';

export default function GlobalLoader({
  tagline = 'Welcome to biology & pharmacy',
  onAnimationComplete
}) {
  useEffect(() => {
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  return (
    <div className="aliver-global-loader" role="status" aria-live="polite" aria-label="Loading AliverBiopharm">
      <div className="aliver-loader-card">
        <div className="aliver-loader-orbit" aria-hidden="true">
          <span className="aliver-loader-orbit-dot" />
          <span className="aliver-loader-orbit-core">AB</span>
        </div>
        <div className="aliver-loader-capsule" aria-hidden="true"><span /><span /></div>
        <p className="aliver-loader-tagline">{tagline}</p>
        <div className="aliver-loader-progress" aria-hidden="true"><span /></div>
      </div>
    </div>
  );
}
