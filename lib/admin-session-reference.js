import crypto from 'crypto';

function getReferenceSecret() {
  const secret = process.env.ADMIN_SESSION_REFERENCE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('Administrator session verification unavailable');
  }
  return secret;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function getDeviceApprovalCode(email) {
  const normalizedEmail = normalizeEmail(email);
  const raw = process.env.ADMIN_DEVICE_APPROVAL_CODES;

  if (!normalizedEmail || !raw) {
    throw new Error('Administrator device verification unavailable');
  }

  if (/^\d{48}$/.test(raw)) return raw;

  let mapping;
  try {
    mapping = JSON.parse(raw);
  } catch {
    throw new Error('Administrator device verification unavailable');
  }

  if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)) {
    throw new Error('Administrator device verification unavailable');
  }

  const matches = Object.entries(mapping)
    .filter(([key]) => normalizeEmail(key) === normalizedEmail)
    .map(([, value]) => value);

  if (matches.length !== 1 || typeof matches[0] !== 'string' || !/^\d{48}$/.test(matches[0])) {
    throw new Error('Administrator device verification unavailable');
  }

  return matches[0];
}

function getBoundReferenceSecret(email) {
  const secret = getReferenceSecret();
  const approvalCode = getDeviceApprovalCode(email);

  return crypto.createHmac('sha256', secret)
    .update('aliver-admin-device-approval-binding-v1:')
    .update(normalizeEmail(email))
    .update(':')
    .update(approvalCode)
    .digest();
}

function normalizeBinding({ email, userId, sessionId, deviceId }) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedUserId = String(userId || '').trim();
  const normalizedSessionId = String(sessionId || '').trim();
  const normalizedDeviceId = String(deviceId || '').trim();

  if (!normalizedEmail || !normalizedUserId || !normalizedSessionId || !normalizedDeviceId) {
    throw new Error('Administrator reference binding is incomplete');
  }

  return {
    email: normalizedEmail,
    payload: JSON.stringify({
      email: normalizedEmail,
      userId: normalizedUserId,
      sessionId: normalizedSessionId,
      deviceId: normalizedDeviceId
    })
  };
}

export function createAdminSessionReferenceHash(binding) {
  const normalized = normalizeBinding(binding);
  const secret = getBoundReferenceSecret(normalized.email);
  const digest = crypto.createHmac('sha256', secret)
    .update('aliver-admin-session-reference-number-v3:')
    .update(normalized.payload)
    .digest();

  const range = 9000000000000000000000n;
  const minimum = 1000000000000000000000n;
  const numeric = BigInt('0x' + digest.subarray(0, 16).toString('hex')) % range;
  const reference = (minimum + numeric).toString();

  return crypto.createHmac('sha256', secret)
    .update('aliver-admin-session-reference-hash-v3:')
    .update(normalized.payload)
    .update(':')
    .update(reference)
    .digest('hex');
}

export function verifyAdminSessionReferenceHash(storedHash, binding) {
  if (typeof storedHash !== 'string' || !/^[a-f0-9]{64}$/i.test(storedHash)) return false;

  let expected;
  try {
    expected = createAdminSessionReferenceHash(binding);
  } catch {
    return false;
  }

  const actualBuffer = Buffer.from(storedHash, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');

  return actualBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}
