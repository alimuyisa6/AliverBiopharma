import { useId } from 'react';

export default function BiopharmToggle({
  checked = false,
  onChange,
  ariaLabel,
  className = ''
}) {
  const id = useId();

  return (
    <label className={`biopharm-toggle__switch ${className}`.trim()} htmlFor={id}>
      <input
        id={id}
        className="biopharm-toggle__input"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-label={ariaLabel || 'Toggle theme'}
      />
      <span className="biopharm-toggle__track" aria-hidden="true">
        <span className="biopharm-toggle__sun">☼</span>
        <span className="biopharm-toggle__moon">☾</span>
        <span className="biopharm-toggle__thumb" />
      </span>
    </label>
  );
}
