import crypto from 'crypto';
import { supabase } from './core.js';
import { verifyAdminDeviceRecoveryCode, isAdminDeviceBindingCurrent } from './admin-session-reference.js';

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

  if (typeof approvalCode !== 'string' || !/^\\d{48}$/.test(approvalCode.trim())) {
    return { approved: false, reason: 'approval_required' };
  }

  if (!verifyAdminDeviceRecoveryCode({
    email: normalizedEmail,
    userId,
    passwordUpdatedAt: authUser.updated_at,
    code: approvalCode.trim()
  })) {
    return { approved: false, reason: 'invalid_code' };
  }

  const now = new Date().toISOString();
  const { error: approvalError } = await supabase
    .from('admin_trusted_devices')
    .upsert({
      admin_user_id: userId,
      email_normalized: normalizedEmail,
      password_updated_at: authUser.updated_at,
      device_id_hash: deviceIdHash,
      fingerprint_hash: deviceFingerprintHash,
      approved_at: now,
      last_seen_at: now,
      expires_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      revoked_at: null
    }, { onConflict: 'admin_user_id,device_id_hash' });

  if (approvalError) throw new Error('Unable to approve administrator device');

  return { approved: true, alreadyTrusted: false };
}
