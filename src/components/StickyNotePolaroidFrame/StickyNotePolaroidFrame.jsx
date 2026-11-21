function PaperClip() {
  return (
    <svg className="absolute -top-3 left-5 h-9 w-5 text-slate-500" viewBox="0 0 28 48" aria-hidden="true" focusable="false">
      <path d="M18 7.5v25.2a7 7 0 0 1-14 0V9.5a5 5 0 0 1 10 0v21a3 3 0 0 1-6 0V12" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MediaPlaceholder() {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 bg-slate-100 p-5 text-center text-slate-500" aria-hidden="true">
      <svg className="h-28 w-full max-w-40" viewBox="0 0 160 120" focusable="false">
        <rect x="14" y="14" width="132" height="92" rx="12" fill="currentColor" opacity=".08" />
        <circle cx="53" cy="43" r="10" fill="currentColor" opacity=".38" />
        <path d="M25 91 58 59l18 17 18-21 40 36" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      </svg>
      <span className="text-xs font-semibold">Learning preview</span>
    </div>
  );
}

export default function StickyNotePolaroidFrame({
  children,
  noteTitle = 'Study note',
  noteText = '',
  noteFooter = '',
  noteColor = 'gold',
  rotation = -2,
  width = '100%',
  skeleton = false,
  placeholder = false,
  className = '',
  mediaAlt = '',
}) {
  const style = {
    '--sticky-polaroid-rotation': typeof rotation === 'number' ? rotation + 'deg' : rotation,
    '--sticky-polaroid-width': typeof width === 'number' ? width + 'px' : width,
  };
  const paperColors = {
    gold: 'border-amber-200 bg-amber-50',
    yellow: 'border-yellow-200 bg-yellow-50',
    blue: 'border-sky-200 bg-sky-50',
    pink: 'border-rose-200 bg-rose-50',
    mint: 'border-emerald-200 bg-emerald-50',
    white: 'border-slate-200 bg-white',
  };
  const paperColor = paperColors[noteColor] || paperColors.gold;

  return (
    <figure className={`relative mx-auto w-[var(--sticky-polaroid-width)] max-w-full rotate-[var(--sticky-polaroid-rotation)] rounded-xl border border-slate-200 bg-white p-2.5 shadow-lg transition-transform hover:rotate-0 ${className}`.trim()} style={style}>
      <div className="relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50" aria-label={mediaAlt || noteTitle}>
        {skeleton ? (
          <div className="flex min-h-48 flex-col gap-3 p-4" aria-label="Loading preview" role="status">
            <span className="h-4 w-1/2 animate-pulse rounded bg-slate-200" />
            <span className="h-32 animate-pulse rounded-xl bg-slate-100" />
          </div>
        ) : placeholder || !children ? (
          <MediaPlaceholder />
        ) : (
          <div className="min-w-0 [&_img]:max-h-80 [&_img]:w-full [&_img]:object-cover">{children}</div>
        )}
      </div>
      <figcaption className="grid gap-4 p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary-700">Field note</span>
          <strong className="mt-1 block text-sm font-bold leading-5 text-slate-900">{noteTitle}</strong>
          {noteText && <p className="mt-1 text-xs leading-5 text-slate-600">{noteText}</p>}
          {noteFooter && <small className="mt-2 block text-[10px] leading-4 text-slate-500">{noteFooter}</small>}
        </div>
        <div className={`relative min-w-0 rounded-lg border p-3 shadow-sm ${paperColor}`} aria-label={noteTitle}>
          <PaperClip />
          <span className="mt-3 block text-sm font-bold leading-5 text-slate-900">{noteTitle}</span>
          {noteText && <span className="mt-1 block text-xs leading-5 text-slate-700">{noteText}</span>}
        </div>
      </figcaption>
    </figure>
  );
}
