import { supabase } from './core.js';
import { parseAndValidateBody, requireAdmin, requireSuperAdmin, SecurityError } from './security-middleware.js';

const DEFAULT_TITLE = 'AliverBiopharm is under maintenance';
const DEFAULT_MESSAGE = 'We are carrying out scheduled maintenance. Please check back shortly.';
const DEFAULT_ALERT_TITLE = 'Scheduled maintenance';
const DEFAULT_ALERT_MESSAGE = 'Maintenance is scheduled soon. Please save your work and prepare to pause your session.';

function clean(value, max = 500) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function normalizePath(value) {
  const path = clean(value, 300) || '/';
  if (!path.startsWith('/') || path.includes('?',) || path.includes('#') || /[\u0000-\u001F\u007F]/.test(path)) return '';
  if (path.length > 1 && path.endsWith('/')) return path.slice(0, -1);
  return path;
}

function validBoundaryKey(value) {
  return /^[a-z0-9][a-z0-9._:-]{0,159}$/i.test(value);
}

function routeMatches(targetPath, route) {
  if (!targetPath) return false;
  const target = targetPath.trim();
  const current = normalizePath(route) || '/';
  return target === '/' ? current === '/' : current === target || current.startsWith(target + '/');
}

function activeWindow(row, now = Date.now()) {
  if (!row?.enabled) return false;
  const starts = row.starts_at ? new Date(row.starts_at).getTime() : null;
  const ends = row.ends_at ? new Date(row.ends_at).getTime() : null;
  return Number.isFinite(starts ?? now) && Number.isFinite(ends ?? now) &&
    (!starts || starts <= now) && (!ends || ends > now);
}

export async function getActiveMaintenance(req) {
  const route = normalizePath(req.headers['x-app-route'] || req.query?.route || '/') || '/';
  const rawBoundaryKey = clean(req.query?.boundary_key || req.headers['x-maintenance-boundary'] || '', 160);
  const boundaryKey = validBoundaryKey(rawBoundaryKey) ? rawBoundaryKey : '';

  const { data, error } = await supabase
    .from('maintenance_controls')
    .select('scope_type,target_path,boundary_key,enabled,starts_at,ends_at,title,message,alert_enabled,alert_at,alert_title,alert_message,updated_at')
    .eq('enabled', true);

  if (error) return { blocked: false, unavailable: true, data: null };

  const now = Date.now();
  const rows = (data || []).filter((row) => activeWindow(row, now));
  const matched = rows.find((row) =>
    row.scope_type === 'whole_site' ||
    (row.scope_type === 'page' && routeMatches(row.target_path, route)) ||
    (row.scope_type === 'boundary' && boundaryKey && row.boundary_key === boundaryKey)
  );

  if (!matched) {
    const upcoming = (data || []).find((row) => {
      const starts = row.starts_at ? new Date(row.starts_at).getTime() : null;
      const alertAt = row.alert_at ? new Date(row.alert_at).getTime() : null;
      const applies =
        row.scope_type === 'whole_site' ||
        (row.scope_type === 'page' && routeMatches(row.target_path, route)) ||
        (row.scope_type === 'boundary' && boundaryKey && row.boundary_key === boundaryKey);
      return applies && row.alert_enabled && Number.isFinite(starts) && Number.isFinite(alertAt) && starts > now && alertAt <= now;
    });
    if (!upcoming) return { blocked: false, data: null };
    return {
      blocked: false,
      data: {
        upcoming: true,
        scope_type: upcoming.scope_type,
        target_path: upcoming.target_path,
        boundary_key: upcoming.boundary_key,
        title: upcoming.alert_title || DEFAULT_ALERT_TITLE,
        message: upcoming.alert_message || DEFAULT_ALERT_MESSAGE,
        starts_at: upcoming.starts_at,
        ends_at: upcoming.ends_at,
        updated_at: upcoming.updated_at
      }
    };
  }

  return {
    blocked: true,
    message: matched.message || DEFAULT_MESSAGE,
    data: {
      active: true,
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
    if (result.unavailable) {
      return res.status(503).json({
        active: false,
        upcoming: false,
        blocked: false,
        state: 'unknown',
        unavailable: true,
        checked_at: new Date().toISOString()
      });
    }
    return res.status(200).json({
      active: Boolean(result.blocked),
      upcoming: Boolean(result.data?.upcoming),
      blocked: Boolean(result.blocked),
      state: result.blocked ? 'active' : result.data?.upcoming ? 'scheduled' : 'operational',
      checked_at: new Date().toISOString(),
      ...(result.data || {})
    });
  }

  requireAdmin(ctx);
  requireSuperAdmin(ctx);

  if (req.method === 'GET' && path === 'list') return listControls(res);
  if (req.method === 'GET' && path === 'history') return listHistory(req, res);
  if (req.method === 'POST' && path === 'save') return saveControl(req, res, ctx);
  if (req.method === 'POST' && path === 'start-now') return startNow(req, res, ctx);
  if (req.method === 'POST' && path === 'disable') return disableControl(req, res, ctx);

  throw new SecurityError('Invalid action', 400);
}

async function listHistory(req, res) {
  const rawLimit = Number(req.query?.limit || 100);
  const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? Math.floor(rawLimit) : 100, 1), 200);
  const { data, error } = await supabase
    .from('maintenance_control_history')
    .select('id,control_id,action,changed_by,previous_state,new_state,created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw new SecurityError('Unable to load maintenance history', 500);
  return res.status(200).json({ history: data || [] });
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

function validateScope(scopeType, targetPath, boundaryKey) {
  if (!['whole_site', 'page', 'boundary'].includes(scopeType)) throw new SecurityError('Invalid maintenance scope', 400);
  if (scopeType === 'page' && !targetPath) throw new SecurityError('A valid page path is required', 400);
  if (scopeType === 'boundary' && (!boundaryKey || !validBoundaryKey(boundaryKey))) {
    throw new SecurityError('Boundary key may contain only letters, numbers, dots, underscores, colons, and hyphens', 400);
  }
}

function parseSchedule(body) {
  const startsAt = body.starts_at ? new Date(body.starts_at) : null;
  const endsAt = body.ends_at ? new Date(body.ends_at) : null;
  const alertAt = body.alert_at ? new Date(body.alert_at) : null;

  if (startsAt && Number.isNaN(startsAt.getTime())) throw new SecurityError('Invalid maintenance start time', 400);
  if (endsAt && Number.isNaN(endsAt.getTime())) throw new SecurityError('Invalid maintenance end time', 400);
  if (alertAt && Number.isNaN(alertAt.getTime())) throw new SecurityError('Invalid alert time', 400);
  if (startsAt && endsAt && endsAt <= startsAt) throw new SecurityError('Maintenance end must be after start', 400);
  if (alertAt && !startsAt) throw new SecurityError('An alert time requires a scheduled maintenance start time', 400);
  if (alertAt && startsAt && alertAt >= startsAt) throw new SecurityError('Alert time must be before maintenance starts', 400);

  return { startsAt, endsAt, alertAt };
}

async function findExisting(scopeType, targetPath, boundaryKey) {
  let query = supabase.from('maintenance_controls').select('*').eq('scope_type', scopeType);
  if (scopeType === 'page') query = query.eq('target_path', targetPath);
  if (scopeType === 'boundary') query = query.eq('boundary_key', boundaryKey);
  const { data, error } = await query.maybeSingle();
  if (error) throw new SecurityError('Unable to load maintenance control', 500);
  return data || null;
}

async function saveControl(req, res, ctx) {
  const body = await parseAndValidateBody(req);
  const scopeType = clean(body.scope_type, 30);
  const targetPath = scopeType === 'page' ? normalizePath(body.target_path) : null;
  const boundaryKey = scopeType === 'boundary' ? clean(body.boundary_key, 160) : null;
  validateScope(scopeType, targetPath, boundaryKey);

  const { startsAt, endsAt, alertAt } = parseSchedule(body);
  const existingControl = await findExisting(scopeType, targetPath, boundaryKey);

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
  if (existingControl?.id) query = query.update(payload).eq('id', existingControl.id);
  else query = query.insert(payload);

  const { data: saved, error } = await query.select('*').single();
  if (error) throw new SecurityError('Unable to save maintenance control', 500);

  return res.status(200).json({ success: true, control: saved });
}

async function startNow(req, res, ctx) {
  const body = await parseAndValidateBody(req);
  const scopeType = clean(body.scope_type, 30) || 'whole_site';
  const targetPath = scopeType === 'page' ? normalizePath(body.target_path) : null;
  const boundaryKey = scopeType === 'boundary' ? clean(body.boundary_key, 160) : null;
  validateScope(scopeType, targetPath, boundaryKey);

  const existingControl = await findExisting(scopeType, targetPath, boundaryKey);
  const now = new Date().toISOString();
  const payload = {
    scope_type: scopeType,
    target_path: scopeType === 'page' ? targetPath : null,
    boundary_key: scopeType === 'boundary' ? boundaryKey : null,
    enabled: true,
    starts_at: now,
    ends_at: null,
    alert_enabled: false,
    alert_at: null,
    title: clean(body.title, 160) || DEFAULT_TITLE,
    message: clean(body.message, 1000) || DEFAULT_MESSAGE,
    alert_title: clean(body.alert_title, 160) || DEFAULT_ALERT_TITLE,
    alert_message: clean(body.alert_message, 1000) || DEFAULT_ALERT_MESSAGE,
    updated_by: ctx.userId,
    updated_at: now
  };

  let query = supabase.from('maintenance_controls');
  if (existingControl?.id) query = query.update(payload).eq('id', existingControl.id);
  else query = query.insert(payload);

  const { data: saved, error } = await query.select('*').single();
  if (error) throw new SecurityError('Unable to start emergency maintenance', 500);

  return res.status(200).json({ success: true, emergency: true, control: saved });
}

async function disableControl(req, res, ctx) {
  const body = await parseAndValidateBody(req);
  const controlId = Number(body.id);
  if (!Number.isSafeInteger(controlId) || controlId <= 0) throw new SecurityError('A valid control id is required', 400);

  const { data: existing, error: readError } = await supabase
    .from('maintenance_controls')
    .select('*')
    .eq('id', controlId)
    .maybeSingle();

  if (readError) throw new SecurityError('Unable to load maintenance control', 500);
  if (!existing) throw new SecurityError('Maintenance control not found', 404);

  const { data: disabled, error } = await supabase
    .from('maintenance_controls')
    .update({ enabled: false, updated_by: ctx.userId, updated_at: new Date().toISOString() })
    .eq('id', controlId)
    .select('*')
    .single();

  if (error) throw new SecurityError('Unable to disable maintenance control', 500);

  return res.status(200).json({ success: true, control: disabled });
}
