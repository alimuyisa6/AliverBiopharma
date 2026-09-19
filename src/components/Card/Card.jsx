 import { forwardRef } from 'react';
import Icon from '../Icon/Icon';
import Skeleton from '../Skeleton/Skeleton';

const Card = forwardRef(function Card(
  {
    image,
    icon,
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
  const isClickable = !!onClick && !loading;
  const Wrapper = isClickable ? 'button' : 'div';

  const safeIcon = icon === 'dna' ? 'microscope' : icon;

  let imageClassName = 'card-image';
  if (scoop) imageClassName += ` card-image-scoop-${scoop}`;
  if (imageVariant === 'original') imageClassName += ' card-image-original';

  let cardClass = 'card';
  if (variant) cardClass += ` card-${variant}`;
  if (isClickable) cardClass += ' card-clickable';
  if (className) cardClass += ` ${className}`;

  const hasMedia = !!(image || safeIcon);

  if (loading) {
    return (
      <div
        ref={ref}
        className={cardClass + ' card-loading'}
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="card-body">
          <Skeleton variant="text" lines={loadingLines} />
        </div>
      </div>
    );
  }

  return (
    <Wrapper
      ref={ref}
      className={cardClass}
      onClick={onClick}
      {...props}
    >
      {hasMedia && (
        image ? (
          <img src={image} alt={title || ''} className={imageClassName} loading="lazy" />
        ) : (
          <div className="card-image-placeholder">
            <Icon name={safeIcon} />
          </div>
        )
      )}

      <div className="card-body">
        {title && <h3 className="card-title">{title}</h3>}
        {description && <p className="card-text">{description}</p>}
        {children}
      </div>

      {footer && <div className="card-footer">{footer}</div>}
    </Wrapper>
  );
});

export default Card;
