/* src/pages/AdvertisePayment.jsx */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';
import SlideToConfirmButton from '../components/buttons/slide-to-confirm-button';
import {
verifyAdPayment,
getAdCampaigns,
} from '../api/client';

function formatMoney(amount, currency = '') {
const value = Number(amount);

if (!Number.isFinite(value)) {
return '';
}

return `${currency || ''} ${new Intl.NumberFormat().format(value)}`.trim();
}

function getPaymentState(placement) {
if (!placement) {
return 'unknown';
}

if (placement.payment_status === 'paid') {
return 'paid';
}

if (placement.review_status === 'approved') {
return 'approved';
}

if (placement.review_status === 'rejected') {
return 'rejected';
}

return 'pending';
}

export default function AdvertisePayment() {
const location = useLocation();
const navigate = useNavigate();

const searchParams = new URLSearchParams(location.search);
const campaignPlacementId =
searchParams.get('campaign_placement_id') || '';

const [campaign, setCampaign] = useState(null);
const [paymentId, setPaymentId] = useState('');
const [loading, setLoading] = useState(true);
const [verifying, setVerifying] = useState(false);
const [error, setError] = useState('');
const [message, setMessage] = useState('');

useEffect(() => {
let active = true;

async function loadCampaign() {
  if (!campaignPlacementId) {
    setLoading(false);
    setError(
      'We couldn’t find a campaign placement. Return to advertising and start again.'
    );
    return;
  }

  setLoading(true);
  setError('');

  try {
    const result = await getAdCampaigns({
      campaign_placement_id: campaignPlacementId,
    });

    if (!active) {
      return;
    }

    const campaigns = Array.isArray(result)
      ? result
      : result?.campaigns || result?.data || [];

    const found =
      campaigns.find(
        (item) =>
          item.campaign_placement_id === campaignPlacementId ||
          item.id === campaignPlacementId
      ) || null;

    setCampaign(found);

    if (!found) {
      setError(
        'We couldn’t find this campaign placement.'
      );
    }
  } catch (requestError) {
    if (!active) {
      return;
    }

    setError(
      requestError?.message ||
        'We couldn’t load your campaign’s payment status. Please try again.'
    );
  } finally {
    if (active) {
      setLoading(false);
    }
  }
}

loadCampaign();

return () => {
  active = false;
};

}, [campaignPlacementId]);

async function handleVerify(event) {
event?.preventDefault?.();

if (!paymentId.trim()) {
  setError('Enter your payment reference to continue.');
  return;
}

setVerifying(true);
setError('');
setMessage('');

try {
  const result = await verifyAdPayment(
    campaignPlacementId,
    paymentId.trim()
  );

  setMessage(
    result?.message ||
      'Your payment reference has been submitted for verification.'
  );

  setCampaign((current) => ({
    ...current,
    payment_status:
      result?.payment_status ||
      result?.placement?.payment_status ||
      'paid',
  }));
} catch (requestError) {
  setError(
    requestError?.message ||
      'We couldn’t verify the payment. Check the reference and try again.'
  );
  throw requestError;
} finally {
  setVerifying(false);
}

}

if (loading) {
return (
<main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
<section className="mx-auto flex min-h-64 max-w-4xl flex-col items-center justify-center gap-4 rounded-3xl border border-border bg-white p-8 text-primary-800 shadow-sm">
<AdStepIcon name="review" size={38} />
<p>Loading campaign details…</p>
</section>
</main>
);
}

const placement =
campaign?.placement ||
campaign?.campaign_placement ||
campaign;

const paymentState = getPaymentState(placement);

return (
<main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
<section className="mx-auto mb-10 max-w-7xl">
<Link
to="/advertise"
className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-900"
>
<Icon name="arrow-left" />
Advertising
</Link>

    <PageHeader
      label="Campaign payment"
      title="Confirm your campaign payment."
      subtitle="Enter your transaction’s payment reference. We’ll check it against your campaign before it moves forward."
    />
  </section>

  <section className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
    <div className="min-w-0 space-y-6 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8">
      {error && (
        <div
          className={UI.status.error}
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className={UI.status.success}
          role="status"
        >
          {message}
        </div>
      )}

      {!campaign && !error && (
        <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl bg-slate-50 p-8 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-700">
            <AdStepIcon name="campaign" size={36} />
          </div>

          <h2>Campaign details unavailable</h2>

          <p>
            We couldn’t find the campaign linked to this payment page.
          </p>

          <button
            type="button"
            className={UI.primaryButton}
            onClick={() => navigate('/advertise')}
          >
            Back to advertising
          </button>
        </div>
      )}

      {campaign && (
        <>
          <div className="flex items-start gap-4 rounded-2xl border border-primary-100 bg-primary-50/70 p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary-900 text-white">
              <AdStepIcon
                name={
                  paymentState === 'paid'
                    ? 'reach'
                    : paymentState === 'rejected'
                      ? 'review'
                      : 'placement'
                }
                size={34}
              />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
                Payment status
              </span>

              <h2>
                {paymentState === 'paid'
                  ? 'Payment verified'
                  : paymentState === 'rejected'
                    ? 'Campaign requires attention'
                    : 'Payment awaiting verification'}
              </h2>

              <p>
                {paymentState === 'paid'
                  ? 'Your payment is verified. The campaign now moves into the standard review process.'
                  : paymentState === 'rejected'
                    ? "This campaign wasn't approved. Contact the advertising team or review its status."
                    : 'Enter your payment reference below to continue.'}
              </p>
            </div>
          </div>

          <div className="grid gap-3 rounded-2xl border border-border bg-white p-4">
            <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span>Campaign</span>
              <strong>
                {campaign.title ||
                  campaign.campaign_title ||
                  'Advertising campaign'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span>Placement</span>
              <strong>
                {placement?.placement_name ||
                  placement?.display_name ||
                  'Selected placement'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span>Campaign amount</span>
              <strong>
                {formatMoney(
                  placement?.final_price,
                  placement?.currency
                ) || 'Amount confirmed during submission'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span>Start date</span>
              <strong>
                {placement?.start_date || '—'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 border-b border-border pb-3 text-sm last:border-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
              <span>End date</span>
              <strong>
                {placement?.end_date || '—'}
              </strong>
            </div>
          </div>

          {paymentState !== 'paid' &&
            paymentState !== 'rejected' && (
              <form
                className="mt-6 grid gap-5 rounded-2xl border border-border bg-slate-50 p-5"
                onSubmit={handleVerify}
              >
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
                    Payment reference
                  </span>

                  <h2>
                    Match your payment
                    <br />
                    to this campaign.
                  </h2>

                  <p>
                    Enter the ID or reference from your payment
                    confirmation.
                  </p>
                </div>

                <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
                  Payment reference
                  <input
                    type="text"
                    value={paymentId}
                    onChange={(event) => {
                      setPaymentId(event.target.value);
                      setError('');
                    }}
                    placeholder="Enter payment ID"
                    inputMode="numeric"
                    required
                   className={`${UI.inputBase} border-border`} />
                </label>

                <SlideToConfirmButton
                  label="Slide to verify payment"
                  confirmLabel="Payment verification submitted"
                  disabled={!paymentId.trim()}
                  loading={verifying}
                  onConfirm={() => handleVerify()}
                />
              </form>
            )}

          {paymentState === 'paid' && (
            <div className="flex flex-col items-start justify-between gap-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 sm:flex-row sm:items-center">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
                  Next step
                </span>

                <h2>
                  Ready for
                  <br />
                  review.
                </h2>

                <p>
                  Your campaign remains subject to AliverBiopharm's
                  advertising review requirements before it goes live.
                </p>
              </div>

              <Link
                to="/advertise"
                className={UI.primaryButton}
              >
                Back to advertising
              </Link>
            </div>
          )}
        </>
      )}
    </div>

    <aside className="sticky top-24 rounded-3xl border border-primary-800 bg-primary-900 p-6 text-white shadow-xl [&_h2]:text-white [&_p]:text-blue-100 [&_a]:text-secondary-100">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-secondary-200">
        <AdStepIcon name="review" size={38} />
      </div>

      <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-100">
        Payment & review
      </span>

      <h2>
        Payment isn't
        <br />
        activation.
      </h2>

      <p>
        A verified payment doesn't publish your advert automatically —
        campaigns must also pass review.
      </p>

      <div className="mt-7 grid gap-3">
        <div>
          <span>01</span>
          <strong>Payment submitted</strong>
        </div>

        <div>
          <span>02</span>
          <strong>Payment verified</strong>
        </div>

        <div>
          <span>03</span>
          <strong>Campaign reviewed</strong>
        </div>

        <div>
          <span>04</span>
          <strong>Campaign activated</strong>
        </div>
      </div>

      <Link
        to="/advertise"
        className="mt-5 inline-flex text-sm font-semibold text-secondary-100 underline underline-offset-4 hover:text-white"
      >
        Advertising guidelines
      </Link>
    </aside>
  </section>
</main>

);
}
