/* lib/authorization.js
 * Central server-side authorization resolver.
 *
 * This module is intentionally independent from lib/premium.js to avoid
 * circular authorization dependencies. Resource handlers should call this
 * resolver before performing protected work.
 */
import { supabase } from './core.js';
import { getUserCurriculumScope } from './curriculum.js';
import { hasActiveSubscription } from './subscriptions.js';
import { SecurityError } from './security-middleware.js';

const CONTENT_SCOPE = {
  unit: { table: 'curriculum_units', id: 'id', group: 'group_id' },
  block: { table: 'curriculum_unit_blocks', id: 'id', groupViaUnit: true },
  note: { table: 'notes', id: 'id', groupViaUnit: true },
  pdf: { table: 'pdf_resources', id: 'id', groupViaUnit: true },
  past_paper: { table: 'past_papers', id: 'id', groupViaUnit: true },
  article: { table: 'articles', id: 'id', groupViaUnit: true },
  video: { table: 'videos', id: 'id', groupViaUnit: true }
};

const PREMIUM_COLUMNS = {
  unit: ['curriculum_units', 'is_premium'],
  block: ['curriculum_unit_blocks', 'is_premium'],
  pdf: ['pdf_resources', 'is_premium'],
  past_paper: ['past_papers', 'is_premium'],
  article: ['articles', 'is_premium'],
  video: ['videos', 'is_premium'],
  note: ['notes', 'is_premium']
};

function normalizedId(value) {
  return value === undefined || value === null ? null : String(value);
}

async function getContentRecord(contentType, contentId) {
  const mapping = CONTENT_SCOPE[contentType];
  if (!mapping || contentId === null) return null;

  const { data, error } = await supabase
    .from(mapping.table)
    .select('*')
    .eq(mapping.id, contentId)
    .maybeSingle();

  if (error) throw new SecurityError('Authorization lookup failed', 500);
  return data || null;
}

async function getContentGroupId(contentType, record) {
  if (!record) return null;

  if (contentType === 'unit') return record.group_id || null;

  const unitId = record.unit_id;
  if (!unitId && contentType === 'block') return null;
  if (!unitId) return null;

  const { data, error } = await supabase
    .from('curriculum_units')
    .select('group_id')
    .eq('id', unitId)
    .maybeSingle();

  if (error) throw new SecurityError('Authorization scope lookup failed', 500);
  return data?.group_id || null;
}

async function isUserRestricted(userId, contentType, contentId, restrictionType) {
  if (!userId) return false;

  const { data, error } = await supabase
    .from('content_restrictions')
    .select('content_id, expires_at')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('restriction_type', restrictionType);

  if (error) throw new SecurityError('Authorization restriction lookup failed', 500);

  const targetId = normalizedId(contentId);
  const now = Date.now();

  return (data || []).some((row) => {
    if (row.expires_at && new Date(row.expires_at).getTime() <= now) return false;
    return row.content_id === null || normalizedId(row.content_id) === targetId;
  });
}

async function hasLegacyPremiumGrant(userId, contentType, contentId) {
  // premium_grants currently uses email + UUID content_id. Keep support for
  // existing UUID grants, but do not treat arbitrary client-supplied identity
  // as authorization input.
  if (!userId || contentId === null) return false;

  const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
  if (authError) throw new SecurityError('Authorization identity lookup failed', 500);

  const email = authUser?.user?.email?.trim().toLowerCase();
  if (!email) return false;

  const id = normalizedId(contentId);
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  if (!isUuid) return false;

  const { data, error } = await supabase
    .from('premium_grants')
    .select('id, expires_at')
    .eq('email', email)
    .eq('content_type', contentType)
    .eq('content_id', id)
    .maybeSingle();

  if (error) throw new SecurityError('Authorization entitlement lookup failed', 500);
  if (!data) return false;

  return !data.expires_at || new Date(data.expires_at).getTime() > Date.now();
}

async function resolvePremium(userId, contentType, contentId) {
  const subscription = await hasActiveSubscription(userId);
  if (subscription.has_premium) {
    return {
      authorized: true,
      source: 'subscription',
      plan: subscription.plan || null,
      expires_at: subscription.expires_at || null
    };
  }

  const grant = await hasLegacyPremiumGrant(userId, contentType, contentId);
  if (grant) {
    return { authorized: true, source: 'grant', plan: null, expires_at: null };
  }

  return {
    authorized: false,
    source: null,
    plan: null,
    expires_at: null
  };
}

/**
 * Resolve one protected action. The caller must supply the resource identity.
 * Frontend state is never trusted as proof of premium or curriculum access.
 */
export async function resolveActionAccess(ctx, {
  actionKey,
  contentType = null,
  contentId = null,
  requiresAuth = true,
  requiresPremium = false,
  restrictionType = 'view',
  enforceCurriculum = true
} = {}) {
  if (!actionKey) throw new SecurityError('actionKey required', 400);

  if (!ctx?.authenticated || !ctx?.userId) {
    return {
      action_key: actionKey,
      authorized: !requiresAuth,
      reason: requiresAuth ? 'unauthenticated' : null,
      requires_auth: requiresAuth,
      requires_premium: !!requiresPremium,
      premium_authorized: false
    };
  }

  // Gateman already rejects disabled/suspended/locked accounts. Admin status is
  // still an authorization layer: administrators may operate outside learner
  // curriculum scope and premium entitlement.
  if (ctx.adminData) {
    return {
      action_key: actionKey,
      authorized: true,
      reason: null,
      requires_auth: requiresAuth,
      requires_premium: !!requiresPremium,
      premium_authorized: true,
      admin_bypass: true
    };
  }

  if (contentType && contentId !== null) {
    const record = await getContentRecord(contentType, contentId);
    if (!record) {
      return {
        action_key: actionKey,
        authorized: false,
        reason: 'content_not_found',
        requires_auth: requiresAuth,
        requires_premium: !!requiresPremium,
        premium_authorized: false
      };
    }

    if (enforceCurriculum && CONTENT_SCOPE[contentType]) {
      const scope = await getUserCurriculumScope(ctx.userId);
      if (!scope?.active_group_id) {
        return {
          action_key: actionKey,
          authorized: false,
          reason: 'curriculum_context_required',
          requires_auth: requiresAuth,
          requires_premium: !!requiresPremium,
          premium_authorized: false
        };
      }

      const groupId = await getContentGroupId(contentType, record);
      if (groupId && String(groupId) !== String(scope.active_group_id)) {
        return {
          action_key: actionKey,
          authorized: false,
          reason: 'curriculum_scope_denied',
          requires_auth: requiresAuth,
          requires_premium: !!requiresPremium,
          premium_authorized: false
        };
      }
    }

    if (await isUserRestricted(ctx.userId, contentType, contentId, restrictionType)) {
      return {
        action_key: actionKey,
        authorized: false,
        reason: 'restricted',
        requires_auth: requiresAuth,
        requires_premium: !!requiresPremium,
        premium_authorized: false
      };
    }

    // Resource metadata is authoritative. A caller cannot downgrade a premium
    // resource by sending requiresPremium=false.
    const metadataPremium = PREMIUM_COLUMNS[contentType];
    if (metadataPremium && Object.prototype.hasOwnProperty.call(record, metadataPremium[1])) {
      requiresPremium = requiresPremium || record[metadataPremium[1]] === true;
    }
  }

  let premium = {
    authorized: true,
    source: null,
    plan: null,
    expires_at: null
  };

  if (requiresPremium) {
    premium = await resolvePremium(ctx.userId, contentType, contentId);

    if (!premium.authorized) {
      return {
        action_key: actionKey,
        authorized: false,
        reason: 'premium_required',
        requires_auth: requiresAuth,
        requires_premium: true,
        premium_authorized: false
      };
    }
  }

  return {
    action_key: actionKey,
    authorized: true,
    reason: null,
    requires_auth: requiresAuth,
    requires_premium: !!requiresPremium,
    premium_authorized: !!premium.authorized,
    premium_source: premium.source,
    premium_expires_at: premium.expires_at
  };
}


async function resolveQuizBlockPremium(userId, unitId, blockNumber) {
  const { data: block, error } = await supabase
    .from('curriculum_unit_blocks')
    .select('unit_id, block_number, is_premium')
    .eq('unit_id', unitId)
    .eq('block_number', blockNumber)
    .maybeSingle();

  if (error) throw new SecurityError('Quiz block authorization lookup failed', 500);
  if (!block) return { exists: false, premium: false };

  return { exists: true, premium: block.is_premium === true };
}

export async function requireQuizBlockAccess(ctx, { unitId, blockNumber } = {}) {
  if (!Number.isInteger(Number(blockNumber)) || blockNumber < 0) {
    throw new SecurityError('Invalid quiz block', 400);
  }

  const unitResult = await requireActionAccess(ctx, {
    actionKey: 'quiz_start',
    contentType: 'unit',
    contentId: unitId,
    restrictionType: 'quiz_start'
  });

  const block = await resolveQuizBlockPremium(ctx.userId, unitId, Number(blockNumber));
  if (!block.exists) throw new SecurityError('Quiz block not found', 404);

  if (!block.premium) return unitResult;

  const premium = await resolvePremium(ctx.userId, 'block', unitId);
  if (!premium.authorized) {
    const result = {
      action_key: 'quiz_start',
      authorized: false,
      reason: 'premium_required',
      requires_auth: true,
      requires_premium: true,
      premium_authorized: false,
      premium_scope: 'block'
    };
    const error = new SecurityError('This quiz block requires premium access.', 403);
    error.authorization = result;
    throw error;
  }

  return {
    ...unitResult,
    requires_premium: true,
    premium_authorized: true,
    premium_source: premium.source,
    premium_expires_at: premium.expires_at,
    premium_scope: 'block'
  };
}

export function requireActionAccess(ctx, options) {
  return resolveActionAccess(ctx, options).then((result) => {
    if (!result.authorized) {
      const status = result.reason === 'unauthenticated' ? 401 : 403;
      const error = new SecurityError(result.reason || 'Not authorized', status);
      error.authorization = result;
      throw error;
    }

    return result;
  });
}
