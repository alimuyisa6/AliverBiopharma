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
      className={`btn btn-primary animated-action-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
      aria-label={secondaryText || primaryText}
    >
      <span>{primaryText}</span>
      <Icon name="arrow-right" />
    </button>
  );
}
