import { supabase } from './core.js';
import { parseAndValidateBody, SecurityError } from './security-middleware.js';

const consentCache = new Map();
const CONSENT_CACHE_MS = 5 * 60 * 1000;
const PAGE_MAX_LENGTH = 255;

function normalizePagePath(value) {
  if (typeof value !== 'string') throw new SecurityError('A page path is required.', 400);
  const raw = value.trim();
  if (!raw.startsWith('/') || raw.length > 1000 || /[\u0000-\u001F]/.test(raw)) {
    throw new SecurityError('Invalid page path.', 400);
  }

  const pathOnly = raw.split(/[?#]/, 1)[0] || '/';
  const normalized = pathOnly
    .replace(/\/{2,}/g, '/')
    .replace(/\/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, '/:id')
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/$/, '') || '/';

  if (normalized.startsWith('/api/') || normalized.startsWith('/assets/')) {
    throw new SecurityError('This route is not tracked as a page view.', 400);
  }

  return normalized.slice(0, PAGE_MAX_LENGTH);
}

async function hasAnalyticsConsent(userId) {
  const cached = consentCache.get(userId);
  if (cached && Date.now() - cached.checkedAt < CONSENT_CACHE_MS) return cached.allowed;

  const [{ data: settings, error: settingsError }, { data: consent, error: consentError }] = await Promise.all([
    supabase.from('cookie_consent_settings')
      .select('policy_version, notice_enabled')
      .eq('id', 'default')
      .maybeSingle(),
    supabase.from('cookie_consents')
      .select('policy_version, analytics, expires_at')
      .eq('user_id', userId)
      .maybeSingle()
  ]);

  if (settingsError || consentError) throw new SecurityError('Unable to verify analytics consent.', 503);

  const valid = Boolean(
    settings?.notice_enabled !== false
    && consent?.analytics === true
    && consent?.policy_version === (settings?.policy_version || '1')
    && (!consent?.expires_at || new Date(consent.expires_at).getTime() > Date.now())
  );

  if (valid) consentCache.set(userId, { allowed: true, checkedAt: Date.now() });
  else consentCache.delete(userId);
  return valid;
}

export async function handler(req, res, path, ctx) {
  if (req.method !== 'POST' || path !== 'track_page_view') {
    throw new SecurityError('Invalid action.', 405);
  }

  const body = await parseAndValidateBody(req);
  if (!ctx?.userId) {
    return res.status(200).json({ tracked: false, reason: 'authenticated_analytics_consent_required' });
  }

  const page = normalizePagePath(body.page);
  if (!await hasAnalyticsConsent(ctx.userId)) {
    return res.status(200).json({ tracked: false, reason: 'analytics_consent_required' });
  }

  const duplicateSince = new Date(Date.now() - 30 * 1000).toISOString();
  const { data: recent, error: lookupError } = await supabase
    .from('page_activity')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('page', page)
    .gte('created_at', duplicateSince)
    .limit(1)
    .maybeSingle();

  if (lookupError) throw new SecurityError('Unable to check recent page activity.', 503);
  if (recent) return res.status(200).json({ tracked: false, reason: 'duplicate_view_window' });

  const { error } = await supabase.from('page_activity').insert({
    user_id: ctx.userId,
    page,
    metadata: { source: 'spa_route_tracker', consent: 'analytics', version: 1 },
    is_anonymous: false
  });

  if (error) {
    console.error('[PAGE_ACTIVITY_WRITE_FAILED]', error.code || 'unknown');
    throw new SecurityError('Unable to record this page view.', 503);
  }

  return res.status(200).json({ tracked: true });
}
