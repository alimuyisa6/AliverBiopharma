import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminSessionReferenceHash,
  verifyAdminSessionReferenceHash
} from '../lib/admin-session-reference.js';

process.env.ADMIN_SESSION_REFERENCE_SECRET = 'security-test-secret-'.repeat(4);

const binding = {
  email: 'ADMIN@ALIVERBIOPHARM.COM',
  userId: 'user-123',
  sessionId: 'session-456',
  deviceId: 'device-789'
};

test('admin reference hash is stable for one complete binding', () => {
  const first = createAdminSessionReferenceHash(binding);
  const second = createAdminSessionReferenceHash({
    ...binding,
    email: 'admin@aliverbiopharm.com'
  });

  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(first, second);
  assert.equal(verifyAdminSessionReferenceHash(first, binding), true);
});

test('admin reference hash rejects a different email', () => {
  const hash = createAdminSessionReferenceHash(binding);
  assert.equal(verifyAdminSessionReferenceHash(hash, {
    ...binding,
    email: 'another@example.com'
  }), false);
});

test('admin reference hash rejects a different user, session, or device', () => {
  const hash = createAdminSessionReferenceHash(binding);

  for (const changed of [
    { ...binding, userId: 'another-user' },
    { ...binding, sessionId: 'another-session' },
    { ...binding, deviceId: 'another-device' }
  ]) {
    assert.equal(verifyAdminSessionReferenceHash(hash, changed), false);
  }
});

test('admin reference hash rejects malformed or absent stored hashes', () => {
  assert.equal(verifyAdminSessionReferenceHash('not-a-hash', binding), false);
  assert.equal(verifyAdminSessionReferenceHash(null, binding), false);
});
