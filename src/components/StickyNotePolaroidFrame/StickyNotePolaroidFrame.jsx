import './StickyNotePolaroidFrame.css';

function PaperClip() {
  return (
    <svg className="sticky-polaroid-clip" viewBox="0 0 28 48" aria-hidden="true" focusable="false">
      <path d="M18 7.5v25.2a7 7 0 0 1-14 0V9.5a5 5 0 0 1 10 0v21a3 3 0 0 1-6 0V12" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MediaPlaceholder() {
  return (
    <div className="sticky-polaroid-placeholder" aria-hidden="true">
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
      <div className="sticky-polaroid-photo">
        {skeleton ? (
          <div className="sticky-polaroid-skeleton" aria-label="Loading preview"><span /></div>
        ) : placeholder || !children ? (
          <MediaPlaceholder />
        ) : (
          <div className="sticky-polaroid-media">{children}</div>
        )}
      </div>
      <figcaption className="sticky-polaroid-caption">
        <div className="sticky-polaroid-caption-copy">
          <span className="sticky-polaroid-kicker">FIELD NOTE</span>
          <strong>{noteTitle}</strong>
          {noteText && <p>{noteText}</p>}
          {noteFooter && <small>{noteFooter}</small>}
        </div>
        <div className="sticky-polaroid-paper-note" aria-label={noteTitle}>
          <PaperClip />
          <span className="sticky-polaroid-note-heading">{noteTitle}</span>
          {noteText && <span className="sticky-polaroid-note-body">{noteText}</span>}
        </div>
      </figcaption>
    </figure>
  );
}
