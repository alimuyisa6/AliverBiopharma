import { Link } from 'react-router-dom';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';

export default function SplitCard({
  image,
  fallbackImage,
  title,
  subtitle,
  badge,
  badgeVariant = 'primary',
  link,
  buttonText = 'View',
  onButtonClick,
  className = ''
}) {
  const badgeStyle = {
    primary: 'bg-primary-700 text-white',
    secondary: 'bg-secondary-600 text-white',
    success: 'bg-emerald-700 text-white',
    warning: 'bg-amber-100 text-amber-900',
    danger: 'bg-red-700 text-white'
  }[badgeVariant] || 'bg-slate-800 text-white';

  return (
    <article className={`flex min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-primary-200 hover:shadow-md ${className}`}>
      <Link to={link} className="relative block aspect-[16/9] overflow-hidden bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600">
        <img src={image || fallbackImage} alt={title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]" />
        {badge && <span className={`absolute left-3 top-3 inline-flex rounded-full px-3 py-1 text-xs font-bold ${badgeStyle}`}>{badge}</span>}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col gap-4 p-4 sm:p-5">
        <div className="min-w-0">
          <h3 className="text-lg font-bold leading-7 text-slate-900">{title}</h3>
          {subtitle && <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>}
        </div>
        {onButtonClick ? (
          <Button size="sm" variant="primary" onClick={onButtonClick} className="mt-auto self-start">
            {buttonText} <Icon name="arrow-right" />
          </Button>
        ) : (
          <Link to={link} className="mt-auto inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg bg-primary-700 px-3 py-2 text-xs font-bold text-white transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
            {buttonText} <Icon name="arrow-right" />
          </Link>
        )}
      </div>
    </article>
  );
}