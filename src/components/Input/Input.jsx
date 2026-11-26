import { forwardRef, useState } from 'react';
import Icon from '../Icon/Icon';
import { UI } from '../../design-system';

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
    <div className={`${UI.field} ${className}`}>
      {label && (
        <label className={UI.fieldLabel} htmlFor={inputId}>
          {label}
          {props.required && <span className="ml-1 text-red-700" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="relative flex min-w-0 items-center">
        {safeIcon && (
          <span className="pointer-events-none absolute left-3 inline-flex h-5 w-5 items-center justify-center text-slate-500">
            <Icon name={safeIcon} size={20} strokeWidth={2} className="h-5 w-5" />
          </span>
        )}
        <input
          {...props}
          ref={ref}
          id={inputId}
          type={inputType}
          aria-invalid={error ? 'true' : props['aria-invalid']}
          aria-describedby={[error ? errorId : null, !error && hint ? hintId : null, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
          className={`${UI.inputBase} ${safeIcon ? 'pl-11' : ''} ${isPassword ? 'pr-12' : ''} ${error ? UI.fieldBorderError : UI.fieldBorder} ${props.className || ''}`}
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
      {error && <p id={errorId} className={UI.fieldError} role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className={UI.fieldHint}>{hint}</p>}
    </div>
  );
});

export default Input;
