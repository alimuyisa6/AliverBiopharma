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

return `${currency || ''} ${new Intl.NumberFormat().format(value)}`.trim();
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
return 'Enter your organisation or advertiser name.';
}

  if (!form.contactEmail.trim()) {
    return 'Enter an email address we can use to contact you.';
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
    return 'Enter the web address learners should visit when they click your advert.';
  }

  if (!form.headline.trim()) {
    return 'Add a headline for your advert.';
  }

  return '';
}

if (currentStep === 2) {
  if (!form.scopeId) {
    return 'Choose which learners should see your campaign.';
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
    return 'Choose a learning level and the relevant class or programme.';
  }

  return '';
}

if (currentStep === 3) {
  if (!form.placementId) {
    return 'Choose where you want your advert to appear.';
  }

  if (!form.durationTierId) {
    return 'Choose how long you want your campaign to run.';
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
<main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 sm:py-14">
<section className="mx-auto mb-10 max-w-7xl">
<div>
<Link
to="/advertise"
className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-700 no-underline hover:text-primary-900"
>
<Icon name="arrow-left" />
Advertising
</Link>

      <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
        Create a campaign
      </span>

      <h1 className="font-extrabold tracking-tight">
        Build your
        <br />
        campaign.
      </h1>

      <p className="leading-7 text-slate-600">
        Complete the steps below. Available options and pricing come from
        the advertising system.
      </p>
    </div>

    <div className="mx-auto mb-8 flex max-w-7xl flex-wrap gap-2">
      {STEP_TITLES.map((title, index) => (
        <div
          className={`inline-flex min-h-10 items-center rounded-full border px-4 py-2 text-xs font-bold transition ${index === step ? 'border-primary-700 bg-primary-700 text-white' : index < step ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-border bg-white text-slate-500'}`}
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

  <section className="mx-auto grid max-w-7xl items-start gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.7fr)]">
    <form
      className="min-w-0 rounded-3xl border border-border bg-white p-5 shadow-sm sm:p-8"
      onSubmit={handleSubmit}
    >
      {loadingConfig && (
        <div className="flex min-h-48 items-center justify-center rounded-2xl bg-primary-50 text-sm font-semibold text-primary-800">
          Loading advertising options…
        </div>
      )}

      {!loadingConfig && step === 0 && (
        <div className="space-y-7">
          <div className="mb-2 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Step 01
            </span>

            <h2 className="font-extrabold tracking-tight">
              About your
              <br />
              organisation.
            </h2>

            <p className="leading-7 text-slate-600">
              These details identify who's responsible for the campaign.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>
          </div>
        </div>
      )}

      {!loadingConfig && step === 1 && (
        <div className="space-y-7">
          <div className="mb-2 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Step 02
            </span>

            <h2 className="font-extrabold tracking-tight">
              Campaign
              <br />
              details.
            </h2>

            <p className="leading-7 text-slate-600">
              Keep the message clear and relevant to learners.
            </p>
          </div>

          <div className="grid gap-5">
            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
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

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-32 w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>

            <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
               className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            </label>
          </div>
        </div>
      )}

      {!loadingConfig && step === 2 && (
        <div className="space-y-7">
          <div className="mb-2 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Step 03
            </span>

            <h2 className="font-extrabold tracking-tight">
              Choose your
              <br />
              audience.
            </h2>

            <p className="leading-7 text-slate-600">
              Targeting options come from the current advertising
              configuration.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {config.scopes.map((scope) => (
              <label
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                  form.scopeId === scope.id ? ' border-primary-500 bg-primary-50 ring-2 ring-primary-100' : ' border-border bg-white hover:border-primary-200 hover:bg-primary-50/40'
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
                 className="h-4 w-4 shrink-0 accent-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700" />

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

                  <small className="mt-1 block text-sm font-normal leading-6 text-slate-600">
                    {scope.description}
                  </small>
                </span>
              </label>
            ))}
          </div>

          {selectedScope &&
            selectedScope.scope_type !==
              'all_levels' && (
              <div className="grid gap-5">
                <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
                   className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
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
                    <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
                       className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-slate-800 shadow-sm outline-none transition hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500">
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
        <div className="space-y-7">
          <div className="mb-2 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Step 04
            </span>

            <h2 className="font-extrabold tracking-tight">
              Placement
              <br />
              and timing.
            </h2>

            <p className="leading-7 text-slate-600">
              Placement availability is confirmed when you submit your campaign.
            </p>
          </div>

          <div className="mt-8 space-y-4 rounded-2xl border border-border bg-slate-50/70 p-5">
            <h3 className="font-bold tracking-tight">Placement</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {config.placements.map(
                (placement) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      form.placementId === placement.id ? ' border-primary-500 bg-primary-50 ring-2 ring-primary-100' : ' border-border bg-white hover:border-primary-200 hover:bg-primary-50/40'
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
                     className="h-4 w-4 shrink-0 accent-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700" />

                    <span>
                      <strong>
                        {placement.display_name}
                      </strong>

                      <small className="mt-1 block text-sm font-normal leading-6 text-slate-600">
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

          <div className="mt-8 space-y-4 rounded-2xl border border-border bg-slate-50/70 p-5">
            <h3 className="font-bold tracking-tight">Campaign duration</h3>

            <div className="grid gap-3 sm:grid-cols-2">
              {config.duration_tiers.map(
                (tier) => (
                  <label
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
                      form.durationTierId === tier.id ? ' border-primary-500 bg-primary-50 ring-2 ring-primary-100' : ' border-border bg-white hover:border-primary-200 hover:bg-primary-50/40'
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
                     className="h-4 w-4 shrink-0 accent-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700" />

                    <span>
                      <strong>
                        {tier.label}
                      </strong>

                      <small className="mt-1 block text-sm font-normal leading-6 text-slate-600">
                        {tier.duration_days} days
                      </small>
                    </span>
                  </label>
                )
              )}
            </div>
          </div>

          <label className="block space-y-2 text-sm font-semibold text-primary-900">
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
             className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
          </label>
        </div>
      )}

      {!loadingConfig && step === 4 && (
        <div className="space-y-7">
          <div className="mb-2 max-w-2xl space-y-3">
            <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
              Step 05
            </span>

            <h2 className="font-extrabold tracking-tight">
              Review and
              <br />
              submit.
            </h2>

            <p className="leading-7 text-slate-600">
              Confirm the details below. Payment and review follow after
              submission.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Advertiser</span>
              <strong>
                {form.advertiserName}
              </strong>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Campaign</span>
              <strong>
                {form.campaignTitle}
              </strong>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Category</span>
              <strong>
                {selectedCategory?.label || '—'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
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

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Placement</span>
              <strong>
                {selectedPlacement?.display_name ||
                  '—'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Duration</span>
              <strong>
                {selectedDuration?.label || '—'}
              </strong>
            </div>

            <div className="flex flex-col gap-1 rounded-xl border border-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
              <span>Start date</span>
              <strong>{form.startDate}</strong>
            </div>

            <div className="flex flex-col gap-2 rounded-xl border border-primary-100 bg-primary-50/70 p-4">
              <span>Headline</span>
              <strong>{form.headline}</strong>
            </div>

            {form.bodyText && (
              <div className="flex flex-col gap-2 rounded-xl border border-primary-100 bg-primary-50/70 p-4">
                <span>Message</span>
                <strong>{form.bodyText}</strong>
              </div>
            )}
          </div>

          {estimatedPrice && (
            <div className="mt-5 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 text-secondary-900">
              <span>
                Estimated campaign cost
              </span>

              <strong>
                {formatMoney(
                  estimatedPrice.amount,
                  estimatedPrice.currency
                )}
              </strong>

              <small className="mt-1 block text-sm font-normal leading-6 text-slate-600">
                Your final price will be confirmed when you submit the campaign.
              </small>
            </div>
          )}
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          role="alert"
        >
          {error}
        </div>
      )}

      {!loadingConfig && (
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          {step > 0 ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border bg-white px-5 py-3 text-sm font-bold text-primary-800 transition hover:border-primary-200 hover:bg-primary-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={previousStep}
              disabled={submitting}
            >
              Back
            </button>
          ) : (
            <Link
              to="/advertise"
              className="text-sm font-semibold text-primary-700 underline underline-offset-4 hover:text-primary-900"
            >
              Cancel
            </Link>
          )}

          {step < STEP_TITLES.length - 1 ? (
            <button
              type="button"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={nextStep}
            >
              Continue
            </button>
          ) : (
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={submitting}
            >
              {submitting
                ? 'Submitting…'
                : 'Submit campaign'}
            </button>
          )}
        </div>
      )}
    </form>

    <aside className="sticky top-24 rounded-3xl border border-primary-800 bg-primary-900 p-6 text-white shadow-xl [&_h2]:text-white [&_p]:text-blue-100 [&_a]:text-orange-100">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-orange-200">
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

      <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">
        Advertising on AliverBiopharm
      </span>

      <h2 className="font-extrabold tracking-tight">
        Keep it
        <br />
        useful.
      </h2>

      <p className="leading-7 text-slate-600">
        AliverBiopharm is a learning environment. Campaigns should add
        real value for the learners who see them.
      </p>

      <Link
        to="/advertise"
        className="text-sm font-semibold text-primary-700 underline underline-offset-4 hover:text-primary-900"
      >
        Read the advertising guidelines
      </Link>
    </aside>
  </section>
</main>

);
}
