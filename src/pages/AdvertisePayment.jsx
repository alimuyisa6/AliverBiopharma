/* src/pages/AdvertisePayment.jsx */

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import {
verifyAdPayment,
getAdCampaigns,
} from '../api/client';

function formatMoney(amount, currency = '') {
const value = Number(amount);

if (!Number.isFinite(value)) {
return '';
}

return "${currency || ''} ${new Intl.NumberFormat().format(value)}".trim();
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
      'No campaign placement was provided. Please return to advertising and start again.'
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
        'The campaign placement could not be found.'
      );
    }
  } catch (requestError) {
    if (!active) {
      return;
    }

    setError(
      requestError?.message ||
        'Unable to load your campaign payment status.'
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
event.preventDefault();

if (!paymentId.trim()) {
  setError('Enter the payment reference before continuing.');
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
      'Payment verification was submitted successfully.'
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
      'Payment could not be verified. Check the reference and try again.'
  );
} finally {
  setVerifying(false);
}

}

if (loading) {
return (
<main className="advertise-payment-page">
<section className="advertise-payment-loading">
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
<main className="advertise-payment-page">
<section className="advertise-payment-header">
<Link
to="/advertise"
className="advertise-back-link"
>
<Icon name="arrow-left" />
Advertising
</Link>

    <span className="eyebrow">
      Campaign payment
    </span>

    <h1>
      Confirm your
      <br />
      payment.
    </h1>

    <p>
      Enter the payment reference from your transaction. We'll verify it
      against your campaign before it moves forward.
    </p>
  </section>

  <section className="advertise-payment-layout">
    <div className="advertise-payment-main">
      {error && (
        <div
          className="advertise-payment-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {message && (
        <div
          className="advertise-payment-message"
          role="status"
        >
          {message}
        </div>
      )}

      {!campaign && !error && (
        <div className="advertise-payment-empty">
          <div className="advertise-payment-empty-icon">
            <AdStepIcon name="campaign" size={36} />
          </div>

          <h2>Campaign details unavailable</h2>

          <p>
            We couldn't find the campaign associated with this payment
            page.
          </p>

          <button
            type="button"
            className="btn btn-primary"
            onClick={() => navigate('/advertise')}
          >
            Back to advertising
          </button>
        </div>
      )}

      {campaign && (
        <>
          <div className="advertise-payment-status">
            <div className="advertise-payment-status-icon">
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
              <span className="eyebrow">
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

          <div className="advertise-payment-summary">
            <div className="advertise-payment-summary-row">
              <span>Campaign</span>
              <strong>
                {campaign.title ||
                  campaign.campaign_title ||
                  'Advertising campaign'}
              </strong>
            </div>

            <div className="advertise-payment-summary-row">
              <span>Placement</span>
              <strong>
                {placement?.placement_name ||
                  placement?.display_name ||
                  'Selected placement'}
              </strong>
            </div>

            <div className="advertise-payment-summary-row">
              <span>Campaign amount</span>
              <strong>
                {formatMoney(
                  placement?.final_price,
                  placement?.currency
                ) || 'Amount confirmed during submission'}
              </strong>
            </div>

            <div className="advertise-payment-summary-row">
              <span>Start date</span>
              <strong>
                {placement?.start_date || '—'}
              </strong>
            </div>

            <div className="advertise-payment-summary-row">
              <span>End date</span>
              <strong>
                {placement?.end_date || '—'}
              </strong>
            </div>
          </div>

          {paymentState !== 'paid' &&
            paymentState !== 'rejected' && (
              <form
                className="advertise-payment-form"
                onSubmit={handleVerify}
              >
                <div className="advertise-payment-form-heading">
                  <span className="eyebrow">
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

                <label>
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
                  />
                </label>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={verifying}
                >
                  {verifying
                    ? 'Verifying…'
                    : 'Verify payment'}
                </button>
              </form>
            )}

          {paymentState === 'paid' && (
            <div className="advertise-payment-next">
              <div>
                <span className="eyebrow">
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
                className="btn btn-primary"
              >
                Back to advertising
              </Link>
            </div>
          )}
        </>
      )}
    </div>

    <aside className="advertise-payment-aside">
      <div className="advertise-payment-aside-icon">
        <AdStepIcon name="review" size={38} />
      </div>

      <span className="eyebrow">
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

      <div className="advertise-payment-checklist">
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
        className="advertise-text-link"
      >
        Advertising guidelines
      </Link>
    </aside>
  </section>
</main>

);
}
