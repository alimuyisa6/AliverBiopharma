import { ChevronDown } from 'lucide-react';

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
      <select value={value} onChange={(event) = className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"> onChange(event.target.value)} aria-label={ariaLabel}>
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