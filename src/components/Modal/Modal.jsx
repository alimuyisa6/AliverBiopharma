import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Icon from '../Icon/Icon';

export default function Modal({ open, onClose, title, children, footer, size }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    if (!open) return;

    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizeClass = size === 'lg' ? 'max-w-4xl' : size === 'sm' ? 'max-w-md' : 'max-w-2xl';

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm sm:p-6"
      ref={overlayRef}
      onClick={(event) => {
        if (event.target === overlayRef.current) onClose();
      }}
    >
      <div className={`my-auto w-full ${sizeClass} overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="min-w-0 text-lg font-bold leading-7 text-slate-900 sm:text-xl">{title}</h2>
          <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600" onClick={onClose} aria-label="Close">
            <Icon name="xmark" className="h-5 w-5" />
          </button>
        </div>
        <div className="max-h-[min(75vh,48rem)] overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">{children}</div>
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}