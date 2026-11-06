import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createAdminSessionReferenceHash,
  verifyAdminSessionReferenceHash,
  verifyAdminDeviceRecoveryCode,
  isAdminDeviceBindingCurrent
} from '../lib/admin-session-reference.js';

process.env.ADMIN_SESSION_REFERENCE_SECRET = 'security-test-secret-'.repeat(4);
const approvalCode = '123456789012345678901234567890123456789012345678';
process.env.ADMIN_DEVICE_APPROVAL_CODES = JSON.stringify({
  'admin@aliverbiopharm.com': approvalCode
});

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

test('admin reference hash accepts the configured single 48-digit code and binds it to email', () => {
  process.env.ADMIN_DEVICE_APPROVAL_CODES = approvalCode;
  const hash = createAdminSessionReferenceHash(binding);
  assert.equal(verifyAdminSessionReferenceHash(hash, binding), true);
  assert.equal(verifyAdminSessionReferenceHash(hash, { ...binding, email: 'another@example.com' }), false);
  process.env.ADMIN_DEVICE_APPROVAL_CODES = JSON.stringify({
    'admin@aliverbiopharm.com': approvalCode
  });
});

test('admin reference hash rejects a changed email-bound 48-digit approval code', () => {
  const hash = createAdminSessionReferenceHash(binding);
  process.env.ADMIN_DEVICE_APPROVAL_CODES = JSON.stringify({
    'admin@aliverbiopharm.com': '987654321098765432109876543210987654321098765432'
  });

  assert.equal(verifyAdminSessionReferenceHash(hash, binding), false);

  process.env.ADMIN_DEVICE_APPROVAL_CODES = JSON.stringify({
    'admin@aliverbiopharm.com': approvalCode
  });
});

test('admin reference hash rejects missing, malformed, or wrongly sized approval codes', () => {
  const original = process.env.ADMIN_DEVICE_APPROVAL_CODES;

  for (const value of [
    undefined,
    'not-json',
    JSON.stringify({ 'admin@aliverbiopharm.com': '123456' }),
    JSON.stringify({ 'another@example.com': approvalCode })
  ]) {
    if (value === undefined) delete process.env.ADMIN_DEVICE_APPROVAL_CODES;
    else process.env.ADMIN_DEVICE_APPROVAL_CODES = value;

    assert.throws(() => createAdminSessionReferenceHash(binding));
  }

  process.env.ADMIN_DEVICE_APPROVAL_CODES = original;
});

test('admin reference hash rejects malformed or absent stored hashes', () => {
  assert.equal(verifyAdminSessionReferenceHash('not-a-hash', binding), false);
  assert.equal(verifyAdminSessionReferenceHash(null, binding), false);
});


test('fixed recovery code is checked against the configured server secret', () => {
  const binding = {
    email: 'admin@aliverbiopharm.com',
    userId: 'user-123',
    passwordUpdatedAt: '2026-11-06T10:00:00.000Z'
  };

  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, code: approvalCode }), true);
  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, code: '987654321098765432109876543210987654321098765432' }), false);
  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, email: '', code: approvalCode }), false);
  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, userId: '', code: approvalCode }), false);
  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, passwordUpdatedAt: '', code: approvalCode }), false);
  assert.equal(verifyAdminDeviceRecoveryCode({ ...binding, code: '123456' }), false);
});

test('trusted-device approval is invalidated by an administrator email or password-state change', () => {
  const binding = {
    storedEmail: 'admin@aliverbiopharm.com',
    storedPasswordUpdatedAt: '2026-11-06T10:00:00.000Z',
    email: 'ADMIN@ALIVERBIOPHARM.COM',
    passwordUpdatedAt: '2026-11-06T10:00:00.000Z'
  };

  assert.equal(isAdminDeviceBindingCurrent(binding), true);
  assert.equal(isAdminDeviceBindingCurrent({ ...binding, email: 'other@example.com' }), false);
  assert.equal(isAdminDeviceBindingCurrent({ ...binding, passwordUpdatedAt: '2026-11-07T10:00:00.000Z' }), false);
  assert.equal(isAdminDeviceBindingCurrent({ ...binding, storedEmail: null }), false);
  assert.equal(isAdminDeviceBindingCurrent({ ...binding, storedPasswordUpdatedAt: null }), false);
});
