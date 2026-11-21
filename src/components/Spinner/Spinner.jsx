export default function Spinner({ size = 'md', context = 'default' }) {
  const lineCount = context === 'media' ? 2 : context === 'data' ? 3 : 4;
  const compact = size === 'sm';
  const large = size === 'lg';
  return (
    <div className={`flex w-full flex-col gap-3 ${compact ? 'max-w-xs' : large ? 'max-w-2xl gap-4' : 'max-w-xl'}`} role="status" aria-label="Loading content">
      <span className="sr-only">Loading content</span>
      <span className={`h-5 animate-pulse rounded-md bg-slate-200 ${large ? 'w-2/3' : 'w-1/2'}`} />
      {Array.from({ length: lineCount - 1 }, (_, index) => (
        <span className={`h-4 animate-pulse rounded-md bg-slate-100 ${index === lineCount - 2 ? 'w-4/5' : 'w-full'}`} key={index} />
      ))}
    </div>
  );
}