import { Icon } from '../../design-system.jsx';

export default function ChartBadge({
  value,
  tone = 'positive',
  showIcon = true
}) {
  const positive = tone === 'positive';

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
      {showIcon && (positive ? <Icon name="arrowUp" size={14} aria-hidden="true" /> : <Icon name="arrowDown" size={14} aria-hidden="true" />)}
      {value}
    </span>
  );
}