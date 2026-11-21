
export default function ChartSegmentedControl({
  value,
  onChange,
  options = ['7D', '30D'],
  ariaLabel = 'Chart range'
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label={ariaLabel}>
      {options.map((option) => {
        const item = typeof option === 'string'
          ? { value: option, label: option }
          : option;

        const active = value === item.value;

        return (
          <button
            key={item.value}
            type="button"
            className={`inline-flex min-h-8 items-center justify-center rounded-lg px-3 py-1.5 text-xs font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${active ? 'bg-white text-primary-800 shadow-sm' : 'text-slate-500 hover:bg-white/70 hover:text-slate-800'}`}
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