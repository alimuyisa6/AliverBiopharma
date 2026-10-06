/* components/Spinner/Spinner.jsx */
import { useId } from 'react';

function PencilLoader({ sizeClass = '' }) {
  const id = useId();
  const clipId = `pencil-eraser-${id.replace(/:/g, '')}`;

  return (
    <svg
      className={`pencil-loader ${sizeClass}`.trim()}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 200"
      role="img"
      aria-label="Loading"
    >
      <defs>
        <clipPath id={clipId}>
          <rect height="30" width="30" ry="5" rx="5" />
        </clipPath>
      </defs>

      <circle
        transform="rotate(-113,100,100)"
        strokeLinecap="round"
        strokeDashoffset="439.82"
        strokeDasharray="439.82 439.82"
        strokeWidth="2"
        stroke="currentColor"
        fill="none"
        r="70"
        className="pencil-loader__stroke"
      />

      <g transform="translate(100,100)" className="pencil-loader__rotate">
        <g fill="none">
          <circle
            transform="rotate(-90)"
            strokeDashoffset="402"
            strokeDasharray="402.12 402.12"
            strokeWidth="30"
            stroke="var(--pencil-loader-body)"
            r="64"
            className="pencil-loader__body1"
          />
          <circle
            transform="rotate(-90)"
            strokeDashoffset="465"
            strokeDasharray="464.96 464.96"
            strokeWidth="10"
            stroke="var(--pencil-loader-body-highlight)"
            r="74"
            className="pencil-loader__body2"
          />
          <circle
            transform="rotate(-90)"
            strokeDashoffset="339"
            strokeDasharray="339.29 339.29"
            strokeWidth="10"
            stroke="var(--pencil-loader-body-shadow)"
            r="54"
            className="pencil-loader__body3"
          />
        </g>

        <g
          transform="rotate(-90) translate(49,0)"
          className="pencil-loader__eraser"
        >
          <g className="pencil-loader__eraser-skew">
            <rect
              height="30"
              width="30"
              ry="5"
              rx="5"
              fill="var(--pencil-loader-eraser)"
            />
            <rect
              clipPath={`url(#${clipId})`}
              height="30"
              width="5"
              fill="var(--pencil-loader-eraser-shadow)"
            />
            <rect
              height="20"
              width="30"
              fill="var(--pencil-loader-ferrule-light)"
            />
            <rect
              height="20"
              width="15"
              fill="var(--pencil-loader-ferrule-mid)"
            />
            <rect
              height="20"
              width="5"
              fill="var(--pencil-loader-ferrule-highlight)"
            />
            <rect
              height="2"
              width="30"
              y="6"
              fill="var(--pencil-loader-ferrule-groove)"
            />
            <rect
              height="2"
              width="30"
              y="13"
              fill="var(--pencil-loader-ferrule-groove)"
            />
          </g>
        </g>

        <g
          transform="rotate(-90) translate(49,-30)"
          className="pencil-loader__point"
        >
          <polygon
            points="15 0,30 30,0 30"
            fill="var(--pencil-loader-wood)"
          />
          <polygon
            points="15 0,6 30,0 30"
            fill="var(--pencil-loader-wood-shadow)"
          />
          <polygon
            points="15 0,20 10,10 10"
            fill="var(--pencil-loader-graphite)"
          />
        </g>
      </g>
    </svg>
  );
}

export default function Spinner({
  size,
  variant = 'brand',
  context = 'default'
}) {
  const loaderMap = {
    default: `spinner spinner-${variant}`,
    brand: 'spinner spinner-brand spinner-pencil',
    conic: 'spinner spinner-conic',
    media: 'spinner spinner-equalizer',
    data: 'spinner spinner-chart',
  };

  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  if (context === 'media' || context === 'data') {
    const barCount = context === 'media' ? 5 : 7;

    return (
      <div
        className={`${loaderMap[context]} ${sizeClass}`}
        role="status"
        aria-label="Loading"
      >
        {Array.from({ length: barCount }).map((_, i) => (
          <span key={i}></span>
        ))}
      </div>
    );
  }

  if (variant === 'brand' && context === 'default') {
    return <PencilLoader sizeClass={`${loaderMap.brand} ${sizeClass}`.trim()} />;
  }

  return (
    <div
      className={`${loaderMap[context] || loaderMap.default} ${sizeClass}`}
      role="status"
      aria-label="Loading"
    />
  );
}
