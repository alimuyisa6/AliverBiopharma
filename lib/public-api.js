import crypto from 'crypto';
import { supabase, getClientIp } from './core.js';
const RATE_WINDOW_MS = 60000;
const RATE_LIMIT = 120;
const rateBuckets = new Map();
function apiError(message, status = 400) { const error = new Error(message); error.statusCode = status; return error; }
function getApiKey(req) { const header = req.headers['x-api-key'] || req.headers.authorization || ''; return String(header).replace(/^Bearer\s+/i, '').trim() || null; }
function consumeRateLimit(key, ip) { const now = Date.now(); const bucketKey = key + ':' + ip; const current = rateBuckets.get(bucketKey); if (!current || now - current.startedAt >= RATE_WINDOW_MS) { rateBuckets.set(bucketKey, { startedAt: now, count: 1 }); return true; } current.count += 1; return current.count <= RATE_LIMIT; }
async function authenticateApiKey(req) {
  const rawKey = getApiKey(req);
  if (!rawKey || !/^sk_live_[a-f0-9]{48}$/.test(rawKey)) throw apiError('A valid API key is required.', 401);
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const { data, error } = await supabase.from('api_keys').select('id,user_id,name,key_prefix,scopes,is_active,revoked_at,last_used_at').eq('key_hash', hash).maybeSingle();
  if (error) throw apiError('Unable to authenticate API key.', 500);
  if (!data || !data.is_active || data.revoked_at) throw apiError('API key is invalid or revoked.', 401);
  if (!consumeRateLimit(data.id, getClientIp(req))) throw apiError('API rate limit exceeded. Please retry later.', 429);
  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', data.id);
  return data;
}
function requireScope(key, scope) { const scopes = Array.isArray(key.scopes) ? key.scopes : []; if (!scopes.includes(scope) && !scopes.includes('*')) throw apiError('API key does not have the required scope.', 403); }
export async function handler(req, res, path) {
  if (req.method !== 'GET') throw apiError('Method not allowed.', 405);
  const key = await authenticateApiKey(req);
  if (path === 'me') {
    requireScope(key, 'read');
    const { data, error } = await supabase.from('user_profiles').select('user_id,display_name,full_name,track,class_name,active_level_id,active_group_id,language,timezone,is_active,created_at,updated_at').eq('user_id', key.user_id).maybeSingle();
    if (error) throw apiError('Unable to load profile.', 500);
    if (!data) throw apiError('Profile not found.', 404);
    return res.status(200).json({ data });
  }
  if (path === 'curriculum/levels') {
    requireScope(key, 'read');
    const { data, error } = await supabase.from('curriculum_levels').select('id,display_name,kind,group_label,unit_label,icon,color,display_order').order('display_order', { ascending: true });
    if (error) throw apiError('Unable to load curriculum levels.', 500);
    return res.status(200).json({ data: data || [] });
  }
  if (path === 'api-key') return res.status(200).json({ data: { id: key.id, name: key.name, key_prefix: key.key_prefix, scopes: key.scopes, last_used_at: key.last_used_at || null } });
  throw apiError('Unknown API endpoint.', 404);
}