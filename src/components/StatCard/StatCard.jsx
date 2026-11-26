import Icon from '../Icon/Icon';
import { UI } from '../../design-system';

export default function StatCard({ icon, value, label, color }) {
  return (
    <div className={UI.statCard}>
      {icon && <span className={UI.statCardIcon}><Icon name={icon === 'dna' ? 'microscope' : icon} className="h-6 w-6" style={color ? { color: `var(--${color})` } : undefined} /></span>}
      <div className={UI.statCardValue}>{value}</div>
      <div className={UI.statCardLabel}>{label}</div>
    </div>
  );
}