import { forwardRef, useState } from 'react';
import Icon from '../Icon/Icon';

const Input = forwardRef(function Input(
  { label, hint, error, icon, type = 'text', className = '', id, ...props },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hintId = inputId ? `${inputId}-hint` : undefined;
  const errorId = inputId ? `${inputId}-error` : undefined;
  const safeIcon = icon === 'dna' ? 'microscope' : icon;

  return (
    <div className={`grid min-w-0 gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold leading-5 text-slate-700" htmlFor={inputId}>
          {label}
          {props.required && <span className="ml-1 text-red-700" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative flex min-w-0 items-center">
        {safeIcon && (
          <span className="pointer-events-none absolute left-3 inline-flex h-5 w-5 items-center justify-center text-slate-500">
            <Icon name={safeIcon} className="h-5 w-5" />
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : props['aria-invalid']}
          aria-describedby={[error ? errorId : null, !error && hint ? hintId : null, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
          className={`min-h-12 w-full min-w-0 rounded-xl border bg-white px-4 py-3 text-base text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-base ${safeIcon ? 'pl-11' : ''} ${isPassword ? 'pr-12' : ''} ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-100' : 'border-slate-200'} ${props.className || ''}`}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute right-2 inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            aria-pressed={showPassword}
          >
            <Icon name={showPassword ? 'eye-slash' : 'eye'} className="h-5 w-5" />
          </button>
        )}
      </div>
      {error && <p id={errorId} className="m-0 text-sm font-medium text-red-700" role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className="m-0 text-sm leading-5 text-slate-500">{hint}</p>}
    </div>
  );
});

export default Input;
