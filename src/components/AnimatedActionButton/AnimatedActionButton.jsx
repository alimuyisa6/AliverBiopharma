export default function AnimatedActionButton({
  primaryText = 'Join Today',
  secondaryText = 'Join Now',
  onClick,
  type = 'button',
  className = '',
  disabled = false
}) {
  const first = Array.from(primaryText);
  const second = Array.from(secondaryText);

  return (
    <button
      type={type}
      className={`animated-action-button ${className}`.trim()}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="animated-action-button__bg" aria-hidden="true" />
      <span className="animated-action-button__splash" aria-hidden="true" />
      <span className="animated-action-button__wrap">
        <span className="animated-action-button__path" aria-hidden="true" />
        <span className="animated-action-button__outline" aria-hidden="true" />
        <span className="animated-action-button__content">
          <span className="animated-action-button__words animated-action-button__words--primary" aria-hidden="true">
            {first.map((char, index) => <span key={`a-${index}`} style={{ '--char-index': index }}>{char === ' ' ? '\u00a0' : char}</span>)}
          </span>
          <span className="animated-action-button__words animated-action-button__words--secondary" aria-hidden="true">
            {second.map((char, index) => <span key={`b-${index}`} style={{ '--char-index': index }}>{char === ' ' ? '\u00a0' : char}</span>)}
          </span>
          <span className="animated-action-button__icon" aria-hidden="true"><span /></span>
          <span className="animated-action-button__label">{primaryText}</span>
        </span>
      </span>
    </button>
  );
}
