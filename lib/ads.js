import { supabase, getUserClient } from './core.js';
import {
  parseAndValidateBody,
  requireAuth,
  requireAdmin,
  enforceCsrf,
  SecurityError,
} from './security-middleware.js';
import { hasActiveSubscription } from './subscriptions.js';

const MAX_FINGERPRINT_LENGTH = 128;
const MAX_PAGE_CONTEXT_LENGTH = 160;
const MAX_TEXT_LENGTH = 5000;
const MAX_NAME_LENGTH = 200;
const MAX_URL_LENGTH = 2048;
const IMPRESSION_WINDOW_MS = 60_000;
const MAX_IMPRESSIONS_PER_WINDOW = 5;
const ALLOWED_PAYMENT_STATUSES = new Set(['success', 'completed']);
const ALLOWED_REVIEW_DECISIONS = new Set(['approved', 'rejected']);
const ALLOWED_CAMPAIGN_CATEGORIES = new Set([
  'education',
  'scholarship',
  'career',
  'health_pharma',
  'institution_promo',
  'general',
]);
const ALLOWED_LEVELS = new Set(['O Level', 'A Level', 'Pharmacy']);

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET') {
    switch (path) {
      case 'serve':
        return serveAd(req, res, ctx);
      case 'config':
        return getAdConfig(req, res);
      case 'placements':
        return listPlacements(req, res);
      case 'scopes':
        return listTargetingScopes(req, res);
      case 'duration_tiers':
        return listDurationTiers(req, res);
      case 'campaigns':
        requireAdmin(ctx);
        return listCampaigns(req, res);
      default:
        throw new SecurityError('Invalid action', 400);
    }
  }

  if (req.method === 'POST') {
    const body = await parseAndValidateBody(req);

    switch (path) {
      case 'click':
        return recordClick(body, res, req, ctx);
      case 'create_advertiser':
        requireAuth(ctx);
        enforceCsrf(req, ctx);
        return createAdvertiser(body, res, ctx);
      case 'create_campaign':
        requireAuth(ctx);
        enforceCsrf(req, ctx);
        return createCampaign(body, res, ctx);
      case 'create_creative':
        requireAuth(ctx);
        enforceCsrf(req, ctx);
        return createCreative(body, res, ctx);
      case 'submit_placement':
        requireAuth(ctx);
        enforceCsrf(req, ctx);
        return submitPlacement(body, res, ctx);
      case 'verify_payment':
        requireAdmin(ctx);
        enforceCsrf(req, ctx);
        return verifyPayment(body, res, ctx);
      case 'review':
        requireAdmin(ctx);
        enforceCsrf(req, ctx);
        return reviewPlacement(body, res, ctx);
      default:
        throw new SecurityError('Invalid action', 400);
    }
  }

  throw new SecurityError('Method not allowed', 405);
}

async function getAdConfig(req, res) {
  const [
    levelsResult,
    groupsResult,
    categoriesResult,
    placementsResult,
    scopesResult,
    durationTiersResult,
  ] = await Promise.all([
    supabase
      .from('curriculum_levels')
      .select(`
        id,
        display_name,
        kind,
        group_label,
        unit_label,
        icon,
        color,
        display_order
      `)
      .order('display_order', { ascending: true }),

    supabase
      .from('curriculum_groups')
      .select(`
        id,
        level_id,
        name,
        description,
        icon,
        sequence_order,
        is_active
      `)
      .eq('is_active', true)
      .order('sequence_order', { ascending: true }),

    supabase
      .from('ad_campaign_categories')
      .select(`
        id,
        label,
        display_order,
        is_active
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true }),

    supabase
      .from('ad_placements')
      .select(`
        id,
        code,
        display_name,
        description,
        base_price_amount,
        currency,
        max_concurrent_ads,
        is_active,
        display_order,
        image_width,
        image_height,
        max_image_bytes
      `)
      .eq('is_active', true)
      .order('display_order', { ascending: true }),

    supabase
      .from('ad_targeting_scopes')
      .select(`
        id,
        scope_type,
        price_multiplier,
        description,
        is_active
      `)
      .eq('is_active', true),

    supabase
      .from('ad_pricing_duration_tiers')
      .select(`
        id,
        duration_days,
        price_factor,
        label,
        is_active
      `)
      .eq('is_active', true)
      .order('duration_days', { ascending: true }),
  ]);

  const results = [
    levelsResult,
    groupsResult,
    categoriesResult,
    placementsResult,
    scopesResult,
    durationTiersResult,
  ];

  const failed = results.find((result) => result.error);

  if (failed) {
    console.error('Failed to load ad configuration:', failed.error);
    return res.status(500).json({
      error: 'Unable to load advertising configuration.',
    });
  }

  const levels = levelsResult.data || [];
  const groups = groupsResult.data || [];

  return res.status(200).json({
    levels: levels.map((level) => ({
      ...level,
      groups: groups
        .filter((group) => group.level_id === level.id)
        .sort((a, b) => a.sequence_order - b.sequence_order),
    })),

    categories: categoriesResult.data || [],
    placements: placementsResult.data || [],
    scopes: scopesResult.data || [],
    duration_tiers: durationTiersResult.data || [],
  });
}

async function serveAd(req, res, ctx) {
  const query = req.query || {};
  const placementCode = normalizeCode(query.placement_code);
  const suppliedFingerprint = normalizeFingerprint(query.session_fingerprint);
  const requestedLevel = normalizeLevel(query.level_id);
  const requestedClass = normalizeText(query.class_name, 120);
  const pageContext = normalizeText(query.page_context, MAX_PAGE_CONTEXT_LENGTH);

  if (!placementCode || !suppliedFingerprint) {
    throw new SecurityError('placement_code and session_fingerprint required', 400);
  }

  if (ctx?.restricted || ctx?.fingerprintRejected) {
    return res.status(200).json(null);
  }

  let levelId = requestedLevel;
  let className = requestedClass;

  if (ctx?.authenticated && ctx.userId) {
    const premium = await hasActiveSubscription(ctx.userId);

    if (premium.has_premium) {
      return res.status(200).json(null);
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('active_level_id, class_name, is_active, account_status')
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (profileError) {
      throw new SecurityError('Unable to verify learner profile', 500);
    }

    if (!profile || profile.is_active === false || profile.account_status !== 'active') {
      return res.status(200).json(null);
    }

    levelId = normalizeLevel(profile.active_level_id);
    className = normalizeText(profile.class_name, 120);
  }

  const { data: placement, error: placementError } = await supabase
    .from('ad_placements')
    .select('id, code, is_active')
    .eq('code', placementCode)
    .eq('is_active', true)
    .maybeSingle();

  if (placementError) {
    throw new SecurityError('Failed to load ad placement', 500);
  }

  if (!placement) {
    return res.status(200).json(null);
  }

  const windowStart = new Date(Date.now() - IMPRESSION_WINDOW_MS).toISOString();

  const { count: recentCount, error: rateError } = await supabase
    .from('ad_impressions')
    .select('id, ad_campaign_placements!inner(placement_id)', { count: 'exact', head: true })
    .eq('session_fingerprint', suppliedFingerprint)
    .eq('ad_campaign_placements.placement_id', placement.id)
    .gte('created_at', windowStart);

  if (rateError) {
    throw new SecurityError('Failed to apply ad rate limit', 500);
  }

  if ((recentCount || 0) >= MAX_IMPRESSIONS_PER_WINDOW) {
    return res.status(200).json(null);
  }

  const today = new Date().toISOString().slice(0, 10);

  const { data: candidates, error: candidatesError } = await supabase
    .from('ad_campaign_placements')
    .select(`
      id,
      lifecycle_status,
      start_date,
      end_date,
      ad_campaigns!inner (
        id,
        title,
        content_category,
        landing_url,
        status,
        ad_advertisers!inner (
          id,
          name,
          verification_status,
          is_active
        )
      ),
      ad_creatives!inner (
        id,
        headline,
        body_text,
        cta_text,
        file_id,
        is_active,
        version
      ),
      ad_targeting_scopes!inner (
        scope_type,
        is_active
      )
    `)
    .eq('placement_id', placement.id)
    .eq('review_status', 'approved')
    .eq('payment_status', 'paid')
    .in('lifecycle_status', ['scheduled', 'active'])
    .lte('start_date', today)
    .gte('end_date', today)
    .eq('ad_campaigns.status', 'submitted')
    .eq('ad_campaigns.ad_advertisers.verification_status', 'verified')
    .eq('ad_campaigns.ad_advertisers.is_active', true)
    .eq('ad_creatives.is_active', true)
    .eq('ad_targeting_scopes.is_active', true)
    .limit(100);

  if (candidatesError) {
    throw new SecurityError('Failed to select advertisement', 500);
  }

  const eligible = [];

  for (const candidate of candidates || []) {
    const scopeType = candidate.ad_targeting_scopes?.scope_type;

    if (scopeType === 'all_levels') {
      eligible.push(candidate);
      continue;
    }

    const { data: targets, error: targetError } = await supabase
      .from('ad_campaign_targets')
      .select('level_id, class_name')
      .eq('campaign_placement_id', candidate.id);

    if (targetError) {
      continue;
    }

    const matches = (targets || []).some((target) => {
      const targetLevel = normalizeLevel(target.level_id);
      const targetClass = normalizeText(target.class_name, 120);

      if (scopeType === 'specific_level') {
        return !!levelId && targetLevel === levelId;
      }

      if (scopeType === 'specific_class') {
        return (
          !!className &&
          targetClass === className &&
          (!targetLevel || targetLevel === levelId)
        );
      }

      return false;
    });

    if (matches) {
      eligible.push(candidate);
    }
  }

  if (!eligible.length) {
    return res.status(200).json(null);
  }

  const selected = chooseCandidate(eligible);
  const creative = selected.ad_creatives;
  const campaign = selected.ad_campaigns;
  const advertiser = campaign?.ad_advertisers;

  let imageUrl = null;

  if (creative?.file_id) {
    imageUrl = await resolveAdImageUrl(creative.file_id);
  }

  const { data: impression, error: impressionError } = await supabase
    .from('ad_impressions')
    .insert({
      campaign_placement_id: selected.id,
      user_id: ctx?.userId || null,
      session_fingerprint: suppliedFingerprint,
      is_anonymous: !ctx?.authenticated,
      page_context: pageContext || null,
    })
    .select('id')
    .single();

  if (impressionError || !impression) {
    throw new SecurityError('Failed to record ad impression', 500);
  }

  if (selected.lifecycle_status === 'scheduled') {
    await supabase
      .from('ad_campaign_placements')
      .update({ lifecycle_status: 'active', updated_at: new Date().toISOString() })
      .eq('id', selected.id)
      .eq('lifecycle_status', 'scheduled');
  }

  return res.status(200).json({
    impression_id: impression.id,
    campaign_placement_id: selected.id,
    advertiser_name: advertiser?.name || null,
    headline: safeText(creative?.headline),
    body_text: safeText(creative?.body_text),
    cta_text: safeText(creative?.cta_text) || 'Learn more',
    landing_url: safeExternalUrl(campaign?.landing_url),
    image_url: imageUrl,
    image_file_id: creative?.file_id || null,
  });
}

async function recordClick(body, res, req, ctx) {
  const impressionId = normalizeUuid(body?.impression_id);
  const suppliedFingerprint = normalizeFingerprint(body?.session_fingerprint);

  if (!impressionId) {
    throw new SecurityError('Valid impression_id required', 400);
  }

  let fingerprintToUse = suppliedFingerprint;

  if (ctx?.authenticated) {
    enforceCsrf(req, ctx);
    fingerprintToUse = ctx.fingerprint;
  } else if (!suppliedFingerprint) {
    throw new SecurityError('Valid session_fingerprint required', 400);
  }

  const client = ctx?.authenticated ? getUserClient(ctx.userId) : supabase;

  const { error: clickError } = await client.rpc('fn_record_ad_click', {
    p_impression_id: impressionId,
    p_session_fingerprint: fingerprintToUse,
  });

  if (clickError) {
    throw mapAdRpcError(clickError, 'Failed to record ad click');
  }

  return res.status(200).json({ success: true });
}

async function listPlacements(req, res) {
  const { data, error } = await supabase
    .from('ad_placements')
    .select('id, code, display_name, description, base_price_amount, currency, max_concurrent_ads, is_active')
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) {
    throw new SecurityError('Failed to fetch ad placements', 500);
  }

  return res.status(200).json(data || []);
}

async function listTargetingScopes(req, res) {
  const { data, error } = await supabase
    .from('ad_targeting_scopes')
    .select('id, scope_type, price_multiplier, description, is_active')
    .eq('is_active', true)
    .order('price_multiplier', { ascending: true });

  if (error) {
    throw new SecurityError('Failed to fetch targeting scopes', 500);
  }

  return res.status(200).json(data || []);
}

async function listDurationTiers(req, res) {
  const { data, error } = await supabase
    .from('ad_pricing_duration_tiers')
    .select('id, duration_days, price_factor, label, is_active')
    .eq('is_active', true)
    .order('duration_days', { ascending: true });

  if (error) {
    throw new SecurityError('Failed to fetch duration tiers', 500);
  }

  return res.status(200).json(data || []);
}

async function listCampaigns(req, res) {
  const queryParams = req.query || {};

  const status = normalizeEnum(queryParams.status, [
    'scheduled',
    'active',
    'paused',
    'expired',
    'cancelled',
  ]);

  const paymentStatus = normalizeEnum(queryParams.payment_status, [
    'pending_payment',
    'paid',
    'refunded',
    'failed',
  ]);

  const reviewStatus = normalizeEnum(queryParams.review_status, [
    'pending_review',
    'approved',
    'rejected',
  ]);

  let query = supabase
    .from('ad_campaign_placements')
    .select(`
      *,
      ad_campaigns!inner (
        *,
        ad_advertisers!inner (
          id,
          name,
          created_by,
          verification_status
        )
      ),
      ad_creatives!inner (
        id,
        headline,
        cta_text,
        is_active,
        version
      ),
      ad_placements!inner (
        id,
        code,
        display_name
      ),
      ad_targeting_scopes!inner (
        id,
        scope_type
      ),
      ad_pricing_duration_tiers!inner (
        id,
        duration_days,
        label
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('lifecycle_status', status);
  }

  if (paymentStatus) {
    query = query.eq('payment_status', paymentStatus);
  }

  if (reviewStatus) {
    query = query.eq('review_status', reviewStatus);
  }

  const { data, error } = await query;

  if (error) {
    throw new SecurityError('Failed to fetch ad campaigns', 500);
  }

  return res.status(200).json(data || []);
}

async function createAdvertiser(body, res, ctx) {
  const name = normalizeText(body?.name, MAX_NAME_LENGTH);
  const contactEmail = normalizeEmail(body?.contact_email);
  const contactPhone = normalizeText(body?.contact_phone, 60);
  const website = normalizeHttpUrl(body?.website);
  const institutionId = normalizeUuid(body?.institution_id);

  if (!name || !contactEmail) {
    throw new SecurityError('name and valid contact_email required', 400);
  }

  const { data: existing, error: existingError } = await supabase
    .from('ad_advertisers')
    .select('id, name, contact_email, contact_phone, website, verification_status, is_active')
    .eq('created_by', ctx.userId)
    .eq('contact_email', contactEmail)
    .maybeSingle();

  if (existingError) {
    throw new SecurityError('Failed to check advertiser', 500);
  }

  if (existing) {
    return res.status(200).json(existing);
  }

  if (institutionId) {
    const { data: institution, error: institutionError } = await supabase
      .from('institutions')
      .select('id, created_by, verification_status')
      .eq('id', institutionId)
      .maybeSingle();

    if (institutionError) {
      throw new SecurityError('Failed to verify institution', 500);
    }

    if (!institution || institution.created_by !== ctx.userId) {
      throw new SecurityError('Institution not found or not owned by you', 403);
    }
  }

  const { data, error } = await supabase
    .from('ad_advertisers')
    .insert({
      institution_id: institutionId || null,
      name,
      contact_email: contactEmail,
      contact_phone: contactPhone || null,
      website: website || null,
      created_by: ctx.userId,
    })
    .select('id, institution_id, name, contact_email, contact_phone, website, verification_status, is_active')
    .single();

  if (error) {
    throw new SecurityError('Failed to create advertiser', 500);
  }

  return res.status(201).json(data);
}

async function createCampaign(body, res, ctx) {
  const advertiserId = normalizeUuid(body?.advertiser_id);
  const title = normalizeText(body?.title, MAX_NAME_LENGTH);
  const category = normalizeEnum(body?.content_category, [...ALLOWED_CAMPAIGN_CATEGORIES]);
  const landingUrl = normalizeHttpUrl(body?.landing_url);

  if (!advertiserId || !title || !category || !landingUrl) {
    throw new SecurityError(
      'advertiser_id, title, content_category and valid landing_url required',
      400
    );
  }

  const advertiser = await getOwnedAdvertiser(advertiserId, ctx);

  if (!advertiser) {
    throw new SecurityError('Advertiser not found or not authorized', 404);
  }

  if (advertiser.verification_status === 'suspended' || advertiser.is_active === false) {
    throw new SecurityError('Advertiser account is not active', 403);
  }

  const { data, error } = await supabase
    .from('ad_campaigns')
    .insert({
      advertiser_id: advertiserId,
      title,
      content_category: category,
      landing_url: landingUrl,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw new SecurityError('Failed to create ad campaign', 500);
  }

  return res.status(201).json(data);
}

async function createCreative(body, res, ctx) {
  const campaignId = normalizeUuid(body?.campaign_id);
  const fileId = normalizePositiveInteger(body?.file_id);
  const headline = normalizeText(body?.headline, 180);
  const bodyText = normalizeText(body?.body_text, MAX_TEXT_LENGTH);
  const ctaText = normalizeText(body?.cta_text, 80) || 'Learn more';

  if (!campaignId || !headline) {
    throw new SecurityError('campaign_id and headline required', 400);
  }

  const campaign = await getOwnedCampaign(campaignId, ctx);

  if (!campaign) {
    throw new SecurityError('Campaign not found or not authorized', 404);
  }

  if (fileId) {
    await validateAdImageFile(fileId, ctx.userId);
  }

  const { data, error } = await supabase
    .from('ad_creatives')
    .insert({
      campaign_id: campaignId,
      file_id: fileId || null,
      headline,
      body_text: bodyText || null,
      cta_text: ctaText,
      version: 1,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    throw new SecurityError('Failed to create ad creative', 500);
  }

  return res.status(201).json(data);
}

async function submitPlacement(body, res, ctx) {
  const campaignId = normalizeUuid(body?.campaign_id);
  const placementId = normalizeUuid(body?.placement_id);
  const scopeId = normalizeUuid(body?.scope_id);
  const durationTierId = normalizeUuid(body?.duration_tier_id);
  const creativeId = normalizeUuid(body?.creative_id);
  const startDate = normalizeDate(body?.start_date);
  const levelId = normalizeLevel(body?.level_id);
  const className = normalizeText(body?.class_name, 120);

  if (!campaignId || !placementId || !scopeId || !durationTierId || !creativeId || !startDate) {
    throw new SecurityError(
      'campaign_id, placement_id, scope_id, duration_tier_id, creative_id and valid start_date required',
      400
    );
  }

  const userClient = getUserClient(ctx.userId);

  const { data: newPlacementId, error: submitError } = await userClient.rpc(
    'fn_submit_ad_campaign_placement',
    {
      p_campaign_id: campaignId,
      p_placement_id: placementId,
      p_scope_id: scopeId,
      p_duration_tier_id: durationTierId,
      p_creative_id: creativeId,
      p_start_date: startDate,
      p_level_id: levelId || null,
      p_class_name: className || null,
    }
  );

  if (submitError) {
    throw mapAdRpcError(submitError, 'Failed to submit ad placement');
  }

  if (!newPlacementId) {
    throw new SecurityError('Failed to submit ad placement', 500);
  }

  const { data: created, error: fetchError } = await supabase
    .from('ad_campaign_placements')
    .select('id, final_price, currency, start_date, end_date, payment_status, review_status, lifecycle_status')
    .eq('id', newPlacementId)
    .maybeSingle();

  if (fetchError || !created) {
    throw new SecurityError('Placement submitted, but the confirmation could not be loaded', 500);
  }

  return res.status(201).json({
    success: true,
    campaign_placement_id: created.id,
    placement: created,
  });
}

async function verifyPayment(body, res, ctx) {
  const campaignPlacementId = normalizeUuid(body?.campaign_placement_id);
  const paymentId = normalizePositiveInteger(body?.payment_id);

  if (!campaignPlacementId || !paymentId) {
    throw new SecurityError('campaign_placement_id and valid payment_id required', 400);
  }

  const { data: placement, error: placementError } = await supabase
    .from('ad_campaign_placements')
    .select(`
      id,
      final_price,
      currency,
      payment_status,
      campaign_id,
      ad_campaigns!inner (
        ad_advertisers!inner(created_by)
      )
    `)
    .eq('id', campaignPlacementId)
    .maybeSingle();

  if (placementError) {
    throw new SecurityError('Failed to validate ad placement', 500);
  }

  if (!placement) {
    throw new SecurityError('Campaign placement not found', 404);
  }

  if (placement.payment_status === 'paid') {
    throw new SecurityError('Payment already verified for this placement', 409);
  }

  if (placement.ad_campaigns?.ad_advertisers?.created_by === ctx.userId) {
    throw new SecurityError('Self-verification is not permitted', 403);
  }

  const { data: payment, error: paymentError } = await supabase
    .from('momo_donations')
    .select('id, amount, status, payment_type, user_id')
    .eq('id', paymentId)
    .maybeSingle();

  if (paymentError) {
    throw new SecurityError('Failed to validate payment', 500);
  }

  if (!payment) {
    throw new SecurityError('Payment not found', 404);
  }

  if (!ALLOWED_PAYMENT_STATUSES.has(payment.status)) {
    throw new SecurityError('Payment has not been successfully completed', 400);
  }

  if (payment.user_id && payment.user_id !== placement.ad_campaigns?.ad_advertisers?.created_by) {
    throw new SecurityError('Payment owner does not match the advertiser', 400);
  }

  const paymentAmount = Number(String(payment.amount).replace(/,/g, ''));
  const requiredAmount = Number(placement.final_price);

  if (!Number.isFinite(paymentAmount) || !Number.isFinite(requiredAmount) || paymentAmount < requiredAmount) {
    throw new SecurityError('Payment amount is insufficient for this placement', 400);
  }

  const userClient = getUserClient(ctx.userId);

  const { error: verifyError } = await userClient.rpc('fn_verify_ad_payment', {
    p_campaign_placement_id: campaignPlacementId,
    p_payment_id: paymentId,
  });

  if (verifyError) {
    throw mapAdRpcError(verifyError, 'Failed to verify ad payment');
  }

  const { data: updated, error: fetchError } = await supabase
    .from('ad_campaign_placements')
    .select('id, payment_id, payment_status')
    .eq('id', campaignPlacementId)
    .maybeSingle();

  if (fetchError || !updated) {
    throw new SecurityError('Payment verified, but the confirmation could not be loaded', 500);
  }

  return res.status(200).json({ success: true, data: updated });
}

async function reviewPlacement(body, res, ctx) {
  const campaignPlacementId = normalizeUuid(body?.campaign_placement_id);
  const decision = normalizeEnum(body?.decision, [...ALLOWED_REVIEW_DECISIONS]);
  const reason = normalizeText(body?.reason, 1000);

  if (!campaignPlacementId || !decision) {
    throw new SecurityError('campaign_placement_id and valid decision required', 400);
  }

  if (decision === 'rejected' && !reason) {
    throw new SecurityError('A rejection reason is required', 400);
  }

  const userClient = getUserClient(ctx.userId);

  const { error: reviewError } = await userClient.rpc('fn_review_ad_campaign_placement', {
    p_campaign_placement_id: campaignPlacementId,
    p_decision: decision,
    p_reason: reason || null,
  });

  if (reviewError) {
    throw mapAdRpcError(reviewError, 'Failed to review ad placement');
  }

  const { data: updated, error: fetchError } = await supabase
    .from('ad_campaign_placements')
    .select('id, review_status, rejection_reason, reviewed_by, reviewed_at, lifecycle_status')
    .eq('id', campaignPlacementId)
    .maybeSingle();

  if (fetchError || !updated) {
    throw new SecurityError('Review recorded, but the confirmation could not be loaded', 500);
  }

  return res.status(200).json({ success: true, data: updated });
}

async function getOwnedAdvertiser(advertiserId, ctx) {
  let query = supabase
    .from('ad_advertisers')
    .select('id, created_by, verification_status, is_active, name')
    .eq('id', advertiserId);

  if (!ctx.adminData) {
    query = query.eq('created_by', ctx.userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new SecurityError('Failed to load advertiser', 500);
  }

  return data || null;
}

async function getOwnedCampaign(campaignId, ctx) {
  let query = supabase
    .from('ad_campaigns')
    .select('id, advertiser_id, title, status, ad_advertisers!inner(id, created_by, verification_status, is_active)')
    .eq('id', campaignId);

  if (!ctx.adminData) {
    query = query.eq('ad_advertisers.created_by', ctx.userId);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw new SecurityError('Failed to load campaign', 500);
  }

  return data || null;
}

async function resolveAdImageUrl(fileId) {
  const { data: file, error } = await supabase
    .from('user_files')
    .select('id, file_url, file_path, file_mime_type, is_active')
    .eq('id', fileId)
    .maybeSingle();

  if (error || !file || file.is_active === false) {
    return null;
  }

  if (!String(file.file_mime_type || '').toLowerCase().startsWith('image/')) {
    return null;
  }

  const directUrl = safeHttpUrl(file.file_url);

  if (directUrl) {
    return directUrl;
  }

  const path = String(file.file_path || '').trim();

  if (!path) {
    return null;
  }

  const bucket = process.env.ADS_STORAGE_BUCKET || process.env.USER_FILES_STORAGE_BUCKET;

  if (!bucket) {
    return null;
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, 3600);

  if (signedError) {
    return null;
  }

  return safeHttpUrl(signed?.signedUrl);
}

async function validateAdImageFile(fileId, userId) {
  const { data: file, error } = await supabase
    .from('user_files')
    .select('id, user_id, file_url, file_path, file_mime_type, is_active')
    .eq('id', fileId)
    .maybeSingle();

  if (error) {
    throw new SecurityError('Failed to validate creative image', 500);
  }

  if (!file || file.is_active === false) {
    throw new SecurityError('Creative image not found or inactive', 400);
  }

  if (file.user_id !== userId) {
    throw new SecurityError('You do not own this creative image', 403);
  }

  if (!String(file.file_mime_type || '').toLowerCase().startsWith('image/')) {
    throw new SecurityError('Creative file must be an image', 400);
  }

  if (!safeHttpUrl(file.file_url) && !String(file.file_path || '').trim()) {
    throw new SecurityError('Creative image has no usable file location', 400);
  }
}

function mapAdRpcError(error, fallbackMessage) {
  const code = error?.code;
  const message = error?.message || fallbackMessage;

  if (code === '42501') {
    return new SecurityError(message, 403);
  }

  if (code === 'P0002') {
    return new SecurityError(message, 404);
  }

  if (code === 'P0003' || code === 'P0004') {
    return new SecurityError(message, 409);
  }

  if (code === 'P0001' || code === 'P0005') {
    return new SecurityError(message, 400);
  }

  console.error('[ad_rpc_error]', error);
  return new SecurityError(fallbackMessage, 500);
}

function chooseCandidate(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function normalizeText(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== 'string') {
    return '';
  }

  const valueTrimmed = value.trim();

  if (!valueTrimmed) {
    return '';
  }

  return valueTrimmed.slice(0, maxLength);
}

function safeText(value) {
  return normalizeText(value, MAX_TEXT_LENGTH);
}

function normalizeCode(value) {
  return normalizeText(value, 100).replace(/[^a-zA-Z0-9_-]/g, '');
}

function normalizeFingerprint(value) {
  const fingerprint = normalizeText(value, MAX_FINGERPRINT_LENGTH);

  if (!fingerprint || !/^[A-Za-z0-9._:-]{16,128}$/.test(fingerprint)) {
    return '';
  }

  return fingerprint;
}

function normalizeUuid(value) {
  if (typeof value !== 'string') {
    return '';
  }

  const normalized = value.trim().toLowerCase();

  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(normalized)
    ? normalized
    : '';
}

function normalizePositiveInteger(value) {
  const number = Number(value);

  if (!Number.isSafeInteger(number) || number <= 0) {
    return null;
  }

  return number;
}

function normalizeEmail(value) {
  const email = normalizeText(value, 254).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return '';
  }

  return email;
}

function normalizeEnum(value, allowed) {
  const normalized = normalizeText(value, 80);
  return allowed.includes(normalized) ? normalized : '';
}

function normalizeLevel(value) {
  const normalized = normalizeText(value, 40);
  return ALLOWED_LEVELS.has(normalized) ? normalized : '';
}

function normalizeDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return '';
  }

  const date = new Date(`${value}T00:00:00Z`);

  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    return '';
  }

  return value;
}

function normalizeHttpUrl(value) {
  const url = normalizeText(value, MAX_URL_LENGTH);

  if (!url) {
    return '';
  }

  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return '';
    }

    if (parsed.username || parsed.password) {
      return '';
    }

    return parsed.toString();
  } catch {
    return '';
  }
}

function safeHttpUrl(value) {
  return normalizeHttpUrl(value) || null;
}

function safeExternalUrl(value) {
  return safeHttpUrl(value) || '';
}
