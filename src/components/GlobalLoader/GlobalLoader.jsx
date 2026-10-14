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

            <g className="aliver-loader-dna" fill="none" strokeLinecap="round">
              <path className="aliver-loader-dna-strand aliver-loader-dna-strand-a" d="M83 18 C111 27 111 39 130 45 S149 63 177 72" />
              <path className="aliver-loader-dna-strand aliver-loader-dna-strand-b" d="M177 18 C149 27 149 39 130 45 S111 63 83 72" />
              <path className="aliver-loader-dna-rung" d="M96 23 L164 23 M108 32 L152 32 M119 41 L141 41 M119 49 L141 49 M108 59 L152 59 M96 68 L164 68" />
            </g>
            <g className="aliver-loader-pill" transform="translate(130 43) rotate(-28)">
              <rect x="-26" y="-9" width="52" height="18" rx="9" fill="var(--loader-pill-light)" stroke="var(--loader-accent-secondary)" strokeWidth="1.5" />
              <path d="M0 -9H-17A9 9 0 0 0 -17 9H0Z" fill={`url(#${logoId})`} />
              <path d="M0 -8V8" stroke="var(--loader-accent-secondary)" strokeWidth="1.2" />
              <path d="M-19 -4H-7" stroke="white" strokeWidth="2" strokeLinecap="round" opacity=".8" />
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
