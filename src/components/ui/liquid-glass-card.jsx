import { useId } from 'react';

export function LiquidCard({ className = '', children, ...props }) {
  const filterId = `ab-liquid-glass-${useId().replace(/:/g, '')}`;
  return (
    <div className={['relative isolate min-w-0 overflow-hidden rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-xl', className].filter(Boolean).join(' ')} {...props}>
      <svg className="pointer-events-none absolute h-0 w-0" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="1" seed="4" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="soft-noise" />
            <feDisplacementMap in="SourceGraphic" in2="soft-noise" scale="12" xChannelSelector="R" yChannelSelector="B" result="distorted" />
            <feGaussianBlur in="distorted" stdDeviation="0.25" />
          </filter>
        </defs>
      </svg>
      <div className="relative z-10 min-w-0 rounded-2xl bg-white/10" style={{ backdropFilter: `url("#${filterId}")`, WebkitBackdropFilter: `url("#${filterId}")` }}>
        {children}
      </div>
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={['relative z-10 min-w-0 p-5 sm:p-6', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}

export default LiquidCard;
