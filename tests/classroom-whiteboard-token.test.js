import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

process.env.SUPABASE_URL = 'https://whiteboard-test.supabase.co';
process.env.SUPABASE_ANON_KEY = 'test-publishable-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET = 'test-only-signing-secret-with-sufficient-entropy';

const { createRealtimeAccessToken } = await import('../lib/core.js');

function decodeToken(token) {
  const [header, payload, signature] = token.split('.');
  return {
    header: JSON.parse(Buffer.from(header, 'base64url').toString('utf8')),
    payload: JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')),
    signature,
    unsigned: `${header}.${payload}`
  };
}

test('whiteboard realtime token is a short-lived authenticated user JWT', () => {
  const before = Math.floor(Date.now() / 1000);
  const token = createRealtimeAccessToken('d2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f', 240, 'e2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f');
  const decoded = decodeToken(token);

  assert.equal(decoded.header.alg, 'HS256');
  assert.equal(decoded.payload.sub, 'd2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f');
  assert.equal(decoded.payload.role, 'authenticated');
  assert.equal(decoded.payload.aud, 'authenticated');
  assert.equal(decoded.payload.room_id, 'e2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f');
  assert.ok(decoded.payload.iat >= before && decoded.payload.iat <= before + 1);
  assert.equal(decoded.payload.exp - decoded.payload.iat, 240);

  const expected = crypto.createHmac('sha256', process.env.SUPABASE_JWT_SECRET)
    .update(decoded.unsigned)
    .digest('base64url');
  assert.equal(decoded.signature, expected);
});

test('whiteboard realtime token lifetime is capped at fifteen minutes', () => {
  const token = createRealtimeAccessToken('d2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f', 3600, 'e2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f');
  const { payload } = decodeToken(token);
  assert.equal(payload.exp - payload.iat, 900);
});

test('whiteboard realtime token falls back to a safe lifetime for invalid input', () => {
  const token = createRealtimeAccessToken('d2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f', Number.NaN);
  const { payload } = decodeToken(token);
  assert.equal(payload.exp - payload.iat, 600);
});

test('whiteboard realtime token refuses a missing user or signing secret', () => {
  assert.throws(() => createRealtimeAccessToken(null), /not configured/);
  const secret = process.env.SUPABASE_JWT_SECRET;
  delete process.env.SUPABASE_JWT_SECRET;
  assert.throws(() => createRealtimeAccessToken('d2719d2b-54f0-4f55-8f0a-0b0a1c2d3e4f'), /not configured/);
  process.env.SUPABASE_JWT_SECRET = secret;
});
