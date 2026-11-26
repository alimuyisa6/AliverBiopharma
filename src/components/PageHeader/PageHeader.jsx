import Icon from '../Icon/Icon';
import Badge from '../Badge/Badge';
import { UI } from '../../design-system';

/**
 * Consistent page title block. The illustration region is opt-in: only pages
 * that pass an illustration render the reserved visual area beneath the title.
 */
export default function PageHeader({
  title,
  subtitle,
  label,
  icon,
  badges = [],
  illustration = null,
  illustrationClassName = '',
}) {
  return (
    <header className={UI.pageTitle}>
      {label && <span className={UI.pageTitleLabel}>{label}</span>}
      <h1 className={UI.pageTitleHeading}>
        {icon && <Icon name={icon === 'dna' ? 'microscope' : icon} className="h-8 w-8 shrink-0 text-primary-700 sm:h-10 sm:w-10" />}
        <span>{title}</span>
      </h1>
      {subtitle && <p className={UI.pageTitleDescription}>{subtitle}</p>}
      {badges.length > 0 && (
        <div className={UI.pageTitleMeta}>
          {badges.map((badge) => (
            <Badge key={badge.label} variant={badge.variant} icon={badge.icon === 'dna' ? 'microscope' : badge.icon}>
              {badge.label}
            </Badge>
          ))}
        </div>
      )}
      {illustration && (
        <div className={`${UI.pageTitleIllustration} ${illustrationClassName}`.trim()} aria-hidden="true">
          {illustration}
        </div>
      )}
    </header>
  );
}
