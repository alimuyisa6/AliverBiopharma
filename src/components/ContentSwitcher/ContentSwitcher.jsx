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
    <section className={`content-switcher-card ${className}`.trim()} aria-label={title || 'Content categories'}>
      {title && <h2 className="content-switcher-card__title">{title}</h2>}
      <div className="content-switcher" role="group" aria-label={title || 'Choose a content view'} id={id}>
        {options.map((item) => {
          const active = item.value === activeValue;
          const icon = typeof item.icon === 'string'
            ? <Icon name={item.icon} monochrome />
            : item.icon;
          return (
            <button
              key={item.value}
              type="button"
              className={`content-switcher__option${active ? ' is-active' : ''}`}
              aria-pressed={active}
              onClick={() => select(item.value)}
            >
              {icon && <span className="content-switcher__icon" aria-hidden="true">{icon}</span>}
              <span className="content-switcher__label">{item.label}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
