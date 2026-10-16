import { createElement } from 'react';
import { cn } from './empty-utils';

export function Empty({ className = '', ...props }) {
  return <div data-slot="empty" className={cn('ab-empty', className)} {...props} />;
}

export function EmptyHeader({ className = '', ...props }) {
  return <div data-slot="empty-header" className={cn('ab-empty-header', className)} {...props} />;
}

export function EmptyMedia({ className = '', variant = 'default', children, ...props }) {
  return (
    <div data-slot="empty-media" data-variant={variant} className={cn('ab-empty-media', `ab-empty-media--${variant}`, className)} {...props}>
      {children}
    </div>
  );
}

export function EmptyTitle({ className = '', ...props }) {
  return <h2 data-slot="empty-title" className={cn('ab-empty-title', className)} {...props} />;
}

export function EmptyDescription({ className = '', ...props }) {
  return <p data-slot="empty-description" className={cn('ab-empty-description', className)} {...props} />;
}

export function EmptyContent({ className = '', ...props }) {
  return <div data-slot="empty-content" className={cn('ab-empty-content', className)} {...props} />;
}
