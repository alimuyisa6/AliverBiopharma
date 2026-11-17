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
  let imageClassName = 'card-img-top';
  if (scoop) imageClassName += ` card-image-scoop-${scoop}`;
  if (imageVariant === 'original') imageClassName += ' card-image-original';

  let cardClass = 'card';
  if (variant) cardClass += ` card-${variant}`;
  if (className) cardClass += ` ${className}`;

  if (loading) {
    return (
      <div
        ref={ref}
        className={`${cardClass} card-loading`}
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
    <div ref={ref} className={cardClass} onClick={onClick} {...props}>
      {media && <div className="position-relative">{media}</div>}

      {image && (
        <img src={image} alt={title || ''} className={imageClassName} loading="lazy" />
      )}

      {(title || description) && (
        <div className="card-body">
          {title && <h5 className="card-title">{title}</h5>}
          {description && <p className="card-text text-muted">{description}</p>}
        </div>
      )}

      {children}

      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
});

export default Card;
 
