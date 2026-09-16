 /* features/home/NewsletterForm.jsx */

import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';

export function NewsletterForm({ email, status, onChange, onSubmit }) {
  return (
    <section className="section newsletter-section">
      <div className="section-head">
        <div className="section-head-left newsletter-copy">
          <span className="eyebrow newsletter-eyebrow">
            Stay informed
          </span>

          <h2 className="font-maven newsletter-title">
            Keep learning with AliverBiopharm
          </h2>

          <p className="newsletter-description">
            Get new learning resources, study updates and useful opportunities
            delivered to your inbox as they become available.
          </p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="newsletter-form-row"
      >
        <Input
          type="email"
          placeholder="Enter your email address"
          value={email}
          onChange={onChange}
          required
          aria-label="Email address"
        />

        <Button
          type="submit"
          icon="paper-plane"
        >
          Subscribe
        </Button>
      </form>

      {status && (
        <p
          className={`form-status ${
            status.success ? 'success' : 'error'
          }`}
          role="status"
          aria-live="polite"
        >
          {status.message}
        </p>
      )}
    </section>
  );
}
