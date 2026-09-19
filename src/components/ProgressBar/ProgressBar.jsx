/* components/ProgressBar/ProgressBar.jsx */
const PROGRESS_RING_PALETTE = [
  'var(--blue-600)', 'var(--emerald-600)', 'var(--teal-600)',
  'var(--amber-600)', 'var(--yellow-600)', 'var(--violet-600)', 'var(--green-600)',
];

function hashProgressKey(value) {
  const input = String(value || 'progress');
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = ((hash << 5) - hash) + input.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getProgressRingColor(key) {
  return PROGRESS_RING_PALETTE[hashProgressKey(key) % PROGRESS_RING_PALETTE.length];
}

export function ProgressRing({
  value = 0, max = 100, size = 'md', variant = 'standard', tone, label, ariaLabel,
}) {
  const safeMax = Number(max) > 0 ? Number(max) : 100;
  const safeValue = Math.min(safeMax, Math.max(0, Number(value) || 0));
  const progress = Math.round((safeValue / safeMax) * 100);
  return (
    <span
      className={`progress-ring progress-ring-${size} progress-ring-${variant}`}
      style={{
        '--progress-ring-progress': `${progress}%`,
        '--progress-ring-color': getProgressRingColor(tone),
      }}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={ariaLabel || `${progress}% complete`}
    >
      <span className="progress-ring__inner">{label ?? `${progress}%`}</span>
    </span>
  );
}

export default function ProgressBar({ value = 0, max = 100, variant = 'primary', showLabel, size }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={`progress-track ${size === 'sm' ? 'progress-sm' : ''}`}>
      <div
        className={`progress-fill ${variant.startsWith('progress-') ? variant : `progress-${variant}`}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
      {showLabel && <span className="progress-label">{Math.round(pct)}%</span>}
    </div>
  );
}
