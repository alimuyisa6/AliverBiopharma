import { useId, useState } from 'react';
import Icon from '../Icon/Icon';

export default function ContentSwitcher({
  options = [],
  value,
  defaultValue,
  onChange,
  title,
  className = ''
}) {
  const id = useId();
  const [internalValue, setInternalValue] = useState(defaultValue ?? options[0]?.value);
  const activeValue = value ?? internalValue;

  const select = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  if (!options.length) return null;

  return (
    <section className={`w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${className}`.trim()} aria-label={title || 'Content categories'}>
      {title && <h2 className="mb-3 text-base font-bold leading-6 text-slate-900">{title}</h2>}
      <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4" role="group" aria-label={title || 'Choose a content view'} id={id}>
        {options.map((item) => {
          const active = item.value === activeValue;
          const icon = typeof item.icon === 'string'
            ? <Icon name={item.icon} monochrome />
            : item.icon;
          return (
            <button
              key={item.value}
              type="button"
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold leading-5 transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${active ? 'border-primary-300 bg-primary-50 text-primary-900 shadow-sm' : 'border-slate-200 bg-white text-slate-600 hover:border-primary-200 hover:bg-slate-50'}`}
              aria-pressed={active}
              onClick={() => select(item.value)}
            >
              {icon && <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">{icon}</span>}
              <span className="min-w-0 truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}