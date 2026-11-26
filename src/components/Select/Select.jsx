import { forwardRef } from 'react';
import { UI } from '../../design-system';

const Select = forwardRef(function Select(
  { label, hint, error, options = [], placeholder, className = '', id, children, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hintId = selectId ? `${selectId}-hint` : undefined;
  const errorId = selectId ? `${selectId}-error` : undefined;

  return (
    <div className={`${UI.field} ${className}`}>
      {label && (
        <label className={UI.fieldLabel} htmlFor={selectId}>
          {label}
          {props.required && <span className="ml-1 text-red-700" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative min-w-0">
        <select
          {...props}
          ref={ref}
          id={selectId}
          aria-invalid={error ? 'true' : props['aria-invalid']}
          aria-describedby={[error ? errorId : null, !error && hint ? hintId : null, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
          className={`${UI.selectBase} ${error ? UI.fieldBorderError : UI.fieldBorder} ${props.className || ''}`}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {children || options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-500">
          <span className="h-2 w-2 rotate-45 border-b-2 border-r-2 border-current" />
        </span>
      </div>
      {error && <p id={errorId} className={UI.fieldError} role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className={UI.fieldHint}>{hint}</p>}
    </div>
  );
});

export default Select;
