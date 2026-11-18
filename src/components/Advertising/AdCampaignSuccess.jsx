 /* src/components/Advertising/AdCampaignSuccess.jsx */

import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import AdStepIcon from './AdStepIcon';

function formatMoney(amount, currency = '') {
  const value = Number(amount);

  if (!Number.isFinite(value)) {
    return 'Amount confirmed during submission';
  }

  return `${currency || ''} ${new Intl.NumberFormat().format(value)}`.trim();
}

function getValue(data, keys, fallback = '—') {
  for (const key of keys) {
    if (
      data?.[key] !== undefined &&
      data?.[key] !== null &&
      String(data[key]).trim() !== ''
    ) {
      return data[key];
    }
  }

  return fallback;
}

export default function AdCampaignSuccess({
  campaign = null,
  placement = null,
  onBack,
}) {
  const campaignData = campaign || {};

  const placementData =
    placement ||
    campaignData.placement ||
    campaignData.campaign_placement ||
    campaignData;

  const campaignPlacementId = getValue(
    placementData,
    ['campaign_placement_id', 'id'],
    ''
  );

  const paymentStatus = getValue(
    placementData,
    ['payment_status'],
    'pending'
  );

  const reviewStatus = getValue(
    placementData,
    ['review_status', 'status'],
    'submitted'
  );

  const placementName = getValue(
    placementData,
    ['placement_name', 'display_name'],
    'Selected placement'
  );

  const scopeName = getValue(
    placementData,
    ['scope_name', 'targeting_scope', 'scope_type'],
    'Selected audience'
  );

  const durationName = getValue(
    placementData,
    ['duration_label', 'duration_name'],
    'Selected duration'
  );

  const startDate = getValue(
    placementData,
    ['start_date'],
    '—'
  );

  const endDate = getValue(
    placementData,
    ['end_date'],
    '—'
  );

  const amount = getValue(
    placementData,
    ['final_price', 'price', 'amount'],
    null
  );

  const currency = getValue(
    placementData,
    ['currency'],
    ''
  );

  const isPaid =
    String(paymentStatus).toLowerCase() === 'paid';

  const isRejected =
    String(reviewStatus).toLowerCase() === 'rejected';

  return (
    <main className="min-h-screen bg-background px-5 py-12 text-foreground sm:px-8">
      <section className="mx-auto max-w-4xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700">
          <AdStepIcon name="reach" size={42} />
        </div>

        <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
          Campaign submitted
        </span>

        <h1 className="font-extrabold tracking-tight">
          Your advertising campaign
          <br />
          is now in the process.
        </h1>

        <p className="leading-7">
          Thank you for choosing AliverBiopharm. Your campaign details have
          been submitted and will move through payment verification and
          advertising review before activation.
        </p>

        {campaignPlacementId && (
          <div className="mx-auto mt-5 inline-flex rounded-full border border-primary-100 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800">
            <span>Campaign placement reference</span>
            <strong>{campaignPlacementId}</strong>
          </div>
        )}
      </section>

      <section className="mx-auto mt-10 grid max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
        <div className="min-w-0 space-y-6">
          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
                  Campaign progress
                </span>

                <h2 className="font-extrabold tracking-tight">
                  What happens next
                </h2>
              </div>

              <AdStepIcon name="review" size={32} />
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-800">
                <span>01</span>

                <div>
                  <strong>Campaign submitted</strong>
                  <p className="leading-7">
                    Your campaign configuration has been received.
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-sm font-semibold transition ${
                  isPaid ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-primary-200 bg-primary-50 text-primary-800'
                }`}
              >
                <span>02</span>

                <div>
                  <strong>Payment verification</strong>
                  <p className="leading-7">
                    {isPaid
                      ? 'Payment has been verified.'
                      : 'Payment must be verified before activation.'}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-sm font-semibold transition ${
                  isRejected
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : reviewStatus === 'approved'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                      : 'border-primary-200 bg-primary-50 text-primary-800'
                }`}
              >
                <span>03</span>

                <div>
                  <strong>Advertising review</strong>
                  <p className="leading-7">
                    {isRejected
                      ? 'The campaign requires attention before it can proceed.'
                      : reviewStatus === 'approved'
                        ? 'Your campaign has passed review.'
                        : 'The advertising team will review the campaign.'}
                  </p>
                </div>
              </div>

              <div
                className={`rounded-xl border p-4 text-sm font-semibold transition ${
                  reviewStatus === 'approved'
                    ? 'border-primary-200 bg-primary-50 text-primary-800'
                    : 'border-border bg-white text-slate-500'
                }`}
              >
                <span>04</span>

                <div>
                  <strong>Campaign activation</strong>
                  <p className="leading-7">
                    The campaign becomes eligible to run after approval and
                    all required conditions are satisfied.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
                  Campaign details
                </span>

                <h2 className="font-extrabold tracking-tight">
                  Your submission
                </h2>
              </div>

              <AdStepIcon name="campaign" size={30} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <span>Campaign</span>

                <strong>
                  {getValue(
                    campaignData,
                    ['title', 'campaign_title'],
                    'Advertising campaign'
                  )}
                </strong>
              </div>

              <div>
                <span>Placement</span>
                <strong>{placementName}</strong>
              </div>

              <div>
                <span>Audience</span>
                <strong>{scopeName}</strong>
              </div>

              <div>
                <span>Duration</span>
                <strong>{durationName}</strong>
              </div>

              <div>
                <span>Start date</span>
                <strong>{startDate}</strong>
              </div>

              <div>
                <span>End date</span>
                <strong>{endDate}</strong>
              </div>

              <div>
                <span>Campaign amount</span>

                <strong>
                  {formatMoney(amount, currency)}
                </strong>
              </div>

              <div>
                <span>Review status</span>

                <strong>
                  {String(reviewStatus)
                    .replaceAll('_', ' ')
                    .replace(/\b\w/g, (letter) =>
                      letter.toUpperCase()
                    )}
                </strong>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
            {onBack ? (
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
                onClick={onBack}
              >
                Back to advertising
                <Icon name="arrow-left" />
              </button>
            ) : (
              <Link
                to="/advertise"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Back to advertising
                <Icon name="arrow-left" />
              </Link>
            )}

            <Link
              to="/"
              className="text-sm font-semibold text-primary-700 underline underline-offset-4 hover:text-primary-900"
            >
              Return home
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>

        <aside className="sticky top-24 space-y-5 rounded-3xl border border-primary-800 bg-primary-900 p-6 text-white shadow-xl [&_h2]:text-white [&_p]:text-blue-100 [&_a]:text-orange-100">
          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-orange-200">
              <AdStepIcon name="audience" size={32} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Aliver audience
            </span>

            <h2 className="font-extrabold tracking-tight">
              Your campaign reaches a focused learning community.
            </h2>

            <p className="leading-7">
              Advertising placements are designed around the learners,
              classes, programmes and educational interests supported by
              AliverBiopharm.
            </p>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/10 p-5">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-orange-200">
              <AdStepIcon name="review" size={32} />
            </div>

            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Responsible advertising
            </span>

            <h2 className="font-extrabold tracking-tight">
              Every campaign must support a suitable learning environment.
            </h2>

            <p className="leading-7">
              Payment alone does not guarantee publication. Campaigns remain
              subject to the platform's advertising requirements and review
              process.
            </p>
          </div>

          <Link
            to="/advertise"
            className="mt-4 inline-flex text-sm font-semibold text-orange-100 underline underline-offset-4 hover:text-white"
          >
            Review advertising information
            <Icon name="arrow-right" />
          </Link>
        </aside>
      </section>
    </main>
  );
}
