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
            <g
              className="newsletter-envelope__letter"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="10" y="4.5" width="14" height="17" rx="1.5" />
              <path d="M13 9h8M13 12.5h8M13 16h5" />
            </g>
            <path
              className="newsletter-envelope__body"
              d="M6.5 11.5h21a3 3 0 0 1 3 3v13a3 3 0 0 1-3 3h-21a3 3 0 0 1-3-3v-13a3 3 0 0 1 3-3Z"
              fill="var(--newsletter-icon-bg)"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              className="newsletter-envelope__flap"
              d="m4.5 13 12.5 9 12.5-9"
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
