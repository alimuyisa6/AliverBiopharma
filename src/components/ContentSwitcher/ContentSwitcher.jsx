import { useId, useState } from 'react';
import Icon from '../Icon/Icon';
import { UI } from '../../design-system';

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
    <section className={`${UI.contentSwitcherShell} ${className}`.trim()} aria-label={title || 'Content categories'}>
      {title && <h2 className={UI.contentSwitcherTitle}>{title}</h2>}
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
              className={`${UI.contentSwitcherOption} ${active ? UI.contentSwitcherOptionActive : UI.contentSwitcherOptionInactive}`}
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