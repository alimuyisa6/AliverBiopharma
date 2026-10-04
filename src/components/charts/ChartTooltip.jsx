import './charts.css';

export default function ChartTooltip({
  active,
  payload = [],
  label,
  formatter = (value) => value
}) {
  if (!active || !payload.length) return null;

  return (
    <div className="ch-tooltip">
      {label !== undefined && label !== null && (
        <p className="ch-tooltip-title">{label}</p>
      )}

      {payload.map((item, index) => {
        const rawValue = item?.value;
        const value = formatter(rawValue, item, index);

        return (
          <div className="ch-tooltip-row" key={item?.dataKey || item?.name || index}>
            <span
              className="ch-tooltip-dot"
              style={{ background: item?.color || 'var(--ch-2)' }}
              aria-hidden="true"
            />
            <span className="ch-tooltip-label">{item?.name || item?.dataKey || 'Value'}</span>
            <span className="ch-tooltip-value">{value}</span>
          </div>
        );
      })}
    </div>
  );
}