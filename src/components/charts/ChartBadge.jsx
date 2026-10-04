import { ArrowDown, ArrowUp } from 'lucide-react';
import './charts.css';

export default function ChartBadge({
  value,
  tone = 'positive',
  showIcon = true
}) {
  const positive = tone === 'positive';

  return (
    <span className={`ch-badge ch-badge--${positive ? 'positive' : 'negative'}`}>
      {showIcon && (positive ? <ArrowUp aria-hidden="true" /> : <ArrowDown aria-hidden="true" />)}
      {value}
    </span>
  );
}