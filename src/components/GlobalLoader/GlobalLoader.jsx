import { useEffect, useId } from 'react';
import './GlobalLoader.css';

export default function GlobalLoader({
  tagline = 'Welcome to biology & pharmacy',
  onAnimationComplete
}) {
  const reactId = useId();
  const logoId = `aliver-loader-logo-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  // This loader now has a single opening step. It stays visible while the
  // app performs its initial auth/data loading; there is no timed exit.
  useEffect(() => {
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  return (
    <div
      className="aliver-global-loader"
      role="status"
      aria-live="polite"
      aria-label="Loading AliverBiopharm"
    >
      <div className="aliver-loader-stage">
        <div className="aliver-loader-card">
          <svg viewBox="0 0 260 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id={logoId} x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="var(--loader-accent)" />
                <stop offset="1" stopColor="var(--loader-accent-secondary)" />
              </linearGradient>
            </defs>

            <g className="aliver-loader-opening-mark">
              <circle cx="130" cy="43" r="25" fill={`url(#${logoId})`} opacity=".12" />
              <path
                d="M130 25c-8 0-14 6-14 14s6 14 14 14 14-6 14-14-6-14-14-14Z"
                fill="none"
                stroke={`url(#${logoId})`}
                strokeWidth="2.5"
              />
              <path
                d="M116 39h28M130 25v28M121 30l18 18M139 30l-18 18"
                fill="none"
                stroke={`url(#${logoId})`}
                strokeWidth="1.6"
                strokeLinecap="round"
                opacity=".85"
              />
            </g>

            <text
              className="aliver-loader-tagline"
              x="130"
              y="88"
              textAnchor="middle"
            >
              {tagline}
            </text>

            <image
              className="aliver-loader-logo"
              href="/images/logo.png"
              x="93"
              y="96"
              width="74"
              height="36"
              preserveAspectRatio="xMidYMid meet"
            />

            <rect className="aliver-loader-progress-track" x="48" y="142" width="164" height="2.5" rx="1.25" />
            <rect className="aliver-loader-progress" x="48" y="142" width="164" height="2.5" rx="1.25" />
          </svg>
        </div>
        <div className="aliver-loader-shadow" />
      </div>
    </div>
  );
}
