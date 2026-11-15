import { useId } from 'react';

export function LiquidCard({ className = '', children, ...props }) {
  const filterId = `ab-liquid-glass-${useId().replace(/:/g, '')}`;
  return (
    <div className={['ab-liquid-card-wrap', className].filter(Boolean).join(' ')} {...props}>
      <svg className="ab-liquid-card__filter-defs" aria-hidden="true" focusable="false">
        <defs>
          <filter id={filterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency="0.025" numOctaves="1" seed="4" result="noise" />
            <feGaussianBlur in="noise" stdDeviation="1.4" result="soft-noise" />
            <feDisplacementMap in="SourceGraphic" in2="soft-noise" scale="12" xChannelSelector="R" yChannelSelector="B" result="distorted" />
            <feGaussianBlur in="distorted" stdDeviation="0.25" />
          </filter>
        </defs>
      </svg>
      <div className="ab-liquid-card" style={{ backdropFilter: `url("#${filterId}")`, WebkitBackdropFilter: `url("#${filterId}")` }}>
        {children}
      </div>
    </div>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return <div className={['ab-liquid-card__content', className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}

export default LiquidCard;
