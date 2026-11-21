export default function PageSkeleton({ variant = 'page' }) {
  const compact = variant === 'compact';
  const bar = 'animate-pulse rounded-md bg-slate-200';
  const block = 'animate-pulse rounded-xl bg-slate-100';
  return (
    <div className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 ${compact ? 'py-4' : 'py-8'}`} role="status" aria-label="Loading content">
      <span className="sr-only">Loading content</span>
      <div className="mb-7 flex flex-col gap-3">
        <span className={`${bar} h-3 w-24`} />
        <span className={`${bar} h-8 w-2/3 max-w-xl sm:h-10`} />
        <span className={`${bar} h-4 w-full max-w-2xl`} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <span className="h-8 w-24 animate-pulse rounded-full bg-slate-100" />
        <span className="h-8 w-28 animate-pulse rounded-full bg-slate-100" />
        <span className="h-8 w-16 animate-pulse rounded-full bg-slate-100" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2 ${compact ? 'p-4' : 'sm:p-6'}`}>
          <span className={`${bar} h-5 w-1/2`} />
          <span className={`${bar} h-4 w-full`} />
          <span className={`${bar} h-4 w-4/5`} />
          <span className={`${block} h-40 w-full`} />
          <span className={`${bar} h-4 w-3/4`} />
        </div>
        {Array.from({ length: 2 }, (_, index) => (
          <div key={index} className="grid content-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <span className={`${block} h-12 w-12`} />
            <span className={`${bar} h-5 w-1/2`} />
            <span className={`${bar} h-4 w-full`} />
            <span className={`${bar} h-4 w-4/5`} />
          </div>
        ))}
      </div>
    </div>
  );
}