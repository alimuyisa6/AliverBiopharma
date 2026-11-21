export default function Skeleton({
  width,
  height = 16,
  borderRadius,
  className = '',
  variant = 'default',
  lines = 1,
  avatar = false
}) {
  const base = 'animate-pulse rounded-lg bg-slate-200';
  if (variant === 'card') {
    return (
      <div className={`grid min-w-0 gap-3 rounded-2xl border border-slate-200 bg-white p-5 ${className}`.trim()} aria-hidden="true">
        {avatar && <div className={`${base} h-12 w-12 rounded-full`} />}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`${base} h-4 ${i === lines - 1 ? 'w-4/5' : 'w-full'}`} />
        ))}
      </div>
    );
  }
  if (variant === 'text') {
    return (
      <div className={`grid gap-2 ${className}`.trim()} aria-hidden="true">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={`${base} h-4 ${i === lines - 1 ? 'w-3/5' : 'w-full'}`} />
        ))}
      </div>
    );
  }
  if (variant === 'avatar') {
    return <div className={`animate-pulse rounded-full bg-slate-200 ${className}`.trim()} style={{ width: width || 60, height: height || 60 }} aria-hidden="true" />;
  }
  return <div className={`animate-pulse bg-slate-200 ${className}`.trim()} style={{ width, height, borderRadius }} aria-hidden="true" />;
}