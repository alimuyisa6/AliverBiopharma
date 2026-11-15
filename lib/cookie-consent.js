import { supabase } from './core.js';
import { parseAndValidateBody, requireAuth, SecurityError } from './security-middleware.js';

function getExpiry(consentedAt, days) {
  if (!Number.isFinite(days) || days <= 0) return null;
  const date = new Date(consentedAt);
  date.setUTCDate(date.getUTCDate() + Math.floor(days));
  return date.toISOString();
}

export async function handler(req, res, path, ctx) {
  requireAuth(ctx);

  if (req.method === 'GET' && path === 'status') {
    return getStatus(res, ctx);
  }

  if (req.method === 'POST' && path === 'consent') {
    const body = await parseAndValidateBody(req);
    return saveConsent(body, res, ctx);
  }

  throw new SecurityError('Invalid action', 400);
}

async function getStatus(res, ctx) {
  const [{ data: settings, error: settingsError }, { data: consent, error: consentError }] = await Promise.all([
    supabase.from('cookie_consent_settings')
      .select('policy_version,notice_enabled,reappear_after_days')
      .eq('id', 'default')
      .maybeSingle(),
    supabase.from('cookie_consents')
      .select('policy_version,preferences,analytics,marketing,consented_at,expires_at')
      .eq('user_id', ctx.userId)
      .maybeSingle()
  ]);

  if (settingsError || consentError) {
    throw new SecurityError('Unable to load cookie consent status', 500);
  }

  const config = settings || {
    policy_version: '1',
    notice_enabled: true,
    reappear_after_days: 180
  };

  const now = Date.now();
  const validConsent = consent &&
    consent.policy_version === config.policy_version &&
    (!consent.expires_at || new Date(consent.expires_at).getTime() > now);

  return res.status(200).json({
    show_notice: Boolean(config.notice_enabled && !validConsent),
    policy_version: config.policy_version,
    reappear_after_days: config.reappear_after_days,
    consent: validConsent ? {
      preferences: consent.preferences,
      analytics: consent.analytics,
      marketing: consent.marketing,
      consented_at: consent.consented_at,
      expires_at: consent.expires_at
    } : null
  });
}

async function saveConsent(body, res, ctx) {
  const preferences = body?.preferences === true;
  const analytics = body?.analytics === true;
  const marketing = body?.marketing === true;

  const { data: settings, error: settingsError } = await supabase
    .from('cookie_consent_settings')
    .select('policy_version,reappear_after_days,notice_enabled')
    .eq('id', 'default')
    .maybeSingle();

  if (settingsError || !settings || !settings.notice_enabled) {
    throw new SecurityError('Cookie consent is currently unavailable', 503);
  }

  const consentedAt = new Date().toISOString();
  const expiresAt = getExpiry(consentedAt, settings.reappear_after_days);

  const { error } = await supabase
    .from('cookie_consents')
    .upsert({
      user_id: ctx.userId,
      policy_version: settings.policy_version,
      essential: true,
      preferences,
      analytics,
      marketing,
      consented_at: consentedAt,
      expires_at: expiresAt,
      updated_at: consentedAt
    }, { onConflict: 'user_id' });

  if (error) throw new SecurityError('Unable to save cookie preferences', 500);

  return res.status(200).json({
    saved: true,
    policy_version: settings.policy_version,
    expires_at: expiresAt,
    consent: { preferences, analytics, marketing }
  });
}
