import Icon from '../Icon/Icon';

export default function AnimatedActionButton({
  primaryText = 'Join Today',
  secondaryText = 'Join Now',
  onClick,
  type = 'button',
  className = '',
  disabled = false
}) {
  return (
    <button
      type={type}
      className={`group inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={secondaryText || primaryText}
    >
      <span>{primaryText}</span>
      <Icon name="arrow-right" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </button>
  );
}