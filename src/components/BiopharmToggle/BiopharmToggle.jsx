import { useId } from 'react';

export default function BiopharmToggle({
  checked = false,
  onChange,
  ariaLabel,
  className = ''
}) {
  const id = useId();

  return (
    <label className={`group relative inline-flex cursor-pointer items-center text-primary-700 transition hover:text-primary-900 ${className}`.trim()} htmlFor={id}>
      <input
        id={id}
        className="peer sr-only"
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange?.(event.target.checked)}
        aria-label={ariaLabel || 'Toggle theme'}
      />
      <svg
        className="h-8 w-auto max-w-full transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-primary-600 peer-checked:text-secondary-600"
        viewBox="0 0 212.4992 84.4688"
        overflow="visible"
        aria-hidden="true"
        focusable="false"
      >
        <path
          pathLength="360"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          d="M 42.2496 0 A 42.24 42.24 90 0 0 0 42.2496 A 42.24 42.24 90 0 0 42.2496 84.4688 A 42.24 42.24 90 0 0 84.4992 42.2496 A 42.24 42.24 90 0 0 42.2496 0 A 42.24 42.24 90 0 0 0 42.2496 A 42.24 42.24 90 0 0 42.2496 84.4688 L 170.2496 84.4688 A 42.24 42.24 90 0 0 212.4992 42.2496 A 42.24 42.24 90 0 0 170.2496 0 A 42.24 42.24 90 0 0 128 42.2496 A 42.24 42.24 90 0 0 170.2496 84.4688 A 42.24 42.24 90 0 0 212.4992 42.2496 A 42.24 42.24 90 0 0 170.2496 0 L 42.2496 0"
        />
      </svg>
    </label>
  );
}