
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
      <svg viewBox="0 0 160 120" focusable="false">
        <rect x="14" y="14" width="132" height="92" rx="12" fill="currentColor" opacity=".08" />
        <circle cx="53" cy="43" r="10" fill="currentColor" opacity=".38" />
        <path d="M25 91 58 59l18 17 18-21 40 36" fill="none" stroke="currentColor" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" opacity=".55" />
      </svg>
      <span>Learning preview</span>
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

  return (
    <figure
      className={['sticky-polaroid-frame', 'sticky-polaroid-' + noteColor, className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="relative overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {skeleton ? (
          <div className="flex min-h-48 flex-col gap-3 p-4" aria-label="Loading preview"><span /></div>
        ) : placeholder || !children ? (
          <MediaPlaceholder />
        ) : (
          <div className="min-w-0 [&_img]:max-h-80 [&_img]:w-full [&_img]:object-cover">{children}</div>
        )}
      </div>
      <figcaption className="grid gap-4 p-3 sm:grid-cols-2">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-secondary-700">FIELD NOTE</span>
          <strong className="mt-1 block text-sm font-bold leading-5 text-slate-900">{noteTitle}</strong>
          {noteText && <p className="mt-1 text-xs leading-5 text-slate-600">{noteText}</p>}
          {noteFooter && <small className="mt-2 block text-[10px] leading-4 text-slate-500">{noteFooter}</small>}
        </div>
        <div className="relative min-w-0 rounded-lg border border-amber-200/70 bg-amber-50 p-3 shadow-sm" aria-label={noteTitle}>
          <PaperClip />
          <span className="mt-3 block text-sm font-bold leading-5 text-slate-900">{noteTitle}</span>
          {noteText && <span className="mt-1 block text-xs leading-5 text-slate-700">{noteText}</span>}
        </div>
      </figcaption>
    </figure>
  );
}
