import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, hint, error, options = [], placeholder, className = '', id, children, ...props },
  ref
) {
  const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hintId = selectId ? `${selectId}-hint` : undefined;
  const errorId = selectId ? `${selectId}-error` : undefined;

  return (
    <div className={`grid min-w-0 gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold leading-5 text-slate-700" htmlFor={selectId}>
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
          className={`min-h-12 w-full min-w-0 appearance-none rounded-xl border bg-white px-4 py-3 pr-11 text-base text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-base ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-100' : 'border-slate-200'} ${props.className || ''}`}
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
      {error && <p id={errorId} className="m-0 text-sm font-medium text-red-700" role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className="m-0 text-sm leading-5 text-slate-500">{hint}</p>}
    </div>
  );
});

export default Select;
