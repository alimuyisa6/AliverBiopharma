import { useId, useState } from 'react';

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
  const activeIndex = Math.max(0, options.findIndex((item) => item.value === activeValue));
  const count = Math.max(options.length, 1);

  const select = (nextValue) => {
    if (value === undefined) setInternalValue(nextValue);
    onChange?.(nextValue);
  };

  if (!options.length) return null;

  return (
    <div className={`content-switcher-card ${className}`.trim()}>
      {title && <div className="content-switcher-card__title">{title}</div>}
      <div className="content-switcher" role="tablist" aria-label={title || 'Content categories'}>
        <div
          className="content-switcher__slider"
          style={{
            width: `calc((100% - ${(count - 1) * 8}px) / ${count})`,
            transform: `translateX(${activeIndex * 100 + activeIndex * 8 / count * 100 / 100}%)`
          }}
          aria-hidden="true"
        />
        {options.map((item) => {
          const optionId = `${id}-${item.value}`;
          const active = item.value === activeValue;
          return (
            <button
              key={item.value}
              id={optionId}
              type="button"
              className={`content-switcher__option${active ? ' is-active' : ''}`}
              role="tab"
              aria-selected={active}
              onClick={() => select(item.value)}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
