import './PremiumAccessButton.css';

export default function PremiumAccessButton({ loading = false, onClick, children = 'Premium download', disabled = false }) {
  return (
    <button
      type="button"
      className="premium-access-button"
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className="premium-access-button-lock" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path className="premium-lock-shackle" d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" />
          <rect x="5" y="10" width="14" height="11" rx="2.2" />
          <path className="premium-lock-keyhole" d="M12 14.2v2.8" />
        </svg>
      </span>
      <span>{loading ? 'Checking access…' : children}</span>
    </button>
  );
}
