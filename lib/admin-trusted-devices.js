import crypto from 'crypto';
import { supabase } from './core.js';

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ''), 'utf8');
  const b = Buffer.from(String(right || ''), 'utf8');
  return a.length === b.length && a.length > 0 && crypto.timingSafeEqual(a, b);
}

function getConfiguredApprovalCode(email) {
  const raw = process.env.ADMIN_DEVICE_APPROVAL_CODES;
  if (!raw) throw new Error('ADMIN_DEVICE_APPROVAL_CODES is not configured');

  let codes;
  try {
    codes = JSON.parse(raw);
  } catch {
    throw new Error('ADMIN_DEVICE_APPROVAL_CODES must be a valid JSON object');
  }

  const normalizedEmail = String(email || '').trim().toLowerCase();
  const code = codes && typeof codes === 'object' && !Array.isArray(codes)
    ? codes[normalizedEmail]
    : null;

  if (typeof code !== 'string' || code.length < 20 || code.length > 256) {
    throw new Error('No valid device approval code is configured for this administrator');
  }

  return code;
}

export async function ensureAdminDeviceApproved({ userId, email, deviceId, deviceFingerprintHash, approvalCode }) {
  if (!userId || !email || !deviceId || !/^[a-f0-9]{64}$/i.test(String(deviceFingerprintHash || ''))) {
    return { approved: false, reason: 'binding_incomplete' };
  }

  const deviceIdHash = crypto.createHash('sha256').update(String(deviceId)).digest('hex');

  const { data: trustedDevice, error: lookupError } = await supabase
    .from('admin_trusted_devices')
    .select('id')
    .eq('admin_user_id', userId)
    .eq('device_id_hash', deviceIdHash)
    .eq('fingerprint_hash', deviceFingerprintHash)
    .is('revoked_at', null)
    .maybeSingle();

  if (lookupError) throw new Error('Unable to verify administrator trusted device');

  if (trustedDevice) {
    await supabase
      .from('admin_trusted_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', trustedDevice.id);
    return { approved: true, alreadyTrusted: true };
  }

  if (!approvalCode) return { approved: false, reason: 'approval_required' };

  let expectedCode;
  try {
    expectedCode = getConfiguredApprovalCode(email);
  } catch {
    throw new Error('Administrator device approval is not configured for this email');
  }

  if (!safeEqual(approvalCode, expectedCode)) {
    return { approved: false, reason: 'invalid_code' };
  }

  const { error: insertError } = await supabase
    .from('admin_trusted_devices')
    .upsert({
      admin_user_id: userId,
      device_id_hash: deviceIdHash,
      fingerprint_hash: deviceFingerprintHash,
      approved_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      revoked_at: null
    }, { onConflict: 'admin_user_id,device_id_hash' });

  if (insertError) throw new Error('Unable to approve this administrator device');

  return { approved: true, alreadyTrusted: false };
}
