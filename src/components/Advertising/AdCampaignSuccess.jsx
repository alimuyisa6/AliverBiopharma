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
    <main className="ad-campaign-success">
      <section className="ad-campaign-success-header">
        <div className="ad-campaign-success-mark">
          <AdStepIcon name="reach" size={42} />
        </div>

        <span className="eyebrow">
          Campaign submitted
        </span>

        <h1>
          Your advertising campaign
          <br />
          is now in the process.
        </h1>

        <p>
          Thank you for choosing AliverBiopharm. Your campaign details have
          been submitted and will move through payment verification and
          advertising review before activation.
        </p>

        {campaignPlacementId && (
          <div className="ad-campaign-reference">
            <span>Campaign placement reference</span>
            <strong>{campaignPlacementId}</strong>
          </div>
        )}
      </section>

      <section className="ad-campaign-success-content">
        <div className="ad-campaign-success-main">
          <div className="ad-campaign-status-card">
            <div className="ad-campaign-status-heading">
              <div>
                <span className="eyebrow">
                  Campaign progress
                </span>

                <h2>
                  What happens next
                </h2>
              </div>

              <AdStepIcon name="review" size={32} />
            </div>

            <div className="ad-campaign-progress">
              <div className="ad-campaign-success-progress-step complete">
                <span>01</span>

                <div>
                  <strong>Campaign submitted</strong>
                  <p>
                    Your campaign configuration has been received.
                  </p>
                </div>
              </div>

              <div
                className={`ad-campaign-success-progress-step ${
                  isPaid ? 'complete' : 'current'
                }`}
              >
                <span>02</span>

                <div>
                  <strong>Payment verification</strong>
                  <p>
                    {isPaid
                      ? 'Payment has been verified.'
                      : 'Payment must be verified before activation.'}
                  </p>
                </div>
              </div>

              <div
                className={`ad-campaign-success-progress-step ${
                  isRejected
                    ? 'rejected'
                    : reviewStatus === 'approved'
                      ? 'complete'
                      : 'current'
                }`}
              >
                <span>03</span>

                <div>
                  <strong>Advertising review</strong>
                  <p>
                    {isRejected
                      ? 'The campaign requires attention before it can proceed.'
                      : reviewStatus === 'approved'
                        ? 'Your campaign has passed review.'
                        : 'The advertising team will review the campaign.'}
                  </p>
                </div>
              </div>

              <div
                className={`ad-campaign-success-progress-step ${
                  reviewStatus === 'approved'
                    ? 'current'
                    : ''
                }`}
              >
                <span>04</span>

                <div>
                  <strong>Campaign activation</strong>
                  <p>
                    The campaign becomes eligible to run after approval and
                    all required conditions are satisfied.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="ad-campaign-summary-card">
            <div className="ad-campaign-summary-heading">
              <div>
                <span className="eyebrow">
                  Campaign details
                </span>

                <h2>
                  Your submission
                </h2>
              </div>

              <AdStepIcon name="campaign" size={30} />
            </div>

            <div className="ad-campaign-summary-grid">
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

          <div className="ad-campaign-success-actions">
            {onBack ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={onBack}
              >
                Back to advertising
                <Icon name="arrow-left" />
              </button>
            ) : (
              <Link
                to="/advertise"
                className="btn btn-primary"
              >
                Back to advertising
                <Icon name="arrow-left" />
              </Link>
            )}

            <Link
              to="/"
              className="ad-campaign-text-link"
            >
              Return home
              <Icon name="arrow-right" />
            </Link>
          </div>
        </div>

        <aside className="ad-campaign-success-aside">
          <div className="ad-campaign-aside-block">
            <div className="ad-campaign-aside-icon">
              <AdStepIcon name="audience" size={32} />
            </div>

            <span className="eyebrow">
              Aliver audience
            </span>

            <h2>
              Your campaign reaches a focused learning community.
            </h2>

            <p>
              Advertising placements are designed around the learners,
              classes, programmes and educational interests supported by
              AliverBiopharm.
            </p>
          </div>

          <div className="ad-campaign-aside-block">
            <div className="ad-campaign-aside-icon">
              <AdStepIcon name="review" size={32} />
            </div>

            <span className="eyebrow">
              Responsible advertising
            </span>

            <h2>
              Every campaign must support a suitable learning environment.
            </h2>

            <p>
              Payment alone does not guarantee publication. Campaigns remain
              subject to the platform's advertising requirements and review
              process.
            </p>
          </div>

          <Link
            to="/advertise"
            className="ad-campaign-aside-link"
          >
            Review advertising information
            <Icon name="arrow-right" />
          </Link>
        </aside>
      </section>
    </main>
  );
}
