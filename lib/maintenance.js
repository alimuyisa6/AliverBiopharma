import { supabase } from './core.js';
import { parseAndValidateBody, requireAdmin, requireSuperAdmin, SecurityError } from './security-middleware.js';

const DEFAULT_TITLE = 'AliverBiopharm is under maintenance';
const DEFAULT_MESSAGE = 'We are carrying out scheduled maintenance. Please check back shortly.';
const DEFAULT_ALERT_TITLE = 'Scheduled maintenance';
const DEFAULT_ALERT_MESSAGE = 'Maintenance is scheduled soon. Please save your work and prepare to pause your session.';

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function routeMatches(targetPath, route) {
  if (!targetPath) return false;
  const target = targetPath.trim();
  const current = route || '/';
  return target === '/' ? current === '/' : current === target || current.startsWith(target + '/');
}

function activeWindow(row, now = Date.now()) {
  if (!row?.enabled) return false;
  const starts = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const ends = row.ends_at ? new Date(row.ends_at).getTime() : null;
  return (!starts || starts <= now) && (!ends || ends > now);
}

export async function getActiveMaintenance(req) {
  const route = clean(req.headers['x-app-route'] || req.query?.route || '/', 300) || '/';
  const boundaryKey = clean(req.query?.boundary_key || req.headers['x-maintenance-boundary'] || '', 160);

  const { data, error } = await supabase
    .from('maintenance_controls')
    .select('scope_type,target_path,boundary_key,enabled,starts_at,ends_at,title,message,alert_enabled,alert_at,alert_title,alert_message,updated_at')
    .eq('enabled', true);

  if (error) return { blocked: false, data: null };

  const now = Date.now();
  const rows = (data || []).filter((row) => activeWindow(row, now));
  const matched = rows.find((row) =>
    row.scope_type === 'whole_site' ||
    (row.scope_type === 'page' && routeMatches(row.target_path, route)) ||
    (row.scope_type === 'boundary' && boundaryKey && row.boundary_key === boundaryKey)
  );

  if (!matched) return { blocked: false, data: null };

  return {
    blocked: true,
    message: matched.message || DEFAULT_MESSAGE,
    data: {
      scope_type: matched.scope_type,
      target_path: matched.target_path,
      boundary_key: matched.boundary_key,
      title: matched.title || DEFAULT_TITLE,
      message: matched.message || DEFAULT_MESSAGE,
      starts_at: matched.starts_at,
      ends_at: matched.ends_at,
      updated_at: matched.updated_at
    }
  };
}

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET' && path === 'status') {
    const result = await getActiveMaintenance(req);
    return res.status(200).json(result.data ? { active: true, ...result.data } : { active: false });
  }

  requireAdmin(ctx);
  requireSuperAdmin(ctx);

  if (req.method === 'GET' && path === 'list') return listControls(res);
  if (req.method === 'POST' && path === 'save') return saveControl(req, res, ctx);
  if (req.method === 'POST' && path === 'disable') return disableControl(req, res, ctx);

  throw new SecurityError('Invalid action', 400);
}

async function listControls(res) {
  const { data, error } = await supabase
    .from('maintenance_controls')
    .select('*')
    .order('scope_type')
    .order('target_path')
    .order('boundary_key');

  if (error) throw new SecurityError('Unable to load maintenance controls', 500);
  return res.status(200).json({ controls: data || [] });
}

async function saveControl(req, res, ctx) {
  const body = await parseAndValidateBody(req);
  const scopeType = clean(body.scope_type, 30);
  const targetPath = clean(body.target_path, 300) || null;
  const boundaryKey = clean(body.boundary_key, 160) || null;

  if (!['whole_site','page','boundary'].includes(scopeType)) throw new SecurityError('Invalid maintenance scope', 400);
  if (scopeType === 'page' && !targetPath?.startsWith('/')) throw new SecurityError('A page path is required', 400);
  if (scopeType === 'boundary' && !boundaryKey) throw new SecurityError('A boundary key is required', 400);

  const startsAt = body.starts_at ? new Date(body.starts_at) : null;
  const endsAt = body.ends_at ? new Date(body.ends_at) : null;
  const alertAt = body.alert_at ? new Date(body.alert_at) : null;

  if (startsAt && Number.isNaN(startsAt.getTime())) throw new SecurityError('Invalid maintenance start time', 400);
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new SecurityError('Invalid maintenance end time', 400);
  if (alertAt && Number.isNaN(alertAt.getTime())) throw new SecurityError('Invalid alert time', 400);
  if (startsAt && endsAt && endsAt <= startsAt) throw new SecurityError('Maintenance end must be after start', 400);
  if (alertAt && startsAt && alertAt > startsAt) throw new SecurityError('Alert time must be before maintenance starts', 400);

  const payload = {
    scope_type: scopeType,
    target_path: scopeType === 'page' ? targetPath : null,
    boundary_key: scopeType === 'boundary' ? boundaryKey : null,
    enabled: body.enabled !== false,
    starts_at: startsAt?.toISOString() || null,
    ends_at: endsAt?.toISOString() || null,
    alert_enabled: body.alert_enabled !== false,
    alert_at: alertAt?.toISOString() || null,
    title: clean(body.title, 160) || DEFAULT_TITLE,
    message: clean(body.message, 1000) || DEFAULT_MESSAGE,
    alert_title: clean(body.alert_title, 160) || DEFAULT_ALERT_TITLE,
    alert_message: clean(body.alert_message, 1000) || DEFAULT_ALERT_MESSAGE,
    updated_by: ctx.userId,
    updated_at: new Date().toISOString()
  };

  let query = supabase.from('maintenance_controls');
  if (scopeType === 'whole_site') {
    const { data: existing } = await supabase.from('maintenance_controls')
      .select('id').eq('scope_type', 'whole_site').maybeSingle();
    if (existing?.id) query = query.update(payload).eq('id', existing.id);
    else query = query.insert(payload);
  } else {
    const { data: existing } = await supabase.from('maintenance_controls')
      .select('id')
      .eq('scope_type', scopeType)
      .eq(scopeType === 'page' ? 'target_path' : 'boundary_key', scopeType === 'page' ? targetPath : boundaryKey)
      .maybeSingle();
    if (existing?.id) {
      query = query.update(payload).eq('id', existing.id);
    } else {
      query = query.insert(payload);
    }
  }

  const { error } = await query;
  if (error) throw new SecurityError('Unable to save maintenance control', 500);

  return res.status(200).json({ success: true });
}

async function disableControl(req, res, ctx) {
  const body = await parseAndValidateBody(req);
  if (!body.id) throw new SecurityError('Control id required', 400);

  const { error } = await supabase
    .from('maintenance_controls')
    .update({ enabled: false, updated_by: ctx.userId, updated_at: new Date().toISOString() })
    .eq('id', body.id);

  if (error) throw new SecurityError('Unable to disable maintenance control', 500);
  return res.status(200).json({ success: true });
}
