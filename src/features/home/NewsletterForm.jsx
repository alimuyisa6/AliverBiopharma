import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

export function NewsletterForm({ email, status, loading = false, onChange, onSubmit }) {
  return (
    <section className="section newsletter-section">
      <div className="newsletter-card">
        <div className="newsletter-icon" aria-hidden="true">
          <svg
            className="newsletter-envelope"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 34 34"
            fill="none"
            focusable="false"
          >
            <path
              className="newsletter-envelope__letter"
              d="M11 15V5.5h12V15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              className="newsletter-envelope__body"
              x="3.5"
              y="10"
              width="27"
              height="20"
              rx="3"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              className="newsletter-envelope__flap"
              d="M4.5 12 17 21l12.5-9"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="newsletter-note">
          <h2 className="newsletter-title">Subscribe for updates</h2>
          <p className="newsletter-description">
            Get new learning resources, study updates and useful opportunities
            delivered straight to your inbox.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="newsletter-form-row"
          aria-label="Subscribe to newsletter"
        >
          <Input
            className="newsletter-input-group"
            type="email"
            placeholder="Enter your e-mail"
            value={email}
            onChange={onChange}
            required
            aria-label="Email address"
          />

          <Button
            className="newsletter-submit"
            type="submit"
            loading={loading}
            loadingContext="brand"
            loadingLabel="Subscribing…"
          >
            Subscribe
          </Button>
        </form>

        {status && (
          <p
            className={`form-status ${status.success ? 'success' : 'error'}`}
            role="status"
            aria-live="polite"
          >
            {status.message}
          </p>
        )}
      </div>
    </section>
  );
}
