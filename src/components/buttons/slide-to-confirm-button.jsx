import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Accessible drag-to-confirm control for consequential actions.
 * Keep the action itself in the parent so payment/account workflows remain
 * owned by their existing API handlers.
 */
export default function SlideToConfirmButton({
  label = 'Slide to confirm',
  onConfirm,
  disabled = false,
  loading = false,
  variant = 'primary',
  className = '',
  confirmLabel = 'Confirmed',
  hint = 'Drag the handle all the way to the end',
  ...props
}) {
  const trackRef = useRef(null);
  const knobRef = useRef(null);
  const startPointerX = useRef(0);
  const startOffset = useRef(0);
  const currentOffset = useRef(0);
  const confirmedRef = useRef(false);
  const busyRef = useRef(false);
  const [offset, setOffset] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [actionError, setActionError] = useState('');
  const [trackWidth, setTrackWidth] = useState(0);

  const isDisabled = disabled || loading || confirmed;

  useEffect(() => {
    if (!trackRef.current) return undefined;
    const element = trackRef.current;
    let measureFrame = 0;
    const measure = () => {
      if (measureFrame) cancelAnimationFrame(measureFrame);
      // Defer React state updates until after ResizeObserver delivery and
      // avoid rerenders when the measured width has not actually changed.
      measureFrame = requestAnimationFrame(() => {
        measureFrame = 0;
        const nextWidth = element.getBoundingClientRect().width;
        setTrackWidth((current) => Math.abs(current - nextWidth) < 0.5 ? current : nextWidth);
      });
    };
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => {
        cancelAnimationFrame(measureFrame);
        window.removeEventListener('resize', measure);
      };
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => {
      cancelAnimationFrame(measureFrame);
      observer.disconnect();
    };
  }, []);

  const maxOffset = Math.max(0, trackWidth - (knobRef.current?.offsetWidth || 48) - 8);
  const setPosition = useCallback((next) => {
    const safe = Math.max(0, Math.min(maxOffset, next));
    currentOffset.current = safe;
    setOffset(safe);
    return safe;
  }, [maxOffset]);

  const finish = useCallback(async (distance) => {
    if (isDisabled || busyRef.current || confirmedRef.current) return;
    const finalOffset = setPosition(distance);
    if (maxOffset <= 0 || finalOffset < maxOffset * 0.92) {
      setPosition(0);
      return;
    }

    confirmedRef.current = true;
    busyRef.current = true;
    setActionError('');
    try {
      await onConfirm?.();
      setConfirmed(true);
    } catch (error) {
      confirmedRef.current = false;
      setPosition(0);
      setActionError(error?.message || 'That action could not be completed. Please try again.');
    } finally {
      busyRef.current = false;
    }
  }, [isDisabled, maxOffset, onConfirm, setPosition]);

  const handlePointerDown = (event) => {
    if (isDisabled || maxOffset <= 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    startPointerX.current = event.clientX;
    startOffset.current = currentOffset.current;
    setActionError('');
  };

  const handlePointerMove = (event) => {
    if (isDisabled || !event.currentTarget.hasPointerCapture?.(event.pointerId)) return;
    setPosition(startOffset.current + event.clientX - startPointerX.current);
  };

  const handlePointerUp = (event) => {
    if (isDisabled) return;
    const distance = startOffset.current + event.clientX - startPointerX.current;
    finish(distance);
  };

  const handleKeyDown = (event) => {
    if (isDisabled) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      setPosition(currentOffset.current + Math.max(12, maxOffset * 0.12));
    } else if (event.key === 'Home') {
      event.preventDefault();
      setPosition(0);
    } else if (event.key === 'End' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      finish(event.key === 'End' ? maxOffset : currentOffset.current >= maxOffset * 0.92 ? maxOffset : currentOffset.current);
    }
  };

  return (
    <div className={`w-full min-w-0 ${className}`.trim()} {...props}>
      <div
        ref={trackRef}
        className={`relative flex min-h-16 w-full items-center overflow-hidden rounded-full border px-2 shadow-inner transition-colors ${confirmed ? "border-emerald-300 bg-emerald-50" : isDisabled ? "border-slate-200 bg-slate-100" : variant === "secondary" ? "border-secondary-200 bg-secondary-50" : "border-primary-200 bg-primary-50"}`}
        role="group"
        aria-label={label}
        aria-describedby={actionError ? undefined : 'slide-confirm-hint'}
      >
        <span className={`pointer-events-none absolute left-16 right-4 text-center text-sm font-bold ${confirmed ? "text-emerald-800" : isDisabled ? "text-slate-500" : "text-primary-900"}`} aria-live="polite">
          {confirmed ? confirmLabel : loading ? 'Processing…' : label}
        </span>
        <span className="pointer-events-none absolute bottom-1.5 left-16 right-4 text-center text-[10px] font-medium text-slate-500" id="slide-confirm-hint" aria-hidden="true">
          {confirmed ? 'Complete' : hint}
        </span>
        <button
          ref={knobRef}
          type="button"
          className={`relative z-10 flex h-12 w-12 shrink-0 touch-none items-center justify-center rounded-full shadow-md transition-colors ${isDisabled ? "cursor-not-allowed bg-slate-400 text-white" : confirmed ? "cursor-default bg-emerald-600 text-white" : variant === "secondary" ? "cursor-grab bg-secondary-600 text-white active:cursor-grabbing" : "cursor-grab bg-primary-700 text-white active:cursor-grabbing"}`}
          aria-label={`${label}. Drag right to confirm.`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={maxOffset ? Math.round((offset / maxOffset) * 100) : 0}
          role="slider"
          disabled={isDisabled}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => setPosition(0)}
          onKeyDown={handleKeyDown}
          style={{ transform: `translateX(${offset}px)`, '--slide-confirm-progress': maxOffset ? `${(offset / maxOffset) * 100}%` : '0%' }}
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />
          ) : confirmed ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4.5 4.5L19 7" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          )}
        </button>
      </div>
      {actionError && <p className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700" role="alert">{actionError}</p>}
    </div>
  );
}
