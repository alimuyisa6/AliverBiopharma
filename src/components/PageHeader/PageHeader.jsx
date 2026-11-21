import Icon from '../Icon/Icon';
import Badge from '../Badge/Badge';

export default function PageHeader({ title, subtitle, label, icon, badges = [] }) {
  return (
    <header className="mb-8 w-full min-w-0">
      {label && <span className="mb-3 inline-flex rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-800">{label}</span>}
      <h1 className="flex items-center gap-3 text-3xl font-extrabold leading-tight tracking-tight text-primary-950 sm:text-4xl lg:text-5xl">
        {icon && <Icon name={icon === 'dna' ? 'microscope' : icon} className="h-8 w-8 shrink-0 text-primary-700 sm:h-10 sm:w-10" />}
        <span>{title}</span>
      </h1>
      {subtitle && <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">{subtitle}</p>}
      {badges.length > 0 && <div className="mt-4 flex flex-wrap gap-2">{badges.map((badge) => (
        <Badge key={badge.label} variant={badge.variant} icon={badge.icon === 'dna' ? 'microscope' : badge.icon}>{badge.label}</Badge>
      ))}</div>}
    </header>
  );
}