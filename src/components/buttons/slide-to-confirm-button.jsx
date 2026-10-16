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
    const measure = () => setTrackWidth(element.getBoundingClientRect().width);
    measure();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
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
    <div className={`slide-confirm-wrap ${className}`.trim()} {...props}>
      <div
        ref={trackRef}
        className={`slide-confirm slide-confirm--${variant}${isDisabled ? ' is-disabled' : ''}${loading ? ' is-loading' : ''}${confirmed ? ' is-confirmed' : ''}`}
        role="group"
        aria-label={label}
        aria-describedby={actionError ? undefined : 'slide-confirm-hint'}
      >
        <span className="slide-confirm-label" aria-live="polite">
          {confirmed ? confirmLabel : loading ? 'Processing…' : label}
        </span>
        <span className="slide-confirm-hint" id="slide-confirm-hint" aria-hidden="true">
          {confirmed ? 'Complete' : hint}
        </span>
        <button
          ref={knobRef}
          type="button"
          className="slide-confirm-knob"
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
          style={{ transform: `translateX(${offset}px)`, '--slide-confirm-progress': maxOffset ? (offset / maxOffset) * 100 : 0 }}
        >
          {loading ? (
            <span className="slide-confirm-spinner" aria-hidden="true" />
          ) : confirmed ? (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m5 12 4.5 4.5L19 7" /></svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h13m-5-5 5 5-5 5" /></svg>
          )}
        </button>
      </div>
      {actionError && <p className="slide-confirm-error" role="alert">{actionError}</p>}
    </div>
  );
}
