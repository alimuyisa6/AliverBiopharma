import Icon from '../Icon/Icon';
import { UI } from '../../design-system';

const BADGE_STYLES = {
  primary: 'bg-primary-50 text-primary-800 ring-1 ring-primary-100',
  secondary: 'bg-secondary-50 text-secondary-800 ring-1 ring-secondary-100',
  success: 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-100',
  warning: 'bg-amber-50 text-amber-900 ring-1 ring-amber-100',
  danger: 'bg-red-50 text-red-800 ring-1 ring-red-100',
  info: 'bg-sky-50 text-sky-800 ring-1 ring-sky-100',
  accent: 'bg-violet-50 text-violet-800 ring-1 ring-violet-100',
  outline: 'border border-slate-200 bg-white text-slate-700',
  neutral: 'bg-slate-100 text-slate-700'
};

export default function Badge({ children, variant = 'primary', icon, className = '' }) {
  return (
    <span className={`${UI.badgeBase} ${BADGE_STYLES[variant] || BADGE_STYLES.primary} ${className}`.trim()}>
      {icon && <Icon name={icon} className="h-3.5 w-3.5 shrink-0" />}
      {children}
    </span>
  );
}
