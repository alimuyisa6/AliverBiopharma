import { forwardRef } from 'react';
import { UI } from '../../design-system';

const Textarea = forwardRef(function Textarea(
  { label, hint, error, className = '', id, ...props },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hintId = textareaId ? `${textareaId}-hint` : undefined;
  const errorId = textareaId ? `${textareaId}-error` : undefined;

  return (
    <div className={`${UI.field} ${className}`}>
      {label && (
        <label className={UI.fieldLabel} htmlFor={textareaId}>
          {label}
          {props.required && <span className="ml-1 text-red-700" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        {...props}
        ref={ref}
        id={textareaId}
        aria-invalid={error ? 'true' : props['aria-invalid']}
        aria-describedby={[error ? errorId : null, !error && hint ? hintId : null, props['aria-describedby']].filter(Boolean).join(' ') || undefined}
        className={`${UI.inputBase} min-h-32 resize-y leading-6 ${error ? UI.fieldBorderError : UI.fieldBorder} ${props.className || ''}`}
      />
      {error && <p id={errorId} className={UI.fieldError} role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className={UI.fieldHint}>{hint}</p>}
    </div>
  );
});

export default Textarea;
