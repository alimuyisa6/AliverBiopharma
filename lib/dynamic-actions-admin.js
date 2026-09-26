import { supabase } from './core.js';
import { parseAndValidateBody, requireSuperAdmin, SecurityError } from './security-middleware.js';

const ACTION_TYPES = new Set(['link','button','menu','download','modal','custom']);
const VISIBILITY = new Set(['visible','hidden','locked','disabled','coming_soon']);

function validateAction(body, partial = false) {
  if (!partial || body.action_key !== undefined) {
    if (typeof body.action_key !== 'string' || !/^[a-z0-9][a-z0-9_.-]{1,99}$/.test(body.action_key.trim())) {
      throw new SecurityError('Invalid action_key', 400);
    }
  }
  if (!partial || body.label !== undefined) {
    if (typeof body.label !== 'string' || !body.label.trim() || body.label.length > 200) {
      throw new SecurityError('Invalid label', 400);
    }
  }
  if (body.action_type !== undefined && !ACTION_TYPES.has(body.action_type)) throw new SecurityError('Invalid action_type', 400);
  if (body.visibility_mode !== undefined && !VISIBILITY.has(body.visibility_mode)) throw new SecurityError('Invalid visibility_mode', 400);
  if (body.required_role !== undefined && body.required_role !== null && typeof body.required_role !== 'string') throw new SecurityError('Invalid required_role', 400);
  for (const key of ['level_ids','group_ids']) {
    if (body[key] !== undefined && (!Array.isArray(body[key]) || body[key].some(v => typeof v !== 'string'))) throw new SecurityError(`Invalid ${key}`, 400);
  }
  if (body.content_type !== undefined && body.content_type !== null && typeof body.content_type !== 'string') throw new SecurityError('Invalid content_type', 400);
  if (body.content_id !== undefined && body.content_id !== null && typeof body.content_id !== 'string') throw new SecurityError('Invalid content_id', 400);
  if (body.config !== undefined && (!body.config || typeof body.config !== 'object' || Array.isArray(body.config))) throw new SecurityError('Invalid config', 400);
}

export async function handler(req, res, path, ctx) {
  requireSuperAdmin(ctx);

  if (req.method === 'GET') {
    if (path !== 'list') throw new SecurityError('Invalid action', 400);
    const { data, error } = await supabase.from('dynamic_actions').select('*').order('display_order').order('created_at');
    if (error) throw new SecurityError('Failed to fetch dynamic actions', 500);
    return res.status(200).json(data || []);
  }

  if (req.method !== 'POST') throw new SecurityError('Method not allowed', 405);

  const body = await parseAndValidateBody(req);

  if (path === 'create') {
    validateAction(body);
    const { action_key, label, ...rest } = body;
    const { data, error } = await supabase
      .from('dynamic_actions')
      .insert({ action_key: action_key.trim(), label: label.trim(), ...rest })
      .select('*')
      .single();

    if (error) {
      throw new SecurityError(
        error.code === '23505' ? 'action_key already exists' : 'Failed to create action',
        error.code === '23505' ? 409 : 500
      );
    }

    return res.status(201).json(data);
  }

  if (path === 'update') {
    if (typeof body.id !== 'string' || !body.id.trim()) throw new SecurityError('id required', 400);

    // Updates are merged with the stored record so immutable fields cannot fail
    // validation merely because a client omitted or nullified them.
    const { data: existing, error: fetchError } = await supabase
      .from('dynamic_actions')
      .select('*')
      .eq('id', body.id)
      .maybeSingle();

    if (fetchError) throw new SecurityError('Failed to load dynamic action', 500);
    if (!existing) throw new SecurityError('Dynamic action not found', 404);

    const candidate = { ...existing, ...body };
    validateAction(candidate, false);

    const allowed = [
      'action_key','label','description','action_type','destination','icon','variant',
      'page_id','is_enabled','visibility_mode','auth_required','requires_premium',
      'required_role','level_ids','group_ids','content_type','content_id',
      'starts_at','ends_at','display_order','config'
    ];

    const updates = Object.fromEntries(
      allowed
        .filter(k => body[k] !== undefined)
        .map(k => [k, k === 'label' || k === 'action_key' ? body[k].trim() : body[k]])
    );

    if (!Object.keys(updates).length) throw new SecurityError('No changes supplied', 400);

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('dynamic_actions')
      .update(updates)
      .eq('id', body.id)
      .select('*')
      .single();

    if (error) {
      throw new SecurityError(
        error.code === '23505' ? 'action_key already exists' : 'Failed to update action',
        error.code === '23505' ? 409 : 500
      );
    }

    return res.status(200).json(data);
  }

  if (path === 'delete') {
    if (typeof body.id !== 'string' || !body.id.trim()) throw new SecurityError('id required', 400);
    const { error } = await supabase.from('dynamic_actions').delete().eq('id', body.id);
    if (error) throw new SecurityError('Failed to delete action', 500);
    return res.status(200).json({ success: true });
  }

  throw new SecurityError('Invalid action', 400);
}
