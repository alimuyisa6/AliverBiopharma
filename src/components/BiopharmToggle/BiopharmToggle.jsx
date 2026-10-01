import { useId } from 'react';

export default function BiopharmToggle({
  checked = false,
  onChange,
  leftLabel = 'Off',
  rightLabel = 'On',
  ariaLabel,
  className = ''
}) {
  const id = useId();

  return (
    <div className={`biopharm-toggle ${className}`.trim()}>
      <label className="biopharm-toggle__switch" htmlFor={id}>
        <span className="biopharm-toggle__sr-label">{ariaLabel || `${leftLabel} or ${rightLabel}`}</span>
        <input
          id={id}
          className="biopharm-toggle__input"
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange?.(event.target.checked)}
          aria-label={ariaLabel || `${leftLabel} or ${rightLabel}`}
        />
        <span className="biopharm-toggle__indicator biopharm-toggle__indicator--left" aria-hidden="true" />
        <span className="biopharm-toggle__indicator biopharm-toggle__indicator--right" aria-hidden="true" />
        <span className="biopharm-toggle__thumb" aria-hidden="true">
          <span />
          <span />
        </span>
      </label>
      <div className="biopharm-toggle__labels" aria-hidden="true">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
