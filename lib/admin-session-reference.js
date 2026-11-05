import crypto from 'crypto';

function getReferenceSecret() {
  const secret = process.env.ADMIN_SESSION_REFERENCE_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('ADMIN_SESSION_REFERENCE_SECRET must contain at least 32 characters');
  }
  return secret;
}

function normalizeBinding({ email, userId, sessionId, deviceId }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const normalizedUserId = String(userId || '').trim();
  const normalizedSessionId = String(sessionId || '').trim();
  const normalizedDeviceId = String(deviceId || '').trim();

  if (!normalizedEmail || !normalizedUserId || !normalizedSessionId || !normalizedDeviceId) {
    throw new Error('Administrator reference binding is incomplete');
  }

  return JSON.stringify({
    email: normalizedEmail,
    userId: normalizedUserId,
    sessionId: normalizedSessionId,
    deviceId: normalizedDeviceId
  });
}

export function createAdminSessionReferenceHash(binding) {
  const secret = getReferenceSecret();
  const payload = normalizeBinding(binding);
  const digest = crypto.createHmac('sha256', secret)
    .update('aliver-admin-session-reference-number-v2:')
    .update(payload)
    .digest();

  const range = 9000000000000000000000n;
  const minimum = 1000000000000000000000n;
  const numeric = BigInt('0x' + digest.subarray(0, 16).toString('hex')) % range;
  const reference = (minimum + numeric).toString();

  return crypto.createHmac('sha256', secret)
    .update('aliver-admin-session-reference-hash-v2:')
    .update(payload)
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
