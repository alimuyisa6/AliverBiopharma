 /* src/pages/AdvertiseCreate.jsx */

import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import AdStepIcon from '../components/Advertising/AdStepIcon';
import AdCampaignSuccess from '../components/Advertising/AdCampaignSuccess';
import {
getAdConfig,
createAdAdvertiser,
createAdCampaign,
createAdCreative,
submitAdPlacement,
} from '../api/client';

const INITIAL_FORM = {
advertiserName: '',
contactEmail: '',
contactPhone: '',
website: '',
campaignTitle: '',
categoryId: '',
landingUrl: '',
headline: '',
bodyText: '',
ctaText: 'Learn more',
scopeId: '',
levelId: '',
className: '',
placementId: '',
durationTierId: '',
startDate: '',
};

const STEP_TITLES = [
'Organisation',
'Campaign',
'Audience',
'Placement',
'Review',
];

function formatMoney(amount, currency = '') {
const value = Number(amount);

if (!Number.isFinite(value)) {
return '';
}

return "${currency || ''} ${new Intl.NumberFormat().format(value)}".trim();
}

function getDefaultStartDate() {
const date = new Date();
date.setDate(date.getDate() + 1);
return date.toISOString().slice(0, 10);
}

export default function AdvertiseCreate() {
const [step, setStep] = useState(0);
const [form, setForm] = useState({
...INITIAL_FORM,
startDate: getDefaultStartDate(),
});

const [config, setConfig] = useState({
levels: [],
categories: [],
placements: [],
scopes: [],
duration_tiers: [],
});

const [loadingConfig, setLoadingConfig] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');
const [success, setSuccess] = useState(null);

useEffect(() => {
let active = true;

async function loadConfig() {
  setLoadingConfig(true);
  setError('');

  try {
    const result = await getAdConfig();

    if (!active) {
      return;
    }

    setConfig({
      levels: result?.levels || [],
      categories: result?.categories || [],
      placements: result?.placements || [],
      scopes: result?.scopes || [],
      duration_tiers: result?.duration_tiers || [],
    });
  } catch (requestError) {
    if (!active) {
      return;
    }

    setError(
      requestError?.message ||
        'Unable to load the advertising options. Please try again.'
    );
  } finally {
    if (active) {
      setLoadingConfig(false);
    }
  }
}

loadConfig();

return () => {
  active = false;
};

}, []);

const selectedScope = useMemo(
() =>
config.scopes.find(
(scope) => scope.id === form.scopeId
) || null,
[config.scopes, form.scopeId]
);

const selectedPlacement = useMemo(
() =>
config.placements.find(
(placement) => placement.id === form.placementId
) || null,
[config.placements, form.placementId]
);

const selectedDuration = useMemo(
() =>
config.duration_tiers.find(
(tier) => tier.id === form.durationTierId
) || null,
[config.duration_tiers, form.durationTierId]
);

const selectedCategory = useMemo(
() =>
config.categories.find(
(category) => category.id === form.categoryId
) || null,
[config.categories, form.categoryId]
);

const selectedLevel = useMemo(
() =>
config.levels.find(
(level) => level.id === form.levelId
) || null,
[config.levels, form.levelId]
);

const estimatedPrice = useMemo(() => {
if (
!selectedPlacement ||
!selectedScope ||
!selectedDuration
) {
return null;
}

const price =
  Number(selectedPlacement.base_price_amount || 0) *
  Number(selectedScope.price_multiplier || 1) *
  Number(selectedDuration.price_factor || 1);

if (!Number.isFinite(price)) {
  return null;
}

return {
  amount: Math.round(price * 100) / 100,
  currency: selectedPlacement.currency || '',
};

}, [
selectedPlacement,
selectedScope,
selectedDuration,
]);

const availableGroups = selectedLevel?.groups || [];

function updateField(name, value) {
setForm((current) => ({
...current,
[name]: value,
}));

setError('');

}

function handleScopeChange(scopeId) {
const scope = config.scopes.find(
(item) => item.id === scopeId
);

setForm((current) => ({
  ...current,
  scopeId,
  levelId:
    scope?.scope_type === 'all_levels'
      ? ''
      : current.levelId,
  className:
    scope?.scope_type === 'specific_class'
      ? current.className
      : '',
}));

setError('');

}

function validateStep(currentStep) {
if (currentStep === 0) {
if (!form.advertiserName.trim()) {
return 'Enter the organisation or advertiser name.';
}

  if (!form.contactEmail.trim()) {
    return 'Enter a contact email address.';
  }

  return '';
}

if (currentStep === 1) {
  if (!form.campaignTitle.trim()) {
    return 'Enter a campaign title.';
  }

  if (!form.categoryId) {
    return 'Choose a campaign category.';
  }

  if (!form.landingUrl.trim()) {
    return 'Enter the page learners should visit after clicking the advert.';
  }

  if (!form.headline.trim()) {
    return 'Enter the headline for your advert.';
  }

  return '';
}

if (currentStep === 2) {
  if (!form.scopeId) {
    return 'Choose who should see the campaign.';
  }

  if (
    selectedScope?.scope_type === 'specific_level' &&
    !form.levelId
  ) {
    return 'Choose the learning level you want to target.';
  }

  if (
    selectedScope?.scope_type === 'specific_class' &&
    (!form.levelId || !form.className)
  ) {
    return 'Choose both a learning level and class or programme.';
  }

  return '';
}

if (currentStep === 3) {
  if (!form.placementId) {
    return 'Choose where the advert should appear.';
  }

  if (!form.durationTierId) {
    return 'Choose how long the campaign should run.';
  }

  if (!form.startDate) {
    return 'Choose a campaign start date.';
  }

  return '';
}

return '';

}

function nextStep() {
const validationError = validateStep(step);

if (validationError) {
  setError(validationError);
  return;
}

setError('');
setStep((current) =>
  Math.min(
    current + 1,
    STEP_TITLES.length - 1
  )
);

}

function previousStep() {
setError('');
setStep((current) => Math.max(current - 1, 0));
}

async function handleSubmit(event) {
event.preventDefault();

const validationErrors = STEP_TITLES.map(
  (_, index) => validateStep(index)
).filter(Boolean);

if (validationErrors.length) {
  setError(validationErrors[0]);
  return;
}

setSubmitting(true);
setError('');

try {
  const advertiser = await createAdAdvertiser({
    name: form.advertiserName.trim(),
    contact_email: form.contactEmail.trim(),
    contact_phone:
      form.contactPhone.trim() || undefined,
    website: form.website.trim() || undefined,
  });

  const campaign = await createAdCampaign({
    advertiser_id: advertiser.id,
    title: form.campaignTitle.trim(),
    content_category: form.categoryId,
    landing_url: form.landingUrl.trim(),
  });

  const creative = await createAdCreative({
    campaign_id: campaign.id,
    headline: form.headline.trim(),
    body_text:
      form.bodyText.trim() || undefined,
    cta_text:
      form.ctaText.trim() || 'Learn more',
  });

  const placement = await submitAdPlacement({
    campaign_id: campaign.id,
    placement_id: form.placementId,
    scope_id: form.scopeId,
    duration_tier_id: form.durationTierId,
    creative_id: creative.id,
    start_date: form.startDate,
    level_id: form.levelId || undefined,
    class_name: form.className || undefined,
  });

  setSuccess({
    campaign,
    creative,
    campaignId: campaign.id,
    campaignPlacementId:
      placement.campaign_placement_id,
    placement:
      placement.placement || placement,
  });
} catch (requestError) {
  setError(
    requestError?.message ||
      'We could not submit your campaign. Please review the details and try again.'
  );
} finally {
  setSubmitting(false);
}

}

if (success) {
return (
<AdCampaignSuccess
campaign={success.campaign}
placement={{
...(success.placement || {}),
campaign_placement_id:
success.campaignPlacementId,
placement_name:
success.placement?.placement_name ||
selectedPlacement?.display_name,
scope_name:
success.placement?.scope_name ||
selectedScope?.description ||
selectedScope?.scope_type,
duration_label:
success.placement?.duration_label ||
selectedDuration?.label,
start_date:
success.placement?.start_date ||
form.startDate,
final_price:
success.placement?.final_price ||
estimatedPrice?.amount,
currency:
success.placement?.currency ||
estimatedPrice?.currency ||
selectedPlacement?.currency,
}}
/>
);
}

return (
<main className="advertise-create-page">
<section className="advertise-create-header">
<div>
<Link
to="/advertise"
className="advertise-back-link"
>
<Icon name="arrow-left" />
Advertising
</Link>

      <span className="eyebrow">
        Create a campaign
      </span>

      <h1>
        Put your message in
        <br />
        front of the right learners.
      </h1>

      <p>
        Complete the campaign details below. Available
        advertising options and pricing are supplied from
        the AliverBiopharm advertising system.
      </p>
    </div>

    <div className="advertise-create-progress">
      {STEP_TITLES.map((title, index) => (
        <div
          className={`advertise-create-progress-item${
            index === step ? ' is-active' : ''
          }${
            index < step ? ' is-complete' : ''
          }`}
          key={title}
        >
          <span>
            {String(index + 1).padStart(2, '0')}
          </span>

          <strong>{title}</strong>
        </div>
      ))}
    </div>
  </section>

  <section className="advertise-create-layout">
    <form
      className="advertise-create-form"
      onSubmit={handleSubmit}
    >
      {loadingConfig && (
        <div className="advertise-create-loading">
          Loading advertising options…
        </div>
      )}

      {!loadingConfig && step === 0 && (
        <div className="advertise-create-step">
          <div className="advertise-create-step-heading">
            <span className="eyebrow">
              Step 01
            </span>

            <h2>
              Tell us about
              <br />
              your organisation.
            </h2>

            <p>
              These details identify the advertiser
              responsible for the campaign.
            </p>
          </div>

          <div className="advertise-form-grid">
            <label>
              Organisation or advertiser name
              <input
                type="text"
                value={form.advertiserName}
                onChange={(event) =>
                  updateField(
                    'advertiserName',
                    event.target.value
                  )
                }
                placeholder="Organisation name"
                maxLength={200}
                required
              />
            </label>

            <label>
              Contact email
              <input
                type="email"
                value={form.contactEmail}
                onChange={(event) =>
                  updateField(
                    'contactEmail',
                    event.target.value
                  )
                }
                placeholder="name@example.com"
                required
              />
            </label>

            <label>
              Contact phone
              <input
                type="tel"
                value={form.contactPhone}
                onChange={(event) =>
                  updateField(
                    'contactPhone',
                    event.target.value
                  )
                }
                placeholder="Optional"
              />
            </label>

            <label>
              Website
              <input
                type="url"
                value={form.website}
                onChange={(event) =>
                  updateField(
                    'website',
                    event.target.value
                  )
                }
                placeholder="https://example.com"
              />
            </label>
          </div>
        </div>
      )}

      {!loadingConfig && step === 1 && (
        <div className="advertise-create-step">
          <div className="advertise-create-step-heading">
            <span className="eyebrow">
              Step 02
            </span>

            <h2>
              Shape the campaign
              <br />
              learners will see.
            </h2>

            <p>
              Keep your message clear, useful and
              appropriate for an education-focused
              environment.
            </p>
          </div>

          <div className="advertise-form-stack">
            <label>
              Campaign title
              <input
                type="text"
                value={form.campaignTitle}
                onChange={(event) =>
                  updateField(
                    'campaignTitle',
                    event.target.value
                  )
                }
                placeholder="Internal campaign name"
                maxLength={200}
                required
              />
            </label>

            <label>
              Category
              <select
                value={form.categoryId}
                onChange={(event) =>
                  updateField(
                    'categoryId',
                    event.target.value
                  )
                }
                required
              >
                <option value="">
                  Select a category
                </option>

                {config.categories.map(
                  (category) => (
                    <option
                      value={category.id}
                      key={category.id}
                    >
                      {category.label}
                    </option>
                  )
                )}
              </select>
            </label>

            <label>
              Landing page
              <input
                type="url"
                value={form.landingUrl}
                onChange={(event) =>
                  updateField(
                    'landingUrl',
                    event.target.value
                  )
                }
                placeholder="https://example.com/your-page"
                required
              />
            </label>

            <label>
              Advert headline
              <input
                type="text"
                value={form.headline}
                onChange={(event) =>
                  updateField(
                    'headline',
                    event.target.value
                  )
                }
                placeholder="A clear message for learners"
                maxLength={180}
                required
              />
            </label>

            <label>
              Advert message
              <textarea
                value={form.bodyText}
                onChange={(event) =>
                  updateField(
                    'bodyText',
                    event.target.value
                  )
                }
                placeholder="Explain the opportunity, service or message."
                rows={5}
                maxLength={5000}
              />
            </label>

            <label>
              Button text
              <input
                type="text"
                value={form.ctaText}
                onChange={(event) =>
                  updateField(
                    'ctaText',
                    event.target.value
                  )
                }
                placeholder="Learn more"
                maxLength={80}
              />
            </label>
          </div>
        </div>
      )}

      {!loadingConfig && step === 2 && (
        <div className="advertise-create-step">
          <div className="advertise-create-step-heading">
            <span className="eyebrow">
              Step 03
            </span>

            <h2>
              Choose the learners
              <br />
              you want to reach.
            </h2>

            <p>
              Targeting options are controlled by the
              active advertising configuration.
            </p>
          </div>

          <div className="advertise-option-list">
            {config.scopes.map((scope) => (
              <label
                className={`advertise-option${
                  form.scopeId === scope.id
                    ? ' is-selected'
                    : ''
                }`}
                key={scope.id}
              >
                <input
                  type="radio"
                  name="scope"
                  value={scope.id}
                  checked={
                    form.scopeId === scope.id
                  }
                  onChange={(event) =>
                    handleScopeChange(
                      event.target.value
                    )
                  }
                />

                <span>
                  <strong>
                    {scope.scope_type ===
                    'all_levels'
                      ? 'All learning levels'
                      : scope.scope_type ===
                          'specific_level'
                        ? 'Specific learning level'
                        : 'Specific class or programme'}
                  </strong>

                  <small>
                    {scope.description}
                  </small>
                </span>
              </label>
            ))}
          </div>

          {selectedScope &&
            selectedScope.scope_type !==
              'all_levels' && (
              <div className="advertise-form-stack">
                <label>
                  Learning level
                  <select
                    value={form.levelId}
                    onChange={(event) =>
                      updateField(
                        'levelId',
                        event.target.value
                      )
                    }
                    required
                  >
                    <option value="">
                      Select a level
                    </option>

                    {config.levels.map(
                      (level) => (
                        <option
                          value={level.id}
                          key={level.id}
                        >
                          {level.display_name}
                        </option>
                      )
                    )}
                  </select>
                </label>

                {selectedScope.scope_type ===
                  'specific_class' &&
                  form.levelId && (
                    <label>
                      Class or programme
                      <select
                        value={form.className}
                        onChange={(event) =>
                          updateField(
                            'className',
                            event.target.value
                          )
                        }
                        required
                      >
                        <option value="">
                          Select a class or programme
                        </option>

                        {availableGroups.map(
                          (group) => (
                            <option
                              value={group.name}
                              key={group.id}
                            >
                              {group.name}
                            </option>
                          )
                        )}
                      </select>
                    </label>
                  )}
              </div>
            )}
        </div>
      )}

      {!loadingConfig && step === 3 && (
        <div className="advertise-create-step">
          <div className="advertise-create-step-heading">
            <span className="eyebrow">
              Step 04
            </span>

            <h2>
              Choose where and
              <br />
              when to appear.
            </h2>

            <p>
              Placement availability is checked by the
              advertising system when the campaign is
              submitted.
            </p>
          </div>

          <div className="advertise-create-choice-section">
            <h3>Placement</h3>

            <div className="advertise-option-list">
              {config.placements.map(
                (placement) => (
                  <label
                    className={`advertise-option${
                      form.placementId ===
                      placement.id
                        ? ' is-selected'
                        : ''
                    }`}
                    key={placement.id}
                  >
                    <input
                      type="radio"
                      name="placement"
                      value={placement.id}
                      checked={
                        form.placementId ===
                        placement.id
                      }
                      onChange={(event) =>
                        updateField(
                          'placementId',
                          event.target.value
                        )
                      }
                    />

                    <span>
                      <strong>
                        {placement.display_name}
                      </strong>

                      <small>
                        {placement.description}
                      </small>
                    </span>

                    <em>
                      {formatMoney(
                        placement.base_price_amount,
                        placement.currency
                      )}
                    </em>
                  </label>
                )
              )}
            </div>
          </div>

          <div className="advertise-create-choice-section">
            <h3>Campaign duration</h3>

            <div className="advertise-option-list">
              {config.duration_tiers.map(
                (tier) => (
                  <label
                    className={`advertise-option${
                      form.durationTierId ===
                      tier.id
                        ? ' is-selected'
                        : ''
                    }`}
                    key={tier.id}
                  >
                    <input
                      type="radio"
                      name="duration"
                      value={tier.id}
                      checked={
                        form.durationTierId ===
                        tier.id
                      }
                      onChange={(event) =>
                        updateField(
                          'durationTierId',
                          event.target.value
                        )
                      }
                    />

                    <span>
                      <strong>
                        {tier.label}
                      </strong>

                      <small>
                        {tier.duration_days} days
                      </small>
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <label>
            Start date
            <input
              type="date"
              value={form.startDate}
              onChange={(event) =>
                updateField(
                  'startDate',
                  event.target.value
                )
              }
              required
            />
          </label>
        </div>
      )}

      {!loadingConfig && step === 4 && (
        <div className="advertise-create-step">
          <div className="advertise-create-step-heading">
            <span className="eyebrow">
              Step 05
            </span>

            <h2>
              Review your campaign
              <br />
              before submitting.
            </h2>

            <p>
              Check the information below. Your campaign
              will still go through the platform's payment
              and review process.
            </p>
          </div>

          <div className="advertise-review">
            <div className="advertise-review-row">
              <span>Advertiser</span>
              <strong>
                {form.advertiserName}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Campaign</span>
              <strong>
                {form.campaignTitle}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Category</span>
              <strong>
                {selectedCategory?.label || '—'}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Audience</span>
              <strong>
                {selectedScope?.scope_type ===
                'all_levels'
                  ? 'All learning levels'
                  : selectedScope?.scope_type ===
                      'specific_level'
                    ? selectedLevel?.display_name ||
                      'Selected level'
                    : `${
                        selectedLevel?.display_name ||
                        'Selected level'
                      } — ${
                        form.className ||
                        'Selected class'
                      }`}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Placement</span>
              <strong>
                {selectedPlacement?.display_name ||
                  '—'}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Duration</span>
              <strong>
                {selectedDuration?.label || '—'}
              </strong>
            </div>

            <div className="advertise-review-row">
              <span>Start date</span>
              <strong>{form.startDate}</strong>
            </div>

            <div className="advertise-review-row advertise-review-message">
              <span>Headline</span>
              <strong>{form.headline}</strong>
            </div>

            {form.bodyText && (
              <div className="advertise-review-row advertise-review-message">
                <span>Message</span>
                <strong>{form.bodyText}</strong>
              </div>
            )}
          </div>

          {estimatedPrice && (
            <div className="advertise-create-price">
              <span>
                Estimated campaign price
              </span>

              <strong>
                {formatMoney(
                  estimatedPrice.amount,
                  estimatedPrice.currency
                )}
              </strong>

              <small>
                Final availability and price are
                confirmed by the advertising system when
                the placement is submitted.
              </small>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="advertise-create-error"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loadingConfig && (
        <div className="advertise-create-navigation">
          {step > 0 ? (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={previousStep}
              disabled={submitting}
            >
              <Icon name="arrow-left" />
              Back
            </button>
          ) : (
            <Link
              to="/advertise"
              className="advertise-text-link"
            >
              Cancel
            </Link>
          )}

          {step < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={nextStep}
            >
              Continue
              <Icon name="arrow-right" />
            </button>
          ) : (
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting
                ? 'Submitting…'
                : 'Submit campaign'}
              {!submitting && (
                <Icon name="arrow-right" />
              )}
            </button>
          )}
        </div>
      )}
    </form>

    <aside className="advertise-create-aside">
      <div className="advertise-create-aside-mark">
        <AdStepIcon
          name={
            step === 0
              ? 'organisation'
              : step === 1
                ? 'campaign'
                : step === 2
                  ? 'audience'
                  : step === 3
                    ? 'placement'
                    : 'review'
          }
          size={38}
        />
      </div>

      <span className="eyebrow">
        Advertising on Aliver
      </span>

      <h2>
        Keep your message
        <br />
        useful and relevant.
      </h2>

      <p>
        AliverBiopharm is a learning environment.
        Campaigns should provide genuine value to the
        learners they reach.
      </p>

      <Link
        to="/advertise"
        className="advertise-text-link"
      >
        Review advertising guidelines
        <Icon name="arrow-right" />
      </Link>
    </aside>
  </section>
</main>

);
}
