import { ChevronDown } from 'lucide-react';
import './charts.css';

export default function ChartSelect({
  value,
  onChange,
  options = [],
  ariaLabel = 'Select chart range',
  icon = null
}) {
  return (
    <label className="ch-control">
      {icon && <span className="ch-control-icon" aria-hidden="true">{icon}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel}>
        {options.map((option) => {
          const item = typeof option === 'string'
            ? { value: option, label: option }
            : option;

          return (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          );
        })}
      </select>
      <span className="ch-control-icon" aria-hidden="true">
        <ChevronDown />
      </span>
    </label>
  );
}