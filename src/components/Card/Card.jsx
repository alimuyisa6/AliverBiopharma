import { forwardRef } from 'react';
import Skeleton from '../Skeleton/Skeleton';

const Card = forwardRef(function Card(
  {
    image,
    icon,
    media,
    title,
    description,
    footer,
    className = '',
    scoop = null,
    variant = '',
    imageVariant = null,
    children,
    loading = false,
    loadingLines = 3,
    onClick,
    ...props
  },
  ref
) {
  const cardClass = [
    'relative min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7',
    variant === 'interactive' ? 'transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md' : variant === 'primary' ? 'border-primary-100' : variant === 'secondary' ? 'border-secondary-100' : variant === 'success' ? 'border-emerald-100' : variant === 'warning' ? 'border-amber-200' : variant === 'danger' ? 'border-red-200' : '',
    onClick ? 'cursor-pointer focus-within:ring-2 focus-within:ring-primary-200' : '',
    className
  ].filter(Boolean).join(' ');
  const imageClassName = [
    'block w-full object-cover',
    scoop ? 'aspect-[16/9] rounded-t-2xl' : '',
    imageVariant === 'original' ? 'h-auto max-h-none object-contain' : 'max-h-72'
  ].filter(Boolean).join(' ');

  if (loading) {
    return (
      <div ref={ref} className={`${cardClass} p-5 sm:p-6`} aria-busy="true" aria-label="Loading">
        <Skeleton variant="text" lines={loadingLines} />
      </div>
    );
  }

  return (
    <div ref={ref} className={cardClass} onClick={onClick} {...props}>
      {media && <div className="relative">{media}</div>}
      {image && <img src={image} alt={title || ''} className={imageClassName} loading="lazy" />}
      {(title || description) && (
        <div className="space-y-2 p-5 sm:p-6">
          {title && <h3 className="text-lg font-bold leading-7 text-slate-900">{title}</h3>}
          {description && <p className="text-sm leading-6 text-slate-600">{description}</p>}
        </div>
      )}
      {children}
      {footer && <div className="border-t border-slate-100 px-5 py-4 sm:px-6">{footer}</div>}
    </div>
  );
});

export default Card;