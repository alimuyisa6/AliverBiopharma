import crypto from 'crypto';
import { supabase } from './core.js';
const EVENT_TIMEOUT_MS = 3000;
function matchesEvent(events, eventType) { const list = Array.isArray(events) ? events : []; return list.includes('*') || list.includes(eventType); }
function sign(secret, body) { return crypto.createHmac('sha256', secret).update(body).digest('hex'); }
async function deliver(endpoint, eventType, payload) {
  const body = JSON.stringify({ id: crypto.randomUUID(), type: eventType, created_at: new Date().toISOString(), data: payload });
  const signature = sign(endpoint.secret, body); let status = 'failed'; let responseStatus = null; let responseBody = null; const started = Date.now();
  try {
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), EVENT_TIMEOUT_MS);
    const response = await fetch(endpoint.url, { method: 'POST', headers: { 'Content-Type': 'application/json', 'User-Agent': 'AliverBiopharm-Webhooks/1.0', 'X-Aliver-Event': eventType, 'X-Aliver-Signature-256': 'sha256=' + signature }, body, signal: controller.signal });
    clearTimeout(timer); responseStatus = response.status; responseBody = (await response.text()).slice(0, 2000); status = response.ok ? 'delivered' : 'failed';
  } catch (error) { responseBody = String(error?.message || 'Delivery failed').slice(0, 2000); }
  await supabase.from('webhook_deliveries').insert({ webhook_id: endpoint.id, event_type: eventType, payload: JSON.parse(body), status, response_status: responseStatus, response_body: responseBody, duration_ms: Date.now() - started, attempts: 1, delivered_at: status === 'delivered' ? new Date().toISOString() : null });
  await supabase.from('webhook_endpoints').update({ last_delivery_status: responseStatus ? String(responseStatus) : status, last_delivery_at: new Date().toISOString() }).eq('id', endpoint.id);
}
export async function dispatchWebhookEvent(userId, eventType, payload = {}) {
  if (!userId || !eventType) return;
  const { data: endpoints, error } = await supabase.from('webhook_endpoints').select('id,url,secret,events').eq('user_id', userId).eq('is_active', true);
  if (error || !Array.isArray(endpoints) || !endpoints.length) return;
  const matching = endpoints.filter((endpoint) => matchesEvent(endpoint.events, eventType));
  await Promise.allSettled(matching.map((endpoint) => deliver(endpoint, eventType, payload)));
}