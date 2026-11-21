import { forwardRef } from 'react';

const Textarea = forwardRef(function Textarea(
  { label, hint, error, className = '', id, ...props },
  ref
) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);
  const hintId = textareaId ? `${textareaId}-hint` : undefined;
  const errorId = textareaId ? `${textareaId}-error` : undefined;

  return (
    <div className={`grid min-w-0 gap-2 ${className}`}>
      {label && (
        <label className="text-sm font-semibold leading-5 text-slate-700" htmlFor={textareaId}>
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
        className={`min-h-32 w-full min-w-0 resize-y rounded-xl border bg-white px-4 py-3 text-base leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500 sm:text-base ${error ? 'border-red-300 focus:border-red-300 focus:ring-red-100' : 'border-slate-200'} ${props.className || ''}`}
      />
      {error && <p id={errorId} className="m-0 text-sm font-medium text-red-700" role="alert">{error}</p>}
      {!error && hint && <p id={hintId} className="m-0 text-sm leading-5 text-slate-500">{hint}</p>}
    </div>
  );
});

export default Textarea;
