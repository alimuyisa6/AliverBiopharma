import Button from '../../components/Button/Button';
import Input from '../../components/Input/Input';
import './lernwick-newsletter.css';

export function NewsletterForm({ email, status, loading = false, onChange, onSubmit }) {
  return (
    <section className="section lernwick-newsletter" aria-labelledby="lernwick-newsletter-title">
      <div className="container">
        <div className="lernwick-newsletter-card">
          <div className="lernwick-newsletter-copy">
            <p className="lernwick-note">Stay connected</p>
            <h2 id="lernwick-newsletter-title">Keep growing your knowledge.</h2>
            <p>Receive updates about new Biology and Pharmacy learning resources, study tools and platform opportunities.</p>
          </div>
          <form onSubmit={onSubmit} className="lernwick-newsletter-form" aria-label="Subscribe to AliverBiopharm updates">
            <label htmlFor="lernwick-newsletter-email">Get learning updates in your inbox</label>
            <div className="lernwick-newsletter-row">
              <Input
                id="lernwick-newsletter-email"
                className="lernwick-newsletter-input"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={onChange}
                required
                aria-label="Email address"
              />
              <Button
                className="lernwick-newsletter-submit"
                type="submit"
                loading={loading}
                loadingContext="brand"
                loadingLabel="Subscribing…"
              >
                Subscribe
              </Button>
            </div>
            {status && <p className={`lernwick-newsletter-status ${status.success ? 'success' : 'error'}`} role="status" aria-live="polite">{status.message}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}
