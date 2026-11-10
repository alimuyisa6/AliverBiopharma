import { supabase } from './core.js';
import {
  parseAndValidateBody,
  requireAuth,
  requireSuperAdmin,
  SecurityError
} from './security-middleware.js';
import crypto from 'crypto';
import { dispatchWebhookEvent } from './webhooks.js';
import { getDeviceMetadata } from './device-info.js';

const DEBUG_PROFILE_ERRORS = true;

function formatSupabaseError(operation, table, error, userId) {
  const code = error?.code || 'UNKNOWN';
  const message = error?.message || 'Unknown Supabase error';
  const details = error?.details || '';
  const hint = error?.hint || '';

  const diagnostic = [
    `Profile operation failed: ${operation}`,
    `table=${table}`,
    `user_id=${userId}`,
    `code=${code}`,
    `message=${message}`,
    details ? `details=${details}` : '',
    hint ? `hint=${hint}` : ''
  ].filter(Boolean).join(' | ');

  return diagnostic;
}

function throwSupabaseError(operation, table, error, userId, status = 500) {
  const diagnostic = formatSupabaseError(operation, table, error, userId);

  if (DEBUG_PROFILE_ERRORS) {
    console.error('[PROFILE]', diagnostic);
  }

  throw new SecurityError(diagnostic, status);
}

function requireData(data, operation, table, userId) {
  if (data === null || data === undefined) {
    const diagnostic =
      `Profile operation returned no data: ${operation} | table=${table} | user_id=${userId}`;

    if (DEBUG_PROFILE_ERRORS) {
      console.error('[PROFILE]', diagnostic);
    }

    throw new SecurityError(diagnostic, 500);
  }

  return data;
}

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET') {
    requireAuth(ctx);

    switch (path) {
      case 'settings_bundle':
        return getSettingsBundle(req, res, ctx);
      case 'referral_stats':
        return getReferralStats(req, res, ctx);
      case 'admin_referral_payouts':
        requireSuperAdmin(ctx);
        return getAdminReferralPayouts(req, res);
      case 'certificates':
        return getCertificates(req, res, ctx);
      case 'devices':
        return getDevices(req, res, ctx);
      case 'billing_summary':
        return getBillingSummary(req, res, ctx);
      case 'api_keys':
        return getApiKeys(req, res, ctx);
      case 'webhooks':
        return getWebhooks(req, res, ctx);
      case 'notification_preferences':
        return getNotificationPreferences(req, res, ctx);
      case 'pending_level_changes':
        requireSuperAdmin(ctx);
        return getPendingLevelChanges(res);
      case 'get_profile':
        return getProfile(req, res, ctx);
      default:
        throw new SecurityError('Invalid action', 400);
    }
  }

  if (req.method === 'POST') {
    requireAuth(ctx);
    const body = await parseAndValidateBody(req);

    switch (path) {
      case 'request_referral_payout':
        return requestReferralPayout(body, res, ctx);
      case 'review_referral_payout':
        requireSuperAdmin(ctx);
        return reviewReferralPayout(body, res, ctx);
      case 'switch_class':
        return switchClass(body, res, ctx);
      case 'update_class':
        return updateClassByName(body, res, ctx);
      case 'update_bio':
        return updateBio(body, res, ctx);
      case 'update_preferences':
        return updatePreferences(body, res, ctx);
      case 'update_notification_preferences':
        return updateNotificationPreferences(body, res, ctx);
      case 'create_api_key':
        return createApiKey(body, res, ctx);
      case 'revoke_api_key':
        return revokeApiKey(body, res, ctx);
      case 'create_webhook':
        return createWebhook(body, res, ctx);
      case 'update_webhook':
        return updateWebhook(body, res, ctx);
      case 'delete_webhook':
        return deleteWebhook(body, res, ctx);
      case 'test_webhook':
        return testWebhook(body, res, ctx);
      case 'revoke_device':
        return revokeDevice(body, res, ctx);
      case 'update_device_metadata':
        return updateDeviceMetadata(body, res, ctx);
      case 'save_parent_guardian':
        return saveParentGuardian(body, res, ctx);
      case 'request_data_export':
        return requestDataExport(res, ctx);
      case 'request_account_deletion':
        return requestAccountDeletion(res, ctx);
      case 'update_display_name':
        return updateDisplayName(body, res, ctx);
      case 'request_level_change':
        return requestLevelChange(body, res, ctx);
      case 'review_level_change':
        requireSuperAdmin(ctx);
        return reviewLevelChange(body, res, ctx);
      default:
        throw new SecurityError('Invalid action', 400);
    }
  }

  throw new SecurityError('Method not allowed', 405);
}

async function switchClass(body, res, ctx) {
  const { group_id } = body;

  if (!group_id) {
    throw new SecurityError('group_id is required', 400);
  }

  const { data: group, error: groupError } = await supabase
    .from('curriculum_groups')
    .select('id, name, level_id, is_active')
    .eq('id', group_id)
    .maybeSingle();

  if (groupError) {
    throwSupabaseError(
      'switchClass:load_group',
      'curriculum_groups',
      groupError,
      ctx.userId
    );
  }

  if (!group || group.is_active === false) {
    throw new SecurityError('Class not found or inactive', 404);
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('user_profiles')
    .select('active_level_id')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (currentProfileError) {
    throwSupabaseError(
      'switchClass:load_profile',
      'user_profiles',
      currentProfileError,
      ctx.userId
    );
  }

  if (!currentProfile?.active_level_id) {
    throw new SecurityError('Your active curriculum level is not configured', 409);
  }

  if (group.level_id !== currentProfile.active_level_id) {
    throw new SecurityError('You can only switch within your current curriculum level', 403);
  }

  const { data: level, error: levelError } = await supabase
    .from('curriculum_levels')
    .select('id')
    .eq('id', group.level_id)
    .maybeSingle();

  if (levelError) {
    throwSupabaseError(
      'switchClass:load_level',
      'curriculum_levels',
      levelError,
      ctx.userId
    );
  }

  if (!level) {
    throw new SecurityError('Class level not found', 404);
  }

  // The database constrains profile.track to O-Level, A-Level, or
  // Pharmacy. Curriculum display names (for example, "Ordinary Biology")
  // are presentation labels, not valid values for this column.
  const trackByLevelId = {
    'O Level': 'O-Level',
    'A Level': 'A-Level',
    Pharmacy: 'Pharmacy'
  };
  const track = trackByLevelId[group.level_id];

  if (!track) {
    throw new SecurityError('Unsupported curriculum level', 400);
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      active_group_id: group.id,
      active_level_id: group.level_id,
      class_name: group.name,
      track,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', ctx.userId)
    .select('active_group_id, active_level_id, class_name, track')
    .single();

  if (error) {
    throwSupabaseError(
      'switchClass:update_profile',
      'user_profiles',
      error,
      ctx.userId
    );
  }

  const { error: auditError } = await supabase.from('audit_log').insert({
    actor_id: ctx.userId,
    action: 'switch_class',
    target_type: 'user_profile',
    target_id: ctx.userId,
    metadata: {
      group_id: group.id,
      group_name: group.name
    }
  });

  if (auditError && DEBUG_PROFILE_ERRORS) {
    console.error(
      '[PROFILE] Class switch succeeded but audit logging failed:',
      auditError?.message || auditError
    );
  }

  return res.status(200).json({
    success: true,
    profile: data
  });
}

async function updateClassByName(body, res, ctx) {
  const { class_name } = body;

  if (!class_name) {
    throw new SecurityError('class_name is required', 400);
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('active_level_id')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (profileError) {
    throwSupabaseError(
      'updateClassByName:load_profile',
      'user_profiles',
      profileError,
      ctx.userId
    );
  }

  if (!profile?.active_level_id) {
    throw new SecurityError(
      'No active level set for this account',
      400
    );
  }

  const { data: group, error: groupError } = await supabase
    .from('curriculum_groups')
    .select('id, name, level_id')
    .eq('level_id', profile.active_level_id)
    .eq('name', class_name)
    .eq('is_active', true)
    .maybeSingle();

  if (groupError) {
    throwSupabaseError(
      'updateClassByName:load_group',
      'curriculum_groups',
      groupError,
      ctx.userId
    );
  }

  if (!group) {
    throw new SecurityError(
      'Class not found for your current level',
      404
    );
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      active_group_id: group.id,
      class_name: group.name,
      updated_at: new Date().toISOString()
    })
    .eq('user_id', ctx.userId)
    .select('active_group_id, active_level_id, class_name')
    .single();

  if (error) {
    throwSupabaseError(
      'updateClassByName:update_profile',
      'user_profiles',
      error,
      ctx.userId
    );
  }

  return res.status(200).json({
    success: true,
    profile: data
  });
}

async function getSettingsBundle(req, res, ctx) {
  const userId = ctx.userId;

  const [profile, referral, devices, subscription] =
    await Promise.all([
      supabase
        .from('user_profiles')
        .select(
          'bio, referral_code, referred_by, accessibility, language, timezone, preferences'
        )
        .eq('user_id', userId)
        .maybeSingle(),

      supabase
        .from('user_referrals')
        .select('id, status, xp_awarded', {
          count: 'exact'
        })
        .eq('referrer_id', userId),

      supabase
        .from('user_sessions')
        .select('id', {
          count: 'exact',
          head: true
        })
        .eq('user_id', userId)
        .eq('is_active', true),

      supabase
        .from('user_subscriptions')
        .select('status, expires_at, plan_id')
        .eq('user_id', userId)
        .order('created_at', {
          ascending: false
        })
        .limit(1)
        .maybeSingle()
    ]);

  if (profile.error) {
    throwSupabaseError(
      'getSettingsBundle:profile',
      'user_profiles',
      profile.error,
      userId
    );
  }

  if (referral.error) {
    throwSupabaseError(
      'getSettingsBundle:referrals',
      'user_referrals',
      referral.error,
      userId
    );
  }

  if (devices.error) {
    throwSupabaseError(
      'getSettingsBundle:devices',
      'user_sessions',
      devices.error,
      userId
    );
  }

  if (subscription.error) {
    throwSupabaseError(
      'getSettingsBundle:subscription',
      'user_subscriptions',
      subscription.error,
      userId
    );
  }

  return res.status(200).json({
    profile: profile.data || null,
    referral_count: referral.count || 0,
    active_device_count: devices.count || 0,
    subscription: subscription.data || null
  });
}

async function updateBio(body, res, ctx) {
  const userId = ctx.userId;
  const { bio } = body;

  if (typeof bio !== 'string' || bio.length > 500) {
    throw new SecurityError(
      'bio must be a string under 500 characters',
      400
    );
  }

  const { data, error } = await supabase
    .from('user_profiles')
    .update({
      bio: bio.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select('bio')
    .single();

  if (error) {
    throwSupabaseError(
      'updateBio:update_profile',
      'user_profiles',
      error,
      userId
    );
  }

  requireData(data, 'updateBio:update_profile', 'user_profiles', userId);

  return res.status(200).json({
    success: true,
    bio: data.bio
  });
}

async function updatePreferences(body, res, ctx) {
  const userId = ctx.userId;
  const updates = {
    updated_at: new Date().toISOString()
  };

  const allowedKeys = [
    'language',
    'timezone'
  ];

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      if (key === 'language') {
        const language = String(body[key]).trim().toLowerCase();
        if (!['en', 'sw'].includes(language)) {
          throw new SecurityError('language must be one of: en, sw', 400);
        }
        updates[key] = language;
        continue;
      }

      updates[key] = String(body[key]).slice(0, 50);
    }
  }

  if (body.accessibility !== undefined) {
    if (
      typeof body.accessibility !== 'object' ||
      Array.isArray(body.accessibility)
    ) {
      throw new SecurityError(
        'accessibility must be an object',
        400
      );
    }

    updates.accessibility = body.accessibility;
  }

  if (body.preferences !== undefined) {
    if (
      typeof body.preferences !== 'object' ||
      Array.isArray(body.preferences)
    ) {
      throw new SecurityError(
        'preferences must be an object',
        400
      );
    }

    const currentProfile = await supabase
      .from('user_profiles')
      .select('preferences')
      .eq('user_id', userId)
      .maybeSingle();

    if (currentProfile.error) {
      throwSupabaseError(
        'updatePreferences:load_preferences',
        'user_profiles',
        currentProfile.error,
        userId
      );
    }

    const incoming = body.preferences;
    const current = currentProfile.data?.preferences || {};
    const nextPreferences = { ...current };

    const allowedUI = {
      font_family: new Set(['maven', 'system', 'serif', 'mono']),
      font_size: new Set(['90', '100', '110', '120']),
      density: new Set(['compact', 'comfortable', 'spacious']),
      surface_style: new Set(['card', 'flat']),
      button_size: new Set(['small', 'medium', 'large']),
      button_width: new Set(['auto', 'full']),
      content_width: new Set(['readable', 'wide', 'full']),
      section_spacing: new Set(['compact', 'comfortable', 'spacious'])
    };

    if (incoming.ui !== undefined) {
      if (
        typeof incoming.ui !== 'object' ||
        Array.isArray(incoming.ui)
      ) {
        throw new SecurityError('preferences.ui must be an object', 400);
      }

      const nextUI = { ...(current.ui || {}) };

      for (const [key, value] of Object.entries(incoming.ui)) {
        if (!Object.prototype.hasOwnProperty.call(allowedUI, key)) {
          throw new SecurityError(`Unsupported UI preference: ${key}`, 400);
        }

        const normalized = String(value);
        if (!allowedUI[key].has(normalized)) {
          throw new SecurityError(`Invalid value for UI preference: ${key}`, 400);
        }

        nextUI[key] = normalized;
      }

      nextPreferences.ui = nextUI;
    }

    for (const key of Object.keys(incoming)) {
      if (key === 'ui') continue;
      if (key !== 'theme_mode') {
        throw new SecurityError(`Unsupported preference key: ${key}`, 400);
      }

      const value = String(incoming[key]);
      if (!['light', 'dark'].includes(value)) {
        throw new SecurityError('Invalid value for preference: theme_mode', 400);
      }

      nextPreferences.theme_mode = value;
    }

    updates.preferences = nextPreferences;
  }
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId)
    .select(
      'language, timezone, accessibility, preferences'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'updatePreferences:update_profile',
      'user_profiles',
      error,
      userId
    );
  }

  requireData(
    data,
    'updatePreferences:update_profile',
    'user_profiles',
    userId
  );

  return res.status(200).json({
    success: true,
    profile: data
  });
}

async function getReferralStats(req, res, ctx) {
  const userId = ctx.userId;
  let referralCode = null;
  const { data: initialProfile, error: initialProfileError } = await supabase
    .from('user_profiles').select('referral_code').eq('user_id', userId).maybeSingle();
  if (initialProfileError) throwSupabaseError('getReferralStats:profile', 'user_profiles', initialProfileError, userId);
  referralCode = initialProfile?.referral_code || null;
  if (!referralCode) {
    referralCode = 'ALIVER' + crypto.randomBytes(6).toString('hex').toUpperCase();
    const { error: codeError } = await supabase.from('user_profiles').update({ referral_code: referralCode }).eq('user_id', userId);
    if (codeError) throwSupabaseError('getReferralStats:create_code', 'user_profiles', codeError, userId);
  }
  const [{ data: profile, error: profileError }, { data: referrals, count, error: referralsError },
    { data: ledger, error: ledgerError }, { data: settings, error: settingsError },
    { data: payouts, error: payoutsError }] = await Promise.all([
    supabase.from('user_profiles').select('referral_code').eq('user_id', userId).maybeSingle(),
    supabase.from('user_referrals').select('id, referred_user_id, status, xp_awarded, created_at', { count: 'exact' })
      .eq('referrer_id', userId).order('created_at', { ascending: false }),
    supabase.from('referral_reward_ledger').select('id, referred_user_id, source_payment_id, reward_type, amount, currency, status, description, created_at')
      .eq('beneficiary_user_id', userId).order('created_at', { ascending: false }),
    supabase.from('ambassador_program_settings').select('referral_reward_amount, referral_reward_currency, withdrawal_eligibility_referrals, commission_unlock_referrals, commission_rate_percent, is_active').eq('id', 1).maybeSingle(),
    supabase.from('referral_payout_requests').select('id, amount, currency, status, created_at, reviewed_at, paid_at')
      .eq('user_id', userId).order('created_at', { ascending: false })
  ]);
  for (const [operation, error] of [['profile',profileError],['referrals',referralsError],['ledger',ledgerError],['settings',settingsError],['payouts',payoutsError]]) {
    if (error) throwSupabaseError('getReferralStats:'+operation, operation === 'profile' ? 'user_profiles' : operation === 'referrals' ? 'user_referrals' : operation === 'ledger' ? 'referral_reward_ledger' : operation === 'settings' ? 'ambassador_program_settings' : 'referral_payout_requests', error, userId);
  }
  const balances = {};
  for (const entry of ledger || []) {
    const currency = entry.currency;
    balances[currency] = (balances[currency] || 0) + (entry.status === 'reversed' ? 0 : Number(entry.amount) || 0);
  }
  for (const payout of payouts || []) {
    if (['requested','under_review','approved','paid'].includes(payout.status)) {
      balances[payout.currency] = (balances[payout.currency] || 0) - Number(payout.amount || 0);
    }
  }
  const premiumReferrals = new Set((ledger || []).filter(x => x.reward_type === 'premium_referral_reward' && x.status !== 'reversed').map(x => x.referred_user_id).filter(Boolean)).size;
  const totalXp = (referrals || []).reduce((sum, item) => sum + (Number(item.xp_awarded) || 0), 0);
  return res.status(200).json({
    referral_code: profile?.referral_code || referralCode,
    referral_link: `https://aliver-biopharma.vercel.app/register?ref=${encodeURIComponent(profile?.referral_code || referralCode)}`,
    referral_count: count || 0,
    total_xp_earned: totalXp,
    premium_referral_count: premiumReferrals,
    withdrawal_threshold: settings?.withdrawal_eligibility_referrals || 10,
    commission_threshold: settings?.commission_unlock_referrals || 50,
    commission_rate_percent: Number(settings?.commission_rate_percent ?? 10),
    program_active: settings?.is_active !== false,
    balances: Object.entries(balances).map(([currency, amount]) => ({ currency, available: Math.max(0, Number(amount.toFixed(6))) })),
    ledger: ledger || [],
    payouts: payouts || [],
    referrals: referrals || []
  });
}

async function requestReferralPayout(body, res, ctx) {
  const amount = Number(body.amount);
  const currency = String(body.currency || 'USD').toUpperCase();
  const payoutMethod = String(body.payout_method || '').trim();
  const payoutDetails = body.payout_details && typeof body.payout_details === 'object' && !Array.isArray(body.payout_details) ? body.payout_details : {};
  if (!Number.isFinite(amount) || amount <= 0 || !/^[A-Z0-9]{3,12}$/.test(currency)) throw new SecurityError('A valid payout amount and currency are required', 400);
  if (!payoutMethod || payoutMethod.length > 40) throw new SecurityError('A valid payout method is required', 400);
  const { data, error } = await supabase.rpc('request_referral_payout', {
    p_user_id: ctx.userId, p_amount: amount, p_currency: currency,
    p_payout_method: payoutMethod, p_payout_details: payoutDetails
  });
  if (error) throwSupabaseError('requestReferralPayout:create', 'referral_payout_requests', error, ctx.userId);
  return res.status(200).json({ success: true, payout: data });
}


async function getAdminReferralPayouts(req, res) {
  const status = String(req.query.status || '').trim();
  let query = supabase.from('referral_payout_requests')
    .select('id, user_id, amount, currency, payout_method, payout_details, status, reviewed_by, reviewed_at, paid_at, admin_note, created_at')
    .order('created_at', { ascending: false }).limit(200);
  if (status) query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw new SecurityError('Unable to load referral payout requests', 500);
  return res.status(200).json(data || []);
}

async function reviewReferralPayout(body, res, ctx) {
  const payoutId = String(body.payout_id || '').trim();
  const action = String(body.action || '').trim();
  const adminNote = String(body.admin_note || '').trim().slice(0, 1000);
  const transitions = {
    start_review: { from: ['requested'], to: 'under_review' },
    approve: { from: ['requested', 'under_review'], to: 'approved' },
    reject: { from: ['requested', 'under_review'], to: 'rejected' },
    mark_paid: { from: ['approved'], to: 'paid' }
  };
  const transition = transitions[action];
  if (!payoutId || !transition) throw new SecurityError('A valid payout_id and action are required', 400);
  const { data: payout, error: lookupError } = await supabase
    .from('referral_payout_requests').select('*').eq('id', payoutId).maybeSingle();
  if (lookupError) throw new SecurityError('Unable to load payout request', 500);
  if (!payout) throw new SecurityError('Payout request not found', 404);
  if (!transition.from.includes(payout.status)) {
    throw new SecurityError(`Cannot move payout from ${payout.status} to ${transition.to}`, 409);
  }
  const now = new Date().toISOString();
  const updates = {
    status: transition.to,
    reviewed_by: ctx.userId,
    reviewed_at: now,
    updated_at: now,
    admin_note: adminNote || payout.admin_note || null
  };
  if (action === 'mark_paid') updates.paid_at = now;
  const { data: updated, error: updateError } = await supabase
    .from('referral_payout_requests').update(updates).eq('id', payoutId)
    .eq('status', payout.status).select('id, user_id, amount, currency, status, reviewed_at, paid_at').single();
  if (updateError || !updated) throw new SecurityError('Payout status changed concurrently. Refresh and try again.', 409);
  await supabase.from('audit_log').insert({
    actor_id: ctx.userId,
    action: 'review_referral_payout',
    target_type: 'referral_payout_request',
    target_id: payoutId,
    metadata: { transition: action, from: payout.status, to: transition.to, amount: payout.amount, currency: payout.currency }
  });
  return res.status(200).json({ success: true, payout: updated });
}

async function getCertificates(req, res, ctx) {
  const { data, error } = await supabase
    .from('certificates')
    .select(
      'id, title, unit_id, score, issued_at, certificate_url, verification_code'
    )
    .eq('user_id', ctx.userId)
    .order('issued_at', {
      ascending: false
    });

  if (error) {
    throwSupabaseError(
      'getCertificates:list',
      'certificates',
      error,
      ctx.userId
    );
  }

  return res.status(200).json(data || []);
}

async function getDevices(req, res, ctx) {
  const currentDevice = getDeviceMetadata(req);
  if (ctx.sessionId && (currentDevice.device_platform || currentDevice.device_model || currentDevice.device_os_version)) {
    await supabase
      .from('user_sessions')
      .update({
        device_platform: currentDevice.device_platform,
        device_os_version: currentDevice.device_os_version,
        device_model: currentDevice.device_model,
        device_browser: currentDevice.device_browser,
        device_browser_version: currentDevice.device_browser_version
      })
      .eq('id', ctx.sessionId)
      .eq('user_id', ctx.userId);
  }

  const { data, error } = await supabase
    .from('user_sessions')
    .select(
      'id, user_agent, ip_address, created_at, expires_at, is_active, device_id, device_model, device_platform, device_os_version, device_browser, device_browser_version'
    )
    .eq('user_id', ctx.userId)
    .eq('is_active', true)
    .order('created_at', {
      ascending: false
    });

  if (error) {
    throwSupabaseError(
      'getDevices:list',
      'user_sessions',
      error,
      ctx.userId
    );
  }

  return res.status(200).json(data || []);
}

async function updateDeviceMetadata(body, res, ctx) {
  const metadata = body && typeof body === 'object' ? body : {};
  const deviceId = typeof metadata.deviceId === 'string' ? metadata.deviceId.trim().slice(0, 64) : null;
  const model = typeof metadata.model === 'string' ? metadata.model.trim().slice(0, 120) : null;
  const platform = typeof metadata.platform === 'string' ? metadata.platform.trim().slice(0, 40) : null;
  const platformVersion = typeof metadata.platformVersion === 'string' ? metadata.platformVersion.trim().slice(0, 64) : null;
  const browser = typeof metadata.browser === 'string' ? metadata.browser.trim().slice(0, 80) : null;
  const browserVersion = typeof metadata.browserVersion === 'string' ? metadata.browserVersion.trim().slice(0, 64) : null;

  if (!platform && !model && !platformVersion && !browser) {
    return res.status(200).json({ success: true, updated: false });
  }

  const { error } = await supabase
    .from('user_sessions')
    .update({
      device_id: deviceId,
      device_model: model,
      device_platform: platform,
      device_os_version: platformVersion,
      device_browser: browser,
      device_browser_version: browserVersion
    })
    .eq('id', ctx.sessionId)
    .eq('user_id', ctx.userId)
    .eq('is_active', true);

  if (error) {
    throwSupabaseError('updateDeviceMetadata:update', 'user_sessions', error, ctx.userId);
  }

  return res.status(200).json({ success: true, updated: true });
}

async function revokeDevice(body, res, ctx) {
  const { session_id } = body;

  if (!session_id) {
    throw new SecurityError(
      'session_id is required',
      400
    );
  }

  const { data: session, error: sessionError } =
    await supabase
      .from('user_sessions')
      .select('id, user_id')
      .eq('id', session_id)
      .eq('user_id', ctx.userId)
      .maybeSingle();

  if (sessionError) {
    throwSupabaseError(
      'revokeDevice:find_session',
      'user_sessions',
      sessionError,
      ctx.userId
    );
  }

  if (!session) {
    throw new SecurityError(
      'Session not found',
      404
    );
  }

  const { error } = await supabase
    .from('user_sessions')
    .update({
      is_active: false,
      terminated_reason: 'user_revoked',
      terminated_at: new Date().toISOString()
    })
    .eq('id', session_id);

  if (error) {
    throwSupabaseError(
      'revokeDevice:update_session',
      'user_sessions',
      error,
      ctx.userId
    );
  }

  const { error: auditError } = await supabase
    .from('audit_log')
    .insert({
      actor_id: ctx.userId,
      action: 'revoke_device_session',
      target_type: 'user_session',
      target_id: String(session_id)
    });

  if (auditError) {
    throwSupabaseError(
      'revokeDevice:audit_log',
      'audit_log',
      auditError,
      ctx.userId
    );
  }

  return res.status(200).json({
    success: true
  });
}

async function getBillingSummary(req, res, ctx) {
  const userId = ctx.userId;

  const {
    data: subscription,
    error: subscriptionError
  } = await supabase
    .from('user_subscriptions')
    .select(
      'id, status, starts_at, expires_at, auto_renew, plan_id'
    )
    .eq('user_id', userId)
    .order('created_at', {
      ascending: false
    })
    .limit(1)
    .maybeSingle();

  if (subscriptionError) {
    throwSupabaseError(
      'getBillingSummary:subscription',
      'user_subscriptions',
      subscriptionError,
      userId
    );
  }

  let plan = null;

  if (subscription?.plan_id) {
    const {
      data,
      error
    } = await supabase
      .from('subscription_plans')
      .select(
        'id, name, slug, price_amount, currency, duration_days, features'
      )
      .eq('id', subscription.plan_id)
      .maybeSingle();

    if (error) {
      throwSupabaseError(
        'getBillingSummary:current_plan',
        'subscription_plans',
        error,
        userId
      );
    }

    plan = data;
  }

  const {
    data: plans,
    error: plansError
  } = await supabase
    .from('subscription_plans')
    .select(
      'id, name, slug, price_amount, currency, duration_days, features'
    )
    .eq('is_active', true)
    .order('display_order', {
      ascending: true
    });

  if (plansError) {
    throwSupabaseError(
      'getBillingSummary:available_plans',
      'subscription_plans',
      plansError,
      userId
    );
  }

  return res.status(200).json({
    subscription: subscription || null,
    current_plan: plan,
    available_plans: plans || []
  });
}

async function getApiKeys(req, res, ctx) {
  const { data, error } = await supabase
    .from('api_keys')
    .select(
      'id, name, key_prefix, scopes, last_used_at, created_at, revoked_at, is_active'
    )
    .eq('user_id', ctx.userId)
    .order('created_at', {
      ascending: false
    });

  if (error) {
    throwSupabaseError(
      'getApiKeys:list',
      'api_keys',
      error,
      ctx.userId
    );
  }

  return res.status(200).json(data || []);
}

async function createApiKey(body, res, ctx) {
  const userId = ctx.userId;
  const name = (body.name || 'Default Key')
    .trim()
    .slice(0, 100);

  const rawKey =
    `sk_live_${crypto.randomBytes(24).toString('hex')}`;

  const keyPrefix = rawKey.slice(0, 14);

  const keyHash = crypto
    .createHash('sha256')
    .update(rawKey)
    .digest('hex');

  const {
    data,
    error
  } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: keyHash,
      key_prefix: keyPrefix,
      scopes: ['read'],
      is_active: true
    })
    .select(
      'id, name, key_prefix, created_at'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'createApiKey:insert',
      'api_keys',
      error,
      userId
    );
  }

  requireData(
    data,
    'createApiKey:insert',
    'api_keys',
    userId
  );

  const { error: auditError } = await supabase
    .from('audit_log')
    .insert({
      actor_id: userId,
      action: 'create_api_key',
      target_type: 'api_key',
      target_id: data.id
    });

  if (auditError) {
    throwSupabaseError(
      'createApiKey:audit_log',
      'audit_log',
      auditError,
      userId
    );
  }

  await dispatchWebhookEvent(ctx.userId, 'api_key.created', {
    id: data.id,
    name: data.name,
    key_prefix: data.key_prefix,
    scopes: ['read'],
    created_at: data.created_at
  });

  return res.status(200).json({
    success: true,
    key: data,
    raw_key: rawKey
  });
}

async function revokeApiKey(body, res, ctx) {
  const { key_id } = body;

  if (!key_id) {
    throw new SecurityError(
      'key_id is required',
      400
    );
  }

  const {
    data: key,
    error: keyError
  } = await supabase
    .from('api_keys')
    .select('id, user_id')
    .eq('id', key_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (keyError) {
    throwSupabaseError(
      'revokeApiKey:find_key',
      'api_keys',
      keyError,
      ctx.userId
    );
  }

  if (!key) {
    throw new SecurityError(
      'Key not found',
      404
    );
  }

  const { error } = await supabase
    .from('api_keys')
    .update({
      is_active: false,
      revoked_at: new Date().toISOString()
    })
    .eq('id', key_id);

  if (error) {
    throwSupabaseError(
      'revokeApiKey:update',
      'api_keys',
      error,
      ctx.userId
    );
  }

  await dispatchWebhookEvent(ctx.userId, 'api_key.revoked', { id: key.id, revoked_at: new Date().toISOString() });

  return res.status(200).json({
    success: true
  });
}

async function getWebhooks(req, res, ctx) {
  const { data, error } = await supabase
    .from('webhook_endpoints')
    .select(
      'id, url, events, is_active, last_delivery_at, last_delivery_status, created_at'
    )
    .eq('user_id', ctx.userId)
    .order('created_at', {
      ascending: false
    });

  if (error) {
    throwSupabaseError(
      'getWebhooks:list',
      'webhook_endpoints',
      error,
      ctx.userId
    );
  }

  return res.status(200).json(data || []);
}

async function createWebhook(body, res, ctx) {
  const { url, events } = body;

  if (!url || !/^https:\/\//.test(url)) {
    throw new SecurityError(
      'A valid https url is required',
      400
    );
  }

  const secret = crypto
    .randomBytes(24)
    .toString('hex');

  const {
    data,
    error
  } = await supabase
    .from('webhook_endpoints')
    .insert({
      user_id: ctx.userId,
      url,
      secret,
      events: (() => {
        const allowedEvents = new Set(['quiz.completed', 'api_key.created', 'api_key.revoked', 'webhook.test']);
        const selected = Array.isArray(events)
          ? [...new Set(events.map((event) => String(event).trim()).filter((event) => allowedEvents.has(event)))]
          : [];
        if (!selected.length) {
          throw new SecurityError('Select at least one webhook event', 400);
        }
        return selected;
      })(),
      is_active: true
    })
    .select(
      'id, url, events, is_active, created_at'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'createWebhook:insert',
      'webhook_endpoints',
      error,
      ctx.userId
    );
  }

  requireData(
    data,
    'createWebhook:insert',
    'webhook_endpoints',
    ctx.userId
  );

  return res.status(200).json({
    success: true,
    webhook: data,
    secret
  });
}

async function updateWebhook(body, res, ctx) {
  const {
    webhook_id,
    url,
    events,
    is_active
  } = body;

  if (!webhook_id) {
    throw new SecurityError(
      'webhook_id is required',
      400
    );
  }

  const updates = {};

  if (url !== undefined) {
    if (!/^https:\/\//.test(url)) {
      throw new SecurityError(
        'url must be https',
        400
      );
    }

    updates.url = url;
  }

  if (events !== undefined) {
    if (!Array.isArray(events) || events.length < 1) {
      throw new SecurityError('Select at least one webhook event', 400);
    }
    const allowedEvents = new Set(['quiz.completed', 'api_key.created', 'api_key.revoked', 'webhook.test']);
    const normalizedEvents = [...new Set(events.map((event) => String(event).trim()).filter((event) => allowedEvents.has(event)))];
    if (!normalizedEvents.length) {
      throw new SecurityError('No supported webhook events selected', 400);
    }
    updates.events = normalizedEvents;
  }

  if (is_active !== undefined) {
    updates.is_active = !!is_active;
  }

  if (!Object.keys(updates).length) {
    throw new SecurityError(
      'No webhook fields supplied for update',
      400
    );
  }

  const {
    data,
    error
  } = await supabase
    .from('webhook_endpoints')
    .update(updates)
    .eq('id', webhook_id)
    .eq('user_id', ctx.userId)
    .select(
      'id, url, events, is_active'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'updateWebhook:update',
      'webhook_endpoints',
      error,
      ctx.userId
    );
  }

  if (!data) {
    throw new SecurityError(
      'Webhook not found',
      404
    );
  }

  return res.status(200).json({
    success: true,
    webhook: data
  });
}

async function deleteWebhook(body, res, ctx) {
  const { webhook_id } = body;

  if (!webhook_id) {
    throw new SecurityError(
      'webhook_id is required',
      400
    );
  }

  const { data, error } = await supabase
    .from('webhook_endpoints')
    .delete()
    .eq('id', webhook_id)
    .eq('user_id', ctx.userId)
    .select('id')
    .maybeSingle();

  if (error) {
    throwSupabaseError(
      'deleteWebhook:delete',
      'webhook_endpoints',
      error,
      ctx.userId
    );
  }

  if (!data) {
    throw new SecurityError(
      'Webhook not found',
      404
    );
  }

  await dispatchWebhookEvent(ctx.userId, 'webhook.deleted', { id: data.id });

  return res.status(200).json({
    success: true
  });
}

async function testWebhook(body, res, ctx) {
  const { webhook_id } = body;
  if (!webhook_id) throw new SecurityError('webhook_id is required', 400);
  const { data: webhook, error } = await supabase
    .from('webhook_endpoints')
    .select('id, url, is_active')
    .eq('id', webhook_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (error) throwSupabaseError('testWebhook:find', 'webhook_endpoints', error, ctx.userId);
  if (!webhook) throw new SecurityError('Webhook not found', 404);
  if (!webhook.is_active) throw new SecurityError('Webhook is disabled', 409);
  await dispatchWebhookEvent(ctx.userId, 'webhook.test', { webhook_id: webhook.id, message: 'AliverBiopharm webhook test' });
  return res.status(200).json({ success: true, event: 'webhook.test' });
}

async function getNotificationPreferences(req, res, ctx) {
  const {
    data,
    error
  } = await supabase
    .from('notification_preferences')
    .select(
      'module, in_app, email, push'
    )
    .eq('user_id', ctx.userId);

  if (error) {
    throwSupabaseError(
      'getNotificationPreferences:list',
      'notification_preferences',
      error,
      ctx.userId
    );
  }

  return res.status(200).json(data || []);
}

async function updateNotificationPreferences(body, res, ctx) {
  const {
    module,
    in_app,
    email,
    push
  } = body;

  if (!module) {
    throw new SecurityError(
      'module is required',
      400
    );
  }

  const {
    data,
    error
  } = await supabase
    .from('notification_preferences')
    .upsert(
      {
        user_id: ctx.userId,
        module,
        in_app:
          in_app !== undefined
            ? !!in_app
            : undefined,
        email:
          email !== undefined
            ? !!email
            : undefined,
        push:
          push !== undefined
            ? !!push
            : undefined,
        updated_at: new Date().toISOString()
      },
      {
        onConflict: 'user_id,module'
      }
    )
    .select(
      'module, in_app, email, push'
    )
    .single();

  if (error) {
    throwSupabaseError(
      'updateNotificationPreferences:upsert',
      'notification_preferences',
      error,
      ctx.userId
    );
  }

  requireData(
    data,
    'updateNotificationPreferences:upsert',
    'notification_preferences',
    ctx.userId
  );

  return res.status(200).json({
    success: true,
    preference: data
  });
}

async function saveParentGuardian(body, res, ctx) {
  const {
    guardian_name,
    guardian_email,
    guardian_relationship
  } = body;

  if (!guardian_name || !guardian_email) {
    throw new SecurityError(
      'guardian_name and guardian_email are required',
      400
    );
  }

  const {
    data: existing,
    error: existingError
  } = await supabase
    .from('parental_consents')
    .select('id')
    .eq('minor_user_id', ctx.userId)
    .maybeSingle();

  if (existingError) {
    throwSupabaseError(
      'saveParentGuardian:find_existing',
      'parental_consents',
      existingError,
      ctx.userId
    );
  }

  if (existing) {
    const {
      data,
      error
    } = await supabase
      .from('parental_consents')
      .update({
        guardian_name,
        guardian_email,
        guardian_relationship
      })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throwSupabaseError(
        'saveParentGuardian:update',
        'parental_consents',
        error,
        ctx.userId
      );
    }

    return res.status(200).json({
      success: true,
      consent: data
    });
  }

  const {
    data,
    error
  } = await supabase
    .from('parental_consents')
    .insert({
      minor_user_id: ctx.userId,
      guardian_name,
      guardian_email,
      guardian_relationship,
      consent_status: 'pending'
    })
    .select()
    .single();

  if (error) {
    throwSupabaseError(
      'saveParentGuardian:insert',
      'parental_consents',
      error,
      ctx.userId
    );
  }

  return res.status(200).json({
    success: true,
    consent: data
  });
}

async function requestDataExport(res, ctx) {
  const userId = ctx.userId;

  let { data: request, error } = await supabase
    .from('user_export_requests')
    .select('id, status, download_url, expires_at')
    .eq('user_id', userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (error) {
    throwSupabaseError('requestDataExport:find_pending', 'user_export_requests', error, userId);
  }

  if (!request) {
    const inserted = await supabase
      .from('user_export_requests')
      .insert({ user_id: userId, status: 'pending' })
      .select('id, status, download_url, expires_at')
      .single();

    if (inserted.error) {
      throwSupabaseError('requestDataExport:insert', 'user_export_requests', inserted.error, userId);
    }

    request = inserted.data;
  }

  try {
    const { data: exportData, error: exportError } = await supabase.rpc(
      'export_user_data',
      { p_user_id: userId }
    );

    if (exportError) {
      throwSupabaseError('requestDataExport:generate', 'export_user_data', exportError, userId);
    }

    const exportPath = `exports/${userId}/aliverbiopharma-data-${Date.now()}.json`;
    const exportBody = Buffer.from(JSON.stringify(exportData, null, 2), 'utf8');

    const { error: uploadError } = await supabase.storage
      .from('private-exports')
      .upload(exportPath, exportBody, {
        contentType: 'application/json',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throwSupabaseError('requestDataExport:upload', 'storage.private-exports', uploadError, userId);
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    const { data: signed, error: signedError } = await supabase.storage
      .from('private-exports')
      .createSignedUrl(exportPath, 60 * 60);

    if (signedError || !signed?.signedUrl) {
      throwSupabaseError(
        'requestDataExport:signed_url',
        'storage.private-exports',
        signedError || new Error('Signed URL was not created'),
        userId
      );
    }

    const { data: readyRequest, error: updateError } = await supabase
      .from('user_export_requests')
      .update({
        status: 'ready',
        download_url: signed.signedUrl,
        completed_at: new Date().toISOString(),
        expires_at: expiresAt
      })
      .eq('id', request.id)
      .select('id, status, download_url, expires_at, completed_at')
      .single();

    if (updateError) {
      throwSupabaseError('requestDataExport:complete', 'user_export_requests', updateError, userId);
    }

    await supabase.from('audit_log').insert({
      actor_id: userId,
      action: 'request_data_export',
      target_type: 'user',
      target_id: userId,
      metadata: { status: 'ready' }
    });

    return res.status(200).json({
      success: true,
      request: readyRequest,
      already_pending: false
    });
  } catch (err) {
    await supabase
      .from('user_export_requests')
      .update({ status: 'failed' })
      .eq('id', request.id);

    throw err;
  }
}

async function requestAccountDeletion(res, ctx) {
  const userId = ctx.userId;

  const { data: existing, error: existingError } = await supabase
    .from('data_deletion_requests')
    .select('id, status')
    .eq('user_id', userId)
    .in('status', ['pending', 'processing'])
    .maybeSingle();

  if (existingError) {
    throwSupabaseError('requestAccountDeletion:find_existing', 'data_deletion_requests', existingError, userId);
  }

  if (existing) {
    return res.status(200).json({
      success: true,
      request: existing,
      already_pending: true
    });
  }

  const confirmationCode = crypto.randomBytes(6).toString('hex');

  const { data: request, error: insertError } = await supabase
    .from('data_deletion_requests')
    .insert({
      user_id: userId,
      status: 'processing',
      confirmation_code: confirmationCode
    })
    .select('id, status, requested_at')
    .single();

  if (insertError) {
    throwSupabaseError('requestAccountDeletion:insert', 'data_deletion_requests', insertError, userId);
  }

  await supabase.from('audit_log').insert({
    actor_id: userId,
    action: 'request_account_deletion',
    target_type: 'user',
    target_id: userId,
    metadata: { status: 'processing' }
  });

  const { data: userFiles, error: filesError } = await supabase
    .from('user_files')
    .select('file_path')
    .eq('user_id', userId);

  if (filesError) {
    await supabase.from('data_deletion_requests').update({ status: 'cancelled' }).eq('id', request.id);
    throwSupabaseError('requestAccountDeletion:list_files', 'user_files', filesError, userId);
  }

  const filePaths = (userFiles || []).map((file) => file.file_path).filter(Boolean);
  if (filePaths.length) {
    const { error: storageError } = await supabase.storage.from('uploads').remove(filePaths);
    if (storageError) console.error('[PROFILE] account deletion upload cleanup failed', storageError);
  }

  const { data: exportFiles, error: exportListError } = await supabase.storage
    .from('private-exports')
    .list(`exports/${userId}`, { limit: 1000 });

  if (exportListError) {
    console.error('[PROFILE] account deletion export cleanup listing failed', exportListError);
  } else if (exportFiles?.length) {
    const exportPaths = exportFiles
      .map((file) => `exports/${userId}/${file.name}`)
      .filter(Boolean);
    if (exportPaths.length) {
      const { error: exportStorageError } = await supabase.storage
        .from('private-exports')
        .remove(exportPaths);
      if (exportStorageError) {
        console.error('[PROFILE] account deletion export cleanup failed', exportStorageError);
      }
    }
  }

  const { data: deletionResult, error: deletionError } = await supabase.rpc(
    'delete_user_account',
    { p_user_id: userId }
  );

  if (deletionError) {
    await supabase
      .from('data_deletion_requests')
      .update({ status: 'cancelled' })
      .eq('id', request.id);
    throwSupabaseError('requestAccountDeletion:delete', 'delete_user_account', deletionError, userId);
  }

  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Clear-Site-Data', '"cache", "storage"');

  return res.status(200).json({
    success: true,
    deleted: deletionResult?.success === true,
    signed_out: true
  });
}

async function getProfile(req, res, ctx) {
  const userId = ctx.userId;

  console.log(
    `[PROFILE] get_profile started | user_id=${userId}`
  );

  const {
    data: profile,
    error
  } = await supabase
    .from('user_profiles')
    .select(
      'display_name, full_name, email, track, class_name, role, is_active, created_at, bio'
    )
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throwSupabaseError(
      'getProfile:select',
      'user_profiles',
      error,
      userId
    );
  }

  if (!profile) {
    const diagnostic =
      `Profile not found | operation=getProfile:select | table=user_profiles | user_id=${userId}`;

    console.error('[PROFILE]', diagnostic);

    throw new SecurityError(
      diagnostic,
      404
    );
  }

  console.log(
    `[PROFILE] get_profile success | user_id=${userId}`
  );

  return res.status(200).json(profile);
}

async function updateDisplayName(body, res, ctx) {
  const { display_name } = body;

  if (
    typeof display_name !== 'string' ||
    display_name.trim().length < 2 ||
    display_name.trim().length > 100
  ) {
    throw new SecurityError(
      'display_name must be between 2 and 100 characters',
      400
    );
  }

  const {
    data,
    error
  } = await supabase
    .from('user_profiles')
    .update({
      display_name: display_name.trim(),
      updated_at: new Date().toISOString()
    })
    .eq('user_id', ctx.userId)
    .select('display_name')
    .single();

  if (error) {
    throwSupabaseError(
      'updateDisplayName:update',
      'user_profiles',
      error,
      ctx.userId
    );
  }

  requireData(
    data,
    'updateDisplayName:update',
    'user_profiles',
    ctx.userId
  );

  return res.status(200).json({
    success: true,
    display_name: data.display_name
  });
}

async function getPendingLevelChanges(res) {
  const { data: requests, error } = await supabase
    .from('level_change_requests')
    .select('id, user_id, requested_track, requested_class, requested_level_id, requested_group_id, reason, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) throw new SecurityError('Failed to load pending curriculum requests', 500);

  const applications = await Promise.all((requests || []).map(async (request) => {
    const { data, error: userError } = await supabase.auth.admin.getUserById(request.user_id);
    if (userError) throw new SecurityError('Failed to load a curriculum applicant', 500);
    return {
      ...request,
      user_email: data?.user?.email || 'Unavailable',
      user_name: data?.user?.user_metadata?.full_name || null
    };
  }));

  return res.status(200).json(applications);
}

async function reviewLevelChange(body, res, ctx) {
  const requestId = Number(body.request_id);
  const action = String(body.action || '').trim().toLowerCase();

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    throw new SecurityError('A valid curriculum request is required', 400);
  }
  if (!['approve', 'reject'].includes(action)) {
    throw new SecurityError('Review action must be approve or reject', 400);
  }

  const { data, error } = await supabase.rpc('review_level_change_request', {
    p_request_id: requestId,
    p_action: action,
    p_admin_id: ctx.userId
  });

  if (error) {
    const message = error.message || '';
    if (message.includes('already been reviewed')) {
      throw new SecurityError('This curriculum request has already been reviewed', 409);
    }
    if (message.includes('not found')) {
      throw new SecurityError('Curriculum request not found', 404);
    }
    if (message.includes('invalid') || message.includes('Unsupported')) {
      throw new SecurityError('The requested curriculum level or class is no longer available', 400);
    }
    console.error('[LEVEL_CHANGE_REVIEW_ERROR]', error.message);
    throw new SecurityError('Unable to review this curriculum request', 500);
  }

  await supabase.from('audit_log').insert({
    actor_id: ctx.userId,
    action: action === 'approve' ? 'approve_level_change' : 'reject_level_change',
    target_type: 'level_change_request',
    target_id: String(requestId),
    metadata: { user_id: data?.user_id || null }
  });

  return res.status(200).json(data || { success: true });
}

async function requestLevelChange(body, res, ctx) {
  const requestedLevelId = String(body.requested_level_id || '').trim();
  const requestedGroupId = String(body.requested_group_id || '').trim();
  const requestedTrack = String(body.requested_track || '').trim();
  const requestedClass = String(body.requested_class || '').trim();
  const reason = String(body.reason || '').trim();

  if ((!requestedLevelId && !requestedTrack) || reason.length < 5 || reason.length > 1000) {
    throw new SecurityError('Choose a curriculum level and provide a reason of at least 5 characters', 400);
  }

  const levelByTrack = {
    'O-Level': 'O Level',
    'A-Level': 'A Level',
    Pharmacy: 'Pharmacy',
    'Ordinary Biology': 'O Level',
    'Advanced Biology': 'A Level'
  };
  const levelId = requestedLevelId || levelByTrack[requestedTrack] || null;
  let levelQuery = supabase
    .from('curriculum_levels')
    .select('id');
  levelQuery = levelId
    ? levelQuery.eq('id', levelId)
    : levelQuery.eq('display_name', requestedTrack);

  const { data: level, error: levelError } = await levelQuery.maybeSingle();

  if (levelError) throw new SecurityError('Unable to verify the requested curriculum level', 500);
  if (!level) throw new SecurityError('The requested curriculum level does not exist', 400);

  let groupQuery = supabase
    .from('curriculum_groups')
    .select('id, name, level_id')
    .eq('level_id', level.id)
    .eq('is_active', true);

  if (requestedGroupId) {
    groupQuery = groupQuery.eq('id', requestedGroupId);
  } else if (requestedClass) {
    groupQuery = groupQuery.eq('name', requestedClass);
  } else {
    groupQuery = groupQuery.order('sequence_order', { ascending: true }).limit(1);
  }

  const { data: group, error: groupError } = await groupQuery.maybeSingle();

  if (groupError) throw new SecurityError('Unable to verify the requested class', 500);
  if (!group) throw new SecurityError('The selected class does not belong to that curriculum level or is inactive', 400);

  const trackByLevelId = {
    'O Level': 'O-Level',
    'A Level': 'A-Level',
    Pharmacy: 'Pharmacy'
  };
  const track = trackByLevelId[level.id];
  if (!track) throw new SecurityError('Unsupported curriculum level', 400);

  const { data: existing, error: existingError } = await supabase
    .from('level_change_requests')
    .select('id, status')
    .eq('user_id', ctx.userId)
    .eq('status', 'pending')
    .maybeSingle();

  if (existingError) throw new SecurityError('Unable to check existing curriculum requests', 500);
  if (existing) {
    return res.status(200).json({ success: true, request: existing, already_pending: true });
  }

  const { data, error } = await supabase
    .from('level_change_requests')
    .insert({
      user_id: ctx.userId,
      requested_track: track,
      requested_class: group.name,
      requested_level_id: level.id,
      requested_group_id: group.id,
      reason,
      status: 'pending'
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new SecurityError('You already have a pending curriculum request', 409);
    throw new SecurityError('Unable to submit your curriculum request', 500);
  }

  const { data: currentProfile, error: currentProfileError } = await supabase
    .from('user_profiles')
    .select('active_level_id')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (currentProfileError) {
    throw new SecurityError('Unable to verify your current curriculum assignment', 500);
  }

  if (!currentProfile?.active_level_id) {
    const { error: pendingStatusError } = await supabase.from('user_profiles')
      .update({
        level_approval_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', ctx.userId);

    if (pendingStatusError) {
      throw new SecurityError('Unable to update curriculum approval status', 500);
    }
  }

  await supabase.from('audit_log').insert({
    actor_id: ctx.userId,
    action: 'request_level_change',
    target_type: 'user_profile',
    target_id: ctx.userId,
    metadata: {
      requested_track: track,
      requested_class: group.name,
      requested_level_id: level.id,
      requested_group_id: group.id
    }
  });

  return res.status(200).json({ success: true, request: data });
}
