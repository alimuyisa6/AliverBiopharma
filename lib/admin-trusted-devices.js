import crypto from 'crypto';
import { supabase } from './core.js';
import { hashAdminDeviceRecoveryCode, isAdminDeviceBindingCurrent } from './admin-session-reference.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

export async function ensureAdminDeviceApproved({ userId, email, deviceId, deviceFingerprintHash, approvalCode }) {
  const normalizedEmail = normalizeEmail(email);

  if (!userId || !normalizedEmail || !deviceId || !/^[a-f0-9]{64}$/i.test(String(deviceFingerprintHash || ''))) {
    return { approved: false, reason: 'binding_incomplete' };
  }

  const deviceIdHash = crypto.createHash('sha256').update(String(deviceId)).digest('hex');

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  const authUser = authData?.user;

  if (
    authError ||
    !authUser?.email ||
    normalizeEmail(authUser.email) !== normalizedEmail ||
    !authUser.updated_at
  ) {
    throw new Error('Unable to verify administrator identity');
  }

  const { data: trustedDevice, error: lookupError } = await supabase
    .from('admin_trusted_devices')
    .select('id, email_normalized, password_updated_at')
    .eq('admin_user_id', userId)
    .eq('device_id_hash', deviceIdHash)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();

  if (lookupError) throw new Error('Unable to verify administrator device');

  if (trustedDevice && isAdminDeviceBindingCurrent({
    storedEmail: trustedDevice.email_normalized,
    storedPasswordUpdatedAt: trustedDevice.password_updated_at,
    email: normalizedEmail,
    passwordUpdatedAt: authUser.updated_at
  })) {
    await supabase
      .from('admin_trusted_devices')
      .update({ last_seen_at: new Date().toISOString(), fingerprint_hash: deviceFingerprintHash })
      .eq('id', trustedDevice.id);
    return { approved: true, alreadyTrusted: true };
  }

  if (typeof approvalCode !== 'string' || !/^\d{48}$/.test(approvalCode.trim())) {
    return { approved: false, reason: 'approval_required' };
  }

  let codeHash;
  try {
    codeHash = hashAdminDeviceRecoveryCode({
      email: normalizedEmail,
      userId,
      passwordUpdatedAt: authUser.updated_at,
      code: approvalCode
    });
  } catch {
    throw new Error('Administrator recovery verification unavailable');
  }

  const { data: consumed, error: approvalError } = await supabase.rpc('consume_admin_device_recovery_code', {
    p_admin_user_id: userId,
    p_email_normalized: normalizedEmail,
    p_password_updated_at: authUser.updated_at,
    p_code_hash: codeHash,
    p_device_id_hash: deviceIdHash,
    p_fingerprint_hash: deviceFingerprintHash
  });

  if (approvalError) throw new Error('Unable to approve administrator device');
  if (consumed !== true) return { approved: false, reason: 'invalid_code' };

  return { approved: true, alreadyTrusted: false };
}
