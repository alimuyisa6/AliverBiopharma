import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import { motion } from 'framer-motion';

export function NewsletterForm({ email, status, loading = false, onChange, onSubmit }) {
  return (
    <section className="section newsletter-section">
      <div className="newsletter-card">
        <div className="newsletter-icon" aria-hidden="true">
          <motion.svg
            className="newsletter-envelope"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            fill="none"
            focusable="false"
            animate={{ y: [0, -2, 0], rotate: [0, -1.5, 0, 1, 0] }}
            transition={{ duration: 3.4, ease: "easeInOut", repeat: Infinity }}
          >
            <defs>
              <linearGradient id="newsletter-envelope-paper" x1="14" y1="7" x2="34" y2="34" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="var(--surface-card)" />
                <stop offset="100%" stopColor="var(--newsletter-icon-bg)" />
              </linearGradient>
            </defs>
            <path
              className="newsletter-envelope__back"
              d="M5 17.5 24 29 43 17.5V38a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V17.5Z"
              fill="var(--newsletter-icon-bg)"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <motion.path
              className="newsletter-envelope__flap"
              d="M5 18 24 5 43 18Z"
              fill="var(--newsletter-icon-bg)"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
              animate={{ rotate: [0, 180, 180, 0] }}
              transition={{ duration: 3.4, times: [0, 0.2, 0.62, 1], ease: "easeInOut", repeat: Infinity }}
              style={{ transformOrigin: "24px 18px" }}
            />
            <motion.g
              className="newsletter-envelope__letter"
              animate={{ y: [0, -8, -8, 0] }}
              transition={{ duration: 3.4, times: [0, 0.36, 0.62, 1], ease: "easeInOut", repeat: Infinity }}
            >
              <rect x="13.5" y="6.5" width="21" height="29" rx="3" fill="url(#newsletter-envelope-paper)" stroke="currentColor" strokeWidth="1.7" />
              <path d="M18 14h12M18 18.5h12M18 23h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".72" />
              <path d="m18 28 3 3 7-7" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </motion.g>
            <path
              className="newsletter-envelope__front"
              d="M5 18 24 31.5 43 18V38a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V18Z"
              fill="var(--newsletter-icon-bg)"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinejoin="round"
            />
            <path
              className="newsletter-envelope__seal"
              d="m20.5 22.5 3.5 3 3.5-3"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
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
