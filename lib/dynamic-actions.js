/* lib/dynamic-actions.js
 * Server-side dynamic action configuration and resolved action state.
 *
 * Configuration controls presentation/availability only. Authorization is
 * resolved independently by lib/authorization.js.
 */
import { supabase } from './core.js';
import { getUserCurriculumScope } from './curriculum.js';
import { resolveActionAccess } from './authorization.js';
import { SecurityError } from './security-middleware.js';

function nowInSchedule(row, now = Date.now()) {
  if (row.starts_at && new Date(row.starts_at).getTime() > now) return false;
  if (row.ends_at && new Date(row.ends_at).getTime() <= now) return false;
  return true;
}

function includesScope(values, value) {
  if (!Array.isArray(values) || values.length === 0) return true;
  if (value === null || value === undefined) return false;
  return values.some((item) => String(item) === String(value));
}

function sanitizeAction(row) {
  return {
    id: row.id,
    action_key: row.action_key,
    label: row.label,
    description: row.description || null,
    action_type: row.action_type,
    destination: row.destination || null,
    icon: row.icon || null,
    variant: row.variant,
    page_id: row.page_id || null,
    is_enabled: row.is_enabled === true,
    visibility_mode: row.visibility_mode,
    auth_required: row.auth_required === true,
    requires_premium: row.requires_premium === true,
    required_role: row.required_role || null,
    content_type: row.content_type || null,
    content_id: row.content_id || null,
    starts_at: row.starts_at || null,
    ends_at: row.ends_at || null,
    display_order: row.display_order ?? 0,
    config: row.config && typeof row.config === 'object' ? row.config : {}
  };
}

async function loadActions(pageId) {
  let query = supabase
    .from('dynamic_actions')
    .select('*')
    .eq('is_enabled', true)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (pageId) query = query.eq('page_id', pageId);

  const { data, error } = await query;
  if (error) throw new SecurityError('Action configuration lookup failed', 500);
  return data || [];
}

async function resolveConfiguredAction(ctx, row, scope) {
  const action = sanitizeAction(row);

  if (!nowInSchedule(row)) {
    return {
      ...action,
      visible: false,
      enabled: false,
      authorized: false,
      premium_authorized: false,
      reason: 'outside_schedule'
    };
  }

  if (!includesScope(row.level_ids, scope?.active_level_id)) {
    return {
      ...action,
      visible: false,
      enabled: false,
      authorized: false,
      premium_authorized: false,
      reason: 'level_scope'
    };
  }

  if (!includesScope(row.group_ids, scope?.active_group_id)) {
    return {
      ...action,
      visible: false,
      enabled: false,
      authorized: false,
      premium_authorized: false,
      reason: 'group_scope'
    };
  }

  if (row.required_role && row.required_role !== 'admin') {
    return {
      ...action,
      visible: false,
      enabled: false,
      authorized: false,
      premium_authorized: false,
      reason: 'role_scope'
    };
  }

  if (row.required_role === 'admin' && !ctx?.adminData) {
    return {
      ...action,
      visible: false,
      enabled: false,
      authorized: false,
      premium_authorized: false,
      reason: 'role_required'
    };
  }

  const access = await resolveActionAccess(ctx, {
    actionKey: row.action_key,
    contentType: row.content_type,
    contentId: row.content_id,
    requiresAuth: row.auth_required === true,
    requiresPremium: row.requires_premium === true,
    restrictionType: 'view'
  });

  const visible = row.visibility_mode !== 'hidden' && (
    access.authorized ||
    row.visibility_mode === 'locked' ||
    row.visibility_mode === 'disabled' ||
    access.reason === 'premium_required' ||
    access.reason === 'unauthenticated'
  );

  return {
    ...action,
    visible,
    enabled: access.authorized && row.visibility_mode !== 'disabled',
    authorized: access.authorized,
    premium_authorized: access.premium_authorized === true,
    reason: access.reason || null,
    premium_source: access.premium_source || null,
    premium_expires_at: access.premium_expires_at || null
  };
}

export async function getResolvedActions(ctx, { pageId = null } = {}) {
  const rows = await loadActions(pageId);
  const scope = ctx?.authenticated ? await getUserCurriculumScope(ctx.userId) : null;

  return Promise.all(rows.map((row) => resolveConfiguredAction(ctx, row, scope)));
}

export async function handler(req, res, path, ctx) {
  if (req.method !== 'GET') return false;

  const pageId = typeof req.query?.page_id === 'string'
    ? req.query.page_id.trim().slice(0, 100)
    : null;

  const actions = await getResolvedActions(ctx, { pageId });

  res.setHeader('Cache-Control', 'private, no-store');
  res.status(200).json({
    actions,
    total: actions.length
  });

  return true;
}
