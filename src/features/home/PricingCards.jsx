import { useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';

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
  const planBadges = {
    'monthly-access': 'Flexible access',
    'quarterly-access': 'Best balance',
    'annual-access': 'Best value'
  };

  const choosePlan = (plan) => {
    const search = `?section=billing&plan_id=${encodeURIComponent(plan.id)}`;
    if (user) {
      navigate(`/profile${search}`, { state: { activeSection: 'billing' } });
      return;
    }
    navigate('/login', { state: { from: { pathname: '/profile', search } } });
  };

  return (
    <section className="w-full bg-secondary-50 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" id="membership" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9 max-w-3xl">
          <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-700">Membership</p>
          <h2 id="pricing-title" className="text-3xl font-bold text-primary-900 sm:text-4xl">Choose your premium access</h2>
          <p className="mt-4 text-base leading-7 text-slate-600">Unlock premium learning materials across your programme. Pay securely in USDT on the TRON network.</p>
        </header>
        {availablePlans.length ? (
          <div className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2 xl:grid-cols-3">
            {availablePlans.map((plan) => (
              <article key={plan.id} className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-xl hover:shadow-primary-900/10 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <h3 className="m-0 text-xl font-bold text-primary-900">{plan.name}</h3>
                  {planBadges[plan.slug] && <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-bold text-secondary-800">{planBadges[plan.slug]}</span>}
                </div>
                {plan.description && <p className="mt-3 text-sm leading-6 text-slate-600">{plan.description}</p>}
                <div className="mt-6 border-b border-slate-100 pb-6">
                  <strong className="text-3xl font-extrabold tracking-tight text-primary-900">{formatPrice(plan)}</strong>
                  <span className="ml-2 text-sm text-slate-500">/ {Number(plan.duration_days) || 0} days</span>
                  {plan.slug === 'annual-access' && <p className="mt-2 text-xs font-semibold text-secondary-700">Just ${(Number(plan.price_amount) / 12).toFixed(2)} per month, billed annually.</p>}
                </div>
                <ul className="my-6 flex-1 space-y-3 p-0">
                  {planFeatures(plan.features).map((feature, index) => (
                    <li key={`${plan.id}-feature-${index}`} className="flex items-start gap-3 text-sm leading-6 text-slate-700">
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700"><Icon name="check" /></span>
                      <span>{String(feature)}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500" onClick={() => choosePlan(plan)}>
                  Continue with USDT <Icon name="arrow-right" />
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-secondary-200 bg-white p-7 shadow-sm">
            <h3 className="text-xl font-bold text-primary-900">Premium plans are being prepared</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">Subscription options will appear here as soon as the plans are published.</p>
          </div>
        )}
      </div>
    </section>
  );
}
