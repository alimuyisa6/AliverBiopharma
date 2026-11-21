import { ChevronDown } from 'lucide-react';

export default function ChartSelect({
  value,
  onChange,
  options = [],
  ariaLabel = 'Select chart range',
  icon = null
}) {
  return (
    <label className="relative inline-flex min-w-0 items-center">
      {icon && <span className="pointer-events-none absolute right-3 inline-flex h-4 w-4 items-center justify-center text-slate-500" aria-hidden="true">{icon}</span>}
      <select value={value} onChange={(event) => onChange(event.target.value)} aria-label={ariaLabel} className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-base text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
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
      <span className="pointer-events-none absolute right-3 inline-flex h-4 w-4 items-center justify-center text-slate-500" aria-hidden="true">
        <ChevronDown />
      </span>
    </label>
  );
}