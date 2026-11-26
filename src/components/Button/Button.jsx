import { forwardRef } from 'react';
import Icon from '../Icon/Icon';
import Spinner from '../Spinner/Spinner';

const variantStyles = {
  primary: 'bg-primary-700 text-white shadow-sm hover:bg-primary-800',
  secondary: 'border border-slate-200 bg-white text-primary-800 shadow-sm hover:border-primary-300 hover:bg-primary-50',
  ghost: 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-primary-800',
  danger: 'bg-red-700 text-white shadow-sm hover:bg-red-800',
  outline: 'border border-primary-300 bg-white text-primary-800 hover:bg-primary-50',
  success: 'bg-emerald-700 text-white shadow-sm hover:bg-emerald-800',
  link: 'bg-transparent px-0 text-primary-700 underline underline-offset-4 hover:text-primary-900',
  warm: 'bg-secondary-600 text-white shadow-sm hover:bg-secondary-700',
  gradient: 'bg-primary-800 text-white shadow-sm hover:bg-primary-900',
  info: 'bg-sky-700 text-white shadow-sm hover:bg-sky-800',
  warning: 'bg-amber-500 text-amber-950 shadow-sm hover:bg-amber-600',
  dark: 'bg-slate-900 text-white shadow-sm hover:bg-slate-800',
  light: 'bg-slate-100 text-slate-800 hover:bg-slate-200',
  muted: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  '3d': 'relative isolate translate-y-0 bg-primary-700 text-white shadow-[0_5px_0_0_rgb(29_78_216)] transition-transform active:translate-y-1 active:shadow-none'
};

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size,
    icon,
    iconRight,
    loading = false,
    loadingContext = 'default',
    loadingLabel,
    status = null,
    radius,
    flat = false,
    className = '',
    type = 'button',
    disabled = false,
    ...props
  },
  ref
) {
  const classes = [
    'ab-btn inline-flex min-h-10 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold leading-5 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-not-allowed disabled:opacity-60',
    variantStyles[variant] || variantStyles.primary,
    size === 'sm' && 'min-h-8 px-3 py-1.5 text-xs',
    size === 'lg' && 'min-h-12 px-5 py-3 text-base',
    radius === 'square' && 'rounded-md',
    radius === 'sm' && 'rounded-lg',
    radius === 'pill' && 'rounded-full',
    radius === 'wavy' && 'rounded-[1.25rem_0.5rem_1.25rem_0.5rem]',
    flat && 'shadow-none',
    loading && 'cursor-wait',
    status === 'success' && 'border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100',
    status === 'error' && 'border border-red-300 bg-red-50 text-red-800 hover:bg-red-100',
    !children && icon && 'h-10 w-10 px-0',
    className
  ].filter(Boolean).join(' ');

  const safeIcon = icon === 'dna' ? 'microscope' : icon;
  const safeIconRight = iconRight === 'dna' ? 'microscope' : iconRight;

  if (variant === '3d') {
    return (
      <button
        ref={ref}
        type={type}
        className={classes}
        disabled={loading || disabled}
        aria-busy={loading || undefined}
        {...props}
      >
        <span className="relative z-10 inline-flex items-center justify-center gap-2">
          {loading && <Spinner size="sm" context={loadingContext} variant="3d" />}
          {status === 'success' && <Icon name="circle-check" />}
          {status === 'error' && <Icon name="circle-xmark" />}
          {safeIcon && !loading && !status && <Icon name={safeIcon} />}
          {children && <span>{loading && loadingLabel ? loadingLabel : children}</span>}
          {safeIconRight && !loading && <Icon name={safeIconRight} />}
        </span>
      </button>
    );
  }

  return (
    <button
      ref={ref}
      type={type}
      className={classes}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner size="sm" context={loadingContext} variant={variant} />}
      {status === 'success' && <Icon name="circle-check" />}
      {status === 'error' && <Icon name="circle-xmark" />}
      {safeIcon && !loading && !status && <Icon name={safeIcon} />}
      {children && <span>{loading && loadingLabel ? loadingLabel : children}</span>}
      {safeIconRight && !loading && <Icon name={safeIconRight} />}
    </button>
  );
});

export default Button;
