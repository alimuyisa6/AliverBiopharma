import crypto from 'crypto';
import { supabase } from './core.js';

function recoveryPepper() {
  const value = process.env.ADMIN_SESSION_REFERENCE_SECRET;
  if (!value || value.length < 32) throw new Error('Recovery verification unavailable');
  return value;
}

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashRecoveryCode(code, userId, email) {
  return crypto.createHmac('sha256', recoveryPepper())
    .update('aliver-admin-device-recovery-v1:')
    .update(String(userId))
    .update(':')
    .update(normalizeEmail(email))
    .update(':')
    .update(String(code || '').trim())
    .digest('hex');
}

export async function issueAdminDeviceRecoveryCodes(userId) {
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  const user = data?.user;
  const email = normalizeEmail(user?.email);
  const passwordUpdatedAt = user?.updated_at;

  if (error || !user?.id || !email || !passwordUpdatedAt) {
    throw new Error('Unable to issue recovery credentials');
  }

  const codes = Array.from({ length: 8 }, () => crypto.randomBytes(24).toString('base64url'));
  const rows = codes.map((code) => ({
    admin_user_id: userId,
    email_normalized: email,
    password_updated_at: passwordUpdatedAt,
    code_hash: hashRecoveryCode(code, userId, email),
    expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }));

  const { error: revokeError } = await supabase
    .from('admin_device_recovery_codes')
    .update({ revoked_at: new Date().toISOString() })
    .eq('admin_user_id', userId)
    .is('consumed_at', null)
    .is('revoked_at', null);

  if (revokeError) throw new Error('Unable to rotate recovery credentials');

  const { error: insertError } = await supabase
    .from('admin_device_recovery_codes')
    .insert(rows);

  if (insertError) throw new Error('Unable to issue recovery credentials');

  return codes;
}

export async function ensureAdminDeviceApproved({ userId, email, deviceId, deviceFingerprintHash, approvalCode }) {
  const normalizedEmail = normalizeEmail(email);

  if (!userId || !normalizedEmail || !deviceId || !/^[a-f0-9]{64}$/i.test(String(deviceFingerprintHash || ''))) {
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

  if (lookupError) throw new Error('Unable to verify administrator device');

  if (trustedDevice) {
    await supabase
      .from('admin_trusted_devices')
      .update({ last_seen_at: new Date().toISOString() })
      .eq('id', trustedDevice.id);
    return { approved: true, alreadyTrusted: true };
  }

  if (typeof approvalCode !== 'string' || approvalCode.trim().length < 24 || approvalCode.length > 128) {
    return { approved: false, reason: 'approval_required' };
  }

  const { data: authData, error: authError } = await supabase.auth.admin.getUserById(userId);
  const authUser = authData?.user;

  if (authError || !authUser?.email || normalizeEmail(authUser.email) !== normalizedEmail || !authUser.updated_at) {
    throw new Error('Unable to verify administrator identity');
  }

  const codeHash = hashRecoveryCode(approvalCode, userId, normalizedEmail);
  const now = new Date().toISOString();

  const { data: recoveryCode, error: recoveryLookupError } = await supabase
    .from('admin_device_recovery_codes')
    .select('id')
    .eq('admin_user_id', userId)
    .eq('email_normalized', normalizedEmail)
    .eq('password_updated_at', authUser.updated_at)
    .eq('code_hash', codeHash)
    .gt('expires_at', now)
    .is('consumed_at', null)
    .is('revoked_at', null)
    .maybeSingle();

  if (recoveryLookupError) throw new Error('Unable to verify administrator recovery credential');
  if (!recoveryCode) return { approved: false, reason: 'invalid_code' };

  const { data: consumed, error: consumeError } = await supabase
    .from('admin_device_recovery_codes')
    .update({ consumed_at: now })
    .eq('id', recoveryCode.id)
    .eq('admin_user_id', userId)
    .eq('code_hash', codeHash)
    .is('consumed_at', null)
    .is('revoked_at', null)
    .gt('expires_at', now)
    .select('id')
    .maybeSingle();

  if (consumeError) throw new Error('Unable to verify administrator recovery credential');
  if (!consumed) return { approved: false, reason: 'invalid_code' };

  const { error: insertError } = await supabase
    .from('admin_trusted_devices')
    .upsert({
      admin_user_id: userId,
      device_id_hash: deviceIdHash,
      fingerprint_hash: deviceFingerprintHash,
      approved_at: now,
      last_seen_at: now,
      revoked_at: null
    }, { onConflict: 'admin_user_id,device_id_hash' });

  if (insertError) throw new Error('Unable to approve administrator device');

  return { approved: true, alreadyTrusted: false };
}
