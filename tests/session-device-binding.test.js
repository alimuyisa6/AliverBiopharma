import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSessionDeviceId } from '../lib/session-device-binding.js';

const approvedDeviceId = 'bb1015ce-d645-41e3-a589-ad929ffdadf2';
const differentDeviceId = 'a810a61e-2b4d-4f12-9c31-bb4e2fef89a1';

test('administrator session preserves the exact device ID that passed approval', () => {
  assert.equal(resolveSessionDeviceId({
    isAdminSession: true,
    approvedDeviceId,
    requestDeviceId: differentDeviceId
  }), approvedDeviceId);
});

test('administrator session cannot fall back to an unapproved request or generated device ID', () => {
  for (const approvedId of [null, undefined, '', 'not-a-device-id']) {
    assert.throws(() => resolveSessionDeviceId({
      isAdminSession: true,
      approvedDeviceId: approvedId,
      requestDeviceId: approvedDeviceId ? differentDeviceId : approvedDeviceId
    }), /approved administrator device ID is required/);
  }
});

test('non-administrator sessions continue using their request device ID', () => {
  assert.equal(resolveSessionDeviceId({
    isAdminSession: false,
    approvedDeviceId: null,
    requestDeviceId: differentDeviceId
  }), differentDeviceId);
});

test('session device binding rejects malformed non-administrator device IDs', () => {
  assert.throws(() => resolveSessionDeviceId({
    isAdminSession: false,
    approvedDeviceId: null,
    requestDeviceId: 'invalid'
  }), /valid session device ID is required/);
});
