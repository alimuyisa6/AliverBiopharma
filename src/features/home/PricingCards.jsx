import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-pricing.css';

function formatPrice(plan) {
  const amount = Number(plan.price_amount);
  if (!Number.isFinite(amount)) return 'Contact us';

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: String(plan.currency || 'USD').toUpperCase(),
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return `${plan.currency || ''} ${amount.toLocaleString()}`.trim();
  }
}

function planFeatures(features) {
  if (Array.isArray(features)) return features.filter(Boolean);
  if (features && typeof features === 'object') {
    return Object.entries(features).filter(([, enabled]) => enabled).map(([name]) => name.replaceAll('_', ' '));
  }
  return [];
}

export function PricingCards({ plans = [], user = null }) {
  const navigate = useNavigate();
  const availablePlans = Array.isArray(plans) ? plans.filter((plan) => plan?.id) : [];

  const choosePlan = (plan) => {
    navigate(`/profile?section=billing&plan_id=${encodeURIComponent(plan.id)}`, {
      state: { activeSection: 'billing' }
    });
  };

  return (
    <section className="section pricing-section" id="membership" aria-labelledby="pricing-title">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Membership</span>
          <h2 id="pricing-title">Choose your premium access</h2>
          <p>Unlock premium learning materials across your programme.</p>
        </div>
      </div>
      {availablePlans.length ? (
        <div className="pricing-grid">
          {availablePlans.map((plan) => (
            <article key={plan.id} className="pricing-card card card-surface-solid card-elevation-soft card-density-comfortable">
              <div className="pricing-card-heading">
                <h3>{plan.name}</h3>
                {plan.is_popular && <span className="pricing-card-badge">Popular</span>}
              </div>
              {plan.description && <p>{plan.description}</p>}
              <div className="price">
                {formatPrice(plan)}
                <span className="price-period"> / {Number(plan.duration_days) || 0} days</span>
              </div>
              <ul>
                {planFeatures(plan.features).map((feature, index) => (
                  <li key={`${plan.id}-feature-${index}`}><Icon name="check" />{String(feature)}</li>
                ))}
              </ul>
              <button type="button" className="btn btn-primary pricing-cta-btn" onClick={() => choosePlan(plan)}>
                Choose plan <Icon name="arrow-right" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <div className="pricing-empty card card-surface-solid">
          <h3>Premium plans are being prepared</h3>
          <p>Subscription options will appear here as soon as the plans are published.</p>
        </div>
      )}
    </section>
  );
}
