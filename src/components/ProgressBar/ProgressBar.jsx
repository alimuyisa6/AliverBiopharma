const PROGRESS_RING_PALETTE = [
  '#2563eb', '#1d4ed8', '#0f766e', '#047857', '#7c3aed', '#c2410c', '#16a34a',
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
  const sizeClass = { sm: 'h-10 w-10 text-[10px]', md: 'h-14 w-14 text-xs', lg: 'h-20 w-20 text-sm', xl: 'h-24 w-24 text-base' }[size] || 'h-14 w-14 text-xs';
  const ringColor = getProgressRingColor(tone);
  const circumference = 2 * Math.PI * 42;
  const ringOffset = circumference * (1 - progress / 100);
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full ${sizeClass}`}
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={safeMax}
      aria-label={ariaLabel || `${progress}% complete`}
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth={variant === 'thin' ? 7 : 10} />
        <circle cx="50" cy="50" r="42" fill="none" stroke={ringColor} strokeWidth={variant === 'thin' ? 7 : 10} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={ringOffset} />
      </svg>
      <span className="relative z-10 font-bold text-slate-800">{label ?? `${progress}%`}</span>
    </span>
  );
}

export default function ProgressBar({ value = 0, max = 100, variant = 'primary', showLabel, size }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const colors = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-500',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-600',
    info: 'bg-sky-600',
  };
  const colorClass = colors[variant.replace(/^progress-/, '')] || 'bg-primary-600';
  return (
    <div className={`relative w-full overflow-hidden rounded-full bg-slate-100 ${size === 'sm' ? 'h-1.5' : 'h-2.5'}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ease-out ${colorClass}`}
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      />
      {showLabel && <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold leading-none text-slate-700">{Math.round(pct)}%</span>}
    </div>
  );
}