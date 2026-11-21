
export default function ChartTooltip({
  active,
  payload = [],
  label,
  formatter = (value) => value
}) {
  if (!active || !payload.length) return null;

  return (
    <div className="min-w-[10rem] rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      {label !== undefined && label !== null && (
        <p className="mb-2 border-b border-slate-100 pb-2 text-xs font-bold text-slate-800">{label}</p>
      )}

      {payload.map((item, index) => {
        const rawValue = item?.value;
        const value = formatter(rawValue, item, index);

        return (
          <div className="flex items-center gap-2 py-1.5 text-xs" key={item?.dataKey || item?.name || index}>
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ background: item?.color || 'var(--ch-2)' }}
              aria-hidden="true"
            />
            <span className="min-w-0 flex-1 text-slate-600">{item?.name || item?.dataKey || 'Value'}</span>
            <span className="font-bold tabular-nums text-slate-900">{value}</span>
          </div>
        );
      })}
    </div>
  );
}