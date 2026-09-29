/* lib/observability.js */

const SLOW_REQUEST_MS = Math.max(250, Number(process.env.OBSERVABILITY_SLOW_MS) || 1000);

function createRequestId(req) {
  const incoming = req.headers['x-request-id'] || req.headers['x-vercel-id'];
  if (incoming) return String(incoming).slice(0, 160);

  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

function writeEvent(level, event) {
  const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    service: 'aliver-biopharma-api',
    ...event
  });

  if (level === 'warn') console.warn('[OBSERVABILITY]', payload);
  else if (level === 'error') console.error('[OBSERVABILITY]', payload);
  else console.log('[OBSERVABILITY]', payload);
}

export function startRequestTelemetry(req, res, context = {}) {
  const startedAt = process.hrtime.bigint();
  const requestId = createRequestId(req);
  let finished = false;

  res.setHeader('X-Request-ID', requestId);

  const finish = () => {
    if (finished) return;
    finished = true;

    const durationMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const status = Number(res.statusCode) || 200;
    const level = status >= 500 ? 'error' : durationMs >= SLOW_REQUEST_MS ? 'warn' : 'info';

    writeEvent(level, {
      event: 'request.completed',
      request_id: requestId,
      method: req.method || 'UNKNOWN',
      route: '/api/server',
      module: context.module || null,
      path: context.path || null,
      status,
      duration_ms: Math.round(durationMs * 100) / 100,
      slow: durationMs >= SLOW_REQUEST_MS,
      cold_start_age_ms: Math.round(process.uptime() * 1000)
    });
  };

  if (typeof res.once === 'function') res.once('finish', finish);
  if (typeof res.once === 'function') res.once('close', finish);

  return { requestId, finish };
}

export function logMetric(event, fields = {}) {
  writeEvent('info', {
    event,
    ...fields
  });
}
