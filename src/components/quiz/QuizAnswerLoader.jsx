import { useId } from 'react';

const RING = [
  [50, 14], [68, 18.82], [81.18, 32], [86, 50], [81.18, 68], [68, 81.18],
  [50, 86], [32, 81.18], [18.82, 68], [14, 50], [18.82, 32], [32, 18.82],
];

const TICK = [
  [22, 54], [27.5, 59.5], [33, 65], [38.4, 70.4], [43.7, 68], [48.9, 62.2],
  [54.1, 56.5], [59.3, 50.8], [64.5, 45.1], [69.7, 39.4], [74.9, 33.7], [80, 28],
];

const CROSS = [
  [31.67, 31.67], [39, 39], [46.33, 46.33], [53.67, 53.67], [61, 61], [68.33, 68.33],
  [68.33, 31.67], [61, 39], [53.67, 46.33], [46.33, 53.67], [39, 61], [31.67, 68.33],
];

const SHAPE_BY_STATUS = { checking: RING, correct: TICK, wrong: CROSS };

const PATH_BY_STATUS = {
  correct: 'M22 54L40 72L80 28',
  wrong: 'M28 28L72 72M72 28L28 72',
};

const COLOR_BY_STATUS = {
  correct: 'var(--success)',
  wrong: 'var(--danger)',
};

const RESULT_SCALE = 0.5;
const KEY_TIMES = '0;0.18;0.34;0.45;1';
const BEGINS = RING.map((_, i) => (i === 0 ? '0s' : '-' + (1.2 - i * 0.1).toFixed(1) + 's'));

const DEFAULT_LABELS = {
  checking: 'Checking your answer',
  correct: 'Correct answer',
  wrong: 'Incorrect answer',
};

/**
 * status: 'checking' | 'correct' | 'wrong'
 * labels: accessible names supplied by the caller/i18n when available.
 */
export default function QuizAnswerLoader({ status = 'checking', size = 100, labels }) {
  const uid = useId().replace(/:/g, '');
  const bubbleId = uid + '-bub';
  const glowId = uid + '-glow';
  const checking = status === 'checking';
  const points = SHAPE_BY_STATUS[status] ?? RING;
  const scale = checking ? 1 : RESULT_SCALE;
  const resultColor = COLOR_BY_STATUS[status];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={labels?.[status] || DEFAULT_LABELS[status] || DEFAULT_LABELS.checking}
      focusable="false"
    >
      <defs>
        <radialGradient id={bubbleId} cx="40%" cy="35%" r="70%">
          <stop offset="0%" style={{ stopColor: 'var(--accent, currentColor)' }} />
          <stop offset="100%" style={{ stopColor: 'var(--primary, currentColor)' }} />
        </radialGradient>
        <filter id={glowId} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {points.map(([x, y], i) => (
        <g
          key={i}
          transform={"translate(" + x + " " + y + ") scale(" + scale + ")"}
          style={{
            transformBox: 'view-box',
            transformOrigin: x + 'px ' + y + 'px',
            transition: 'transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1) ' + (i * 8) + 'ms',
          }}
        >
          <g>
            <circle
              r="7"
              fill="currentColor"
              fillOpacity="0.06"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="1"
            />
            <circle r="4.6" fill="currentColor" fillOpacity="0.14" />
            <circle
              r="4.6"
              fill={"url(#" + bubbleId + ")"}
              opacity="0"
              filter={"url(#" + glowId + ")"}
            >
              {checking && (
                <animate
                  attributeName="opacity"
                  values="0;1;0.35;0;0"
                  keyTimes={KEY_TIMES}
                  dur="1.2s"
                  begin={BEGINS[i]}
                  repeatCount="indefinite"
                />
              )}
            </circle>
            <circle
              r="7.5"
              style={{
                fill: resultColor,
                opacity: checking ? 0 : 1,
                transition: 'opacity 180ms linear ' + (i * 8) + 'ms',
              }}
            />
            {checking && (
              <animateTransform
                attributeName="transform"
                type="scale"
                values="1;1.4;0.95;1;1"
                keyTimes={KEY_TIMES}
                calcMode="spline"
                keySplines="0.2 0.7 0.3 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1"
                dur="1.2s"
                begin={BEGINS[i]}
                repeatCount="indefinite"
              />
            )}
          </g>
        </g>
      ))}

      {PATH_BY_STATUS[status] && (
        <path
          d={PATH_BY_STATUS[status]}
          pathLength="1"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            stroke: resultColor,
            strokeDasharray: 1,
            strokeDashoffset: checking ? 1 : 0,
            opacity: checking ? 0 : 1,
            transition:
              'stroke-dashoffset 260ms cubic-bezier(0.4, 0, 0.2, 1) 120ms, opacity 100ms linear 120ms',
          }}
        />
      )}
    </svg>
  );
}
