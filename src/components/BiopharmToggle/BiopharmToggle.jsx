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
      <svg viewBox="0 0 212.4992 84.4688" overflow="visible" aria-hidden="true" focusable="false">
        <path
          pathLength="360"
          fill="none"
          stroke="currentColor"
          d="M 42.2496 0 A 42.24 42.24 90 0 0 0 42.2496 A 42.24 42.24 90 0 0 42.2496 84.4688 A 42.24 42.24 90 0 0 84.4992 42.2496 A 42.24 42.24 90 0 0 42.2496 0 A 42.24 42.24 90 0 0 0 42.2496 A 42.24 42.24 90 0 0 42.2496 84.4688 L 170.2496 84.4688 A 42.24 42.24 90 0 0 212.4992 42.2496 A 42.24 42.24 90 0 0 170.2496 0 A 42.24 42.24 90 0 0 128 42.2496 A 42.24 42.24 90 0 0 170.2496 84.4688 A 42.24 42.24 90 0 0 212.4992 42.2496 A 42.24 42.24 90 0 0 170.2496 0 L 42.2496 0"
        />
      </svg>
    </label>
  );
}
