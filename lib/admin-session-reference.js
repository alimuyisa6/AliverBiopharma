import crypto from 'crypto';

function getReferenceSecret() {
  const secret = process.env.ADMIN_SESSION_REFERENCE_SECRET || process.env.SESSION_FINGERPRINT_SALT;
  if (!secret || secret.length < 32) {
    throw new Error('A secure administrator session reference secret is not configured');
  }
  return secret;
}

export function createAdminSessionReferenceHash() {
  const range = 9000000000000000000000n;
  const minimum = 1000000000000000000000n;
  const sourceRange = 1n << 128n;
  const limit = (sourceRange / range) * range;
  let value;

  do {
    value = BigInt('0x' + crypto.randomBytes(16).toString('hex'));
  } while (value >= limit);

  const reference = (minimum + (value % range)).toString();
  return crypto
    .createHmac('sha256', getReferenceSecret())
    .update('aliver-admin-session-reference-v1:' + reference)
    .digest('hex');
}
