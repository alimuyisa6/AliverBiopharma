import { createElement } from 'react';
import { cn } from './empty-utils';

export function Empty({ className = '', ...props }) {
  return <div data-slot="empty" className={cn('mx-auto flex w-full max-w-xl flex-col items-center justify-center gap-5 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center', className)} {...props} />;
}

export function EmptyHeader({ className = '', ...props }) {
  return <div data-slot="empty-header" className={cn('flex flex-col items-center gap-3', className)} {...props} />;
}

export function EmptyMedia({ className = '', variant = 'default', children, ...props }) {
  const mediaStyle = variant === 'icon' ? 'inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700' : 'max-w-full';
  return <div data-slot="empty-media" data-variant={variant} className={cn(mediaStyle, className)} {...props}>{children}</div>;
}

export function EmptyTitle({ className = '', ...props }) {
  return <h2 data-slot="empty-title" className={cn('text-lg font-bold leading-7 text-slate-900', className)} {...props} />;
}

export function EmptyDescription({ className = '', ...props }) {
  return <p data-slot="empty-description" className={cn('max-w-md text-sm leading-6 text-slate-600', className)} {...props} />;
}

export function EmptyContent({ className = '', ...props }) {
  return <div data-slot="empty-content" className={cn('flex flex-wrap items-center justify-center gap-3', className)} {...props} />;
}
