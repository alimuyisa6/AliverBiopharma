import Button from '../Button/Button';

export default function ThreeDButton({
  variant = 'solid',
  size = 'md',
  className = '',
  ...props
}) {
  const toneClass = {
    solid: 'border-primary-700 bg-primary-700 text-white hover:bg-primary-800',
    soft: 'border-primary-200 bg-primary-50 text-primary-900 hover:bg-primary-100',
    muted: 'border-slate-200 bg-slate-100 text-slate-800 hover:bg-slate-200'
  }[variant] || 'border-primary-700 bg-primary-700 text-white hover:bg-primary-800';
  const sizeClass = size === 'sm' ? 'min-h-9 px-3 py-2 text-xs' : size === 'lg' ? 'min-h-12 px-5 py-3 text-base' : 'min-h-10 px-4 py-2 text-sm';

  return (
    <Button
      {...props}
      variant="3d"
      className={`border shadow-[0_4px_0_0_rgb(29_78_216)] active:translate-y-1 active:shadow-none ${toneClass} ${sizeClass} ${className}`.trim()}
    />
  );
}
