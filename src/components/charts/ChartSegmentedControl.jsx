import './charts.css';

export default function ChartSegmentedControl({
  value,
  onChange,
  options = ['7D', '30D'],
  ariaLabel = 'Chart range'
}) {
  return (
    <div className="ch-segmented" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const item = typeof option === 'string'
          ? { value: option, label: option }
          : option;

        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            className={`ch-segment${active ? ' is-active' : ''}`}
            aria-pressed={active}
            onClick={() => onChange(item.value)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}