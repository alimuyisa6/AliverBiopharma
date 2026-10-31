/* lib/subscriptions.js */
import { supabase, auditLog } from './core.js';
import crypto from 'crypto';
import {
  parseAndValidateBody,
  requireAuth,
  requireAdmin,
  SecurityError,
} from './security-middleware.js';
import { createNotification } from './notifications.js';

const INSTANT_PAYMENT_STATUSES = ['success', 'completed'];

export async function handler(req, res, path, ctx) {
  if (req.method === 'POST' && path === 'nowpayments_ipn') {
    return handleNowPaymentsIpn(req, res);
  }

  if (req.method === 'GET') {
    return handleGet(path, req, res, ctx);
  }
  if (req.method === 'POST') {
    const body = await parseAndValidateBody(req);
    return handlePost(path, body, req, res, ctx);
  }
  throw new SecurityError('Method not allowed', 405);
}

async function handleGet(path, req, res, ctx) {
  switch (path) {
    case 'plans':                return listPlans(req, res, ctx);
    case 'my_subscription':      requireAuth(ctx); return getMySubscription(req, res, ctx);
    case 'check_premium':        requireAuth(ctx); return checkPremiumStatus(req, res, ctx);
    case 'admin_subscriptions':  requireAdmin(ctx); return adminListSubscriptions(req, res);
    case 'admin_verifications':  requireAdmin(ctx); return adminListVerifications(req, res);
    default: throw new SecurityError('Invalid action', 400);
  }
}

async function handlePost(path, body, req, res, ctx) {
  switch (path) {
    case 'subscribe':            requireAuth(ctx); return subscribe(body, res, ctx);
    case 'create_crypto_invoice': requireAuth(ctx); return createCryptoInvoice(body, res, ctx);
    case 'cancel':                requireAuth(ctx); return cancelSubscription(body, res, ctx);
    case 'admin_verify_payment':  requireAdmin(ctx); return adminVerifyPayment(body, res, ctx);
    case 'admin_run_expiry_sweep':requireAdmin(ctx); return adminRunExpirySweep(res, ctx);
    default: throw new SecurityError('Invalid action', 400);
  }
}

// ---- Public / user-facing ----

async function listPlans(req, res, ctx) {
  let query = supabase
    .from('subscription_plans')
    .select('*')
    .order('display_order', { ascending: true });

  if (!ctx.adminData) query = query.eq('is_active', true);

  const { data } = await query;
  return res.status(200).json(data || []);
}

async function getMySubscription(req, res, ctx) {
  const { data } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      subscription_plans (
        name, slug, description, price_amount, currency, duration_days, features
      )
    `)
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return res.status(200).json(data || null);
}

async function checkPremiumStatus(req, res, ctx) {
  const status = await hasActiveSubscription(ctx.userId);
  return res.status(200).json(status);
}

// Exported so other modules (e.g. lib/premium.js) can gate content on it.
export async function hasActiveSubscription(userId) {
  if (!userId) return { has_premium: false };

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      id, status, expires_at,
      subscription_plans ( name, slug, features )
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('[ACTIVE_SUBSCRIPTION_LOOKUP_ERROR]', {
      user_id: userId,
      code: error.code || null,
      message: error.message || 'Unknown database error'
    });
    throw new SecurityError('Failed to verify premium subscription', 500);
  }

  if (!data) return { has_premium: false };

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return { has_premium: false };
  }

  return {
    has_premium: true,
    subscription_id: data.id,
    plan: data.subscription_plans,
    expires_at: data.expires_at,
  };
}


const NOWPAYMENTS_PRICE_CURRENCIES = new Set(['usd', 'eur']);

function getPublicAppUrl() {
  const configured = String(process.env.APP_URL || process.env.PUBLIC_APP_URL || '').trim();
  const allowed = String(process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const candidate = configured || allowed.find((value) => /^https:\/\//i.test(value));

  if (!candidate) throw new SecurityError('The public application URL is not configured.', 503);

  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw new SecurityError('The public application URL is invalid.', 503);
  }

  if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
    throw new SecurityError('The public application URL must use HTTPS.', 503);
  }

  return parsed.origin;
}

async function createCryptoInvoice(body, res, ctx) {
  const planId = String(body.plan_id || '').trim();
  if (!planId) throw new SecurityError('Choose a subscription plan.', 400);

  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  const ipnSecret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!apiKey || !ipnSecret) {
    throw new SecurityError('Cryptocurrency checkout is not fully configured yet. Please contact support.', 503);
  }

  const { data: plan, error: planError } = await supabase
    .from('subscription_plans')
    .select('id, name, price_amount, currency, duration_days, is_active')
    .eq('id', planId)
    .eq('is_active', true)
    .maybeSingle();

  if (planError) throw new SecurityError('Unable to load the selected subscription plan.', 500);
  if (!plan) throw new SecurityError('This subscription plan is unavailable.', 404);

  const amount = Number(plan.price_amount);
  const currency = String(plan.currency || '').trim().toLowerCase();
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new SecurityError('This subscription plan does not have a valid price.', 400);
  }
  if (!NOWPAYMENTS_PRICE_CURRENCIES.has(currency)) {
    throw new SecurityError('This plan uses a currency that NOWPayments does not support. Please contact support.', 400);
  }
  if (!Number.isInteger(Number(plan.duration_days)) || Number(plan.duration_days) <= 0) {
    throw new SecurityError('This subscription plan has an invalid duration.', 400);
  }

  const publicUrl = getPublicAppUrl();
  const orderId = crypto.randomUUID();
  const callbackUrl = `${publicUrl}/api/server?module=subscriptions&path=nowpayments_ipn`;
  const successUrl = `${publicUrl}/profile?section=billing&payment=success&order_id=${encodeURIComponent(orderId)}`;
  const cancelUrl = `${publicUrl}/profile?section=billing&payment=cancelled`;

  const metadata = {
    provider: 'nowpayments',
    order_id: orderId,
    plan_id: plan.id,
    price_amount: amount,
    price_currency: currency,
    invoice_status: 'creating'
  };

  const { data: payment, error: insertError } = await supabase
    .from('momo_donations')
    .insert({
      user_id: ctx.userId,
      name: 'Subscription',
      amount: String(amount),
      txid: orderId,
      status: 'pending',
      payment_type: 'subscription',
      payment_method: 'crypto',
      provider: 'nowpayments',
      metadata
    })
    .select('id')
    .single();

  if (insertError || !payment) {
    console.error('[SUBSCRIPTION_CRYPTO_PAYMENT_CREATE_ERROR]', insertError?.message || 'Payment record was not created');
    throw new SecurityError('Unable to start the cryptocurrency payment. Please try again.', 500);
  }

  let invoice;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const response = await fetch('https://api.nowpayments.io/v1/invoice', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        price_amount: amount,
        price_currency: currency,
        order_id: orderId,
        order_description: `${plan.name} subscription for ${plan.duration_days} days`,
        ipn_callback_url: callbackUrl,
        success_url: successUrl,
        cancel_url: cancelUrl
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok || !responseBody.invoice_url || !responseBody.id) {
      throw new Error(responseBody.message || responseBody.error || 'Invoice creation failed');
    }
    invoice = responseBody;
  } catch (error) {
    await supabase.from('momo_donations').update({
      status: 'failed',
      metadata: { ...metadata, invoice_status: 'failed' }
    }).eq('id', payment.id);
    console.error('[NOWPAYMENTS_INVOICE_CREATE_ERROR]', error?.message || 'Unknown provider error');
    throw new SecurityError('The cryptocurrency checkout could not be created. Please try again.', 502);
  }

  const updatedMetadata = {
    ...metadata,
    invoice_id: String(invoice.id),
    invoice_status: 'created'
  };
  const { error: updateError } = await supabase
    .from('momo_donations')
    .update({ metadata: updatedMetadata })
    .eq('id', payment.id)
    .eq('user_id', ctx.userId);

  if (updateError) {
    console.error('[SUBSCRIPTION_CRYPTO_PAYMENT_UPDATE_ERROR]', updateError.message);
  }

  return res.status(200).json({
    success: true,
    invoice_url: invoice.invoice_url,
    order_id: orderId
  });
}

function sortObjectDeep(value) {
  if (Array.isArray(value)) return value.map(sortObjectDeep);
  if (!value || typeof value !== 'object') return value;

  return Object.keys(value).sort().reduce((sorted, key) => {
    sorted[key] = sortObjectDeep(value[key]);
    return sorted;
  }, {});
}

function isValidNowPaymentsSignature(payload, signature, secret) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return false;
  if (typeof signature !== 'string' || !/^[a-f0-9]{128}$/i.test(signature)) return false;

  const expected = crypto
    .createHmac('sha512', secret)
    .update(JSON.stringify(sortObjectDeep(payload)))
    .digest('hex');

  const receivedBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  return receivedBuffer.length === expectedBuffer.length
    && crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
}

async function handleNowPaymentsIpn(req, res) {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  const apiKey = process.env.NOWPAYMENTS_API_KEY;
  if (!secret || !apiKey) return res.status(503).json({ error: 'Payment notifications are not configured.' });

  let payload = req.body;
  if (typeof payload === 'string') {
    try {
      payload = JSON.parse(payload);
    } catch {
      return res.status(400).json({ error: 'Invalid notification body.' });
    }
  }

  const signature = req.headers['x-nowpayments-sig'];
  if (!isValidNowPaymentsSignature(payload, signature, secret)) {
    console.warn('[NOWPAYMENTS_IPN_REJECTED] Invalid signature');
    return res.status(401).json({ error: 'Invalid payment notification signature.' });
  }

  const orderId = String(payload.order_id || '').trim();
  const paymentId = String(payload.payment_id || '').trim();
  const incomingStatus = String(payload.payment_status || '').toLowerCase();
  if (!orderId || !paymentId) return res.status(400).json({ error: 'Payment reference is missing.' });

  const { data: payment, error: paymentError } = await supabase
    .from('momo_donations')
    .select('id, user_id, amount, status, metadata')
    .eq('txid', orderId)
    .eq('payment_type', 'subscription')
    .eq('payment_method', 'crypto')
    .eq('provider', 'nowpayments')
    .maybeSingle();

  if (paymentError) return res.status(500).json({ error: 'Unable to locate the subscription payment.' });
  if (!payment) return res.status(200).json({ received: true });

  if (['failed', 'expired', 'refunded'].includes(incomingStatus)) {
    await supabase.from('momo_donations').update({
      status: 'failed',
      metadata: { ...(payment.metadata || {}), provider_payment_id: paymentId, invoice_status: incomingStatus }
    }).eq('id', payment.id);
    return res.status(200).json({ received: true });
  }

  if (incomingStatus !== 'finished') return res.status(200).json({ received: true });

  let verifiedPayment;
  try {
    const response = await fetch(`https://api.nowpayments.io/v1/payment/${encodeURIComponent(paymentId)}`, {
      headers: { 'x-api-key': apiKey },
      signal: AbortSignal.timeout(12000)
    });
    if (!response.ok) throw new Error('Provider verification failed');
    verifiedPayment = await response.json();
  } catch (error) {
    console.error('[NOWPAYMENTS_STATUS_VERIFY_ERROR]', error?.message || 'Unknown provider error');
    return res.status(503).json({ error: 'Payment verification is temporarily unavailable.' });
  }

  const metadata = payment.metadata || {};
  const expectedAmount = Number(metadata.price_amount);
  const receivedAmount = Number(verifiedPayment.price_amount);
  const expectedCurrency = String(metadata.price_currency || '').toLowerCase();
  const receivedCurrency = String(verifiedPayment.price_currency || '').toLowerCase();

  if (
    String(verifiedPayment.payment_id || '') !== paymentId
    || String(verifiedPayment.order_id || '') !== orderId
    || String(verifiedPayment.payment_status || '').toLowerCase() !== 'finished'
    || !Number.isFinite(receivedAmount)
    || Math.abs(receivedAmount - expectedAmount) > 0.000001
    || receivedCurrency !== expectedCurrency
  ) {
    console.warn('[NOWPAYMENTS_PAYMENT_MISMATCH]', { order_id: orderId, payment_id: paymentId });
    return res.status(400).json({ error: 'Payment details did not match the order.' });
  }

  const { data: existingSubscription, error: existingError } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('payment_id', payment.id)
    .maybeSingle();

  if (existingError) return res.status(500).json({ error: 'Unable to verify subscription status.' });

  if (!existingSubscription) {
    const planId = metadata.plan_id;
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('id, name, duration_days, is_active')
      .eq('id', planId)
      .eq('is_active', true)
      .maybeSingle();

    if (planError || !plan) return res.status(500).json({ error: 'The purchased subscription plan is unavailable.' });

    const now = new Date();
    const { data: currentActive } = await supabase
      .from('user_subscriptions')
      .select('expires_at')
      .eq('user_id', payment.user_id)
      .eq('status', 'active')
      .order('expires_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const currentExpiry = currentActive?.expires_at ? new Date(currentActive.expires_at) : now;
    const startsAt = currentExpiry > now ? currentExpiry : now;
    const expiresAt = new Date(startsAt.getTime() + Number(plan.duration_days) * 24 * 60 * 60 * 1000);

    const { data: subscription, error: subscriptionError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: payment.user_id,
        plan_id: plan.id,
        payment_id: payment.id,
        status: 'active',
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        auto_renew: false
      })
      .select('id')
      .single();

    if (subscriptionError || !subscription) {
      console.error('[NOWPAYMENTS_SUBSCRIPTION_ACTIVATION_ERROR]', subscriptionError?.message || 'Subscription was not created');
      return res.status(500).json({ error: 'Unable to activate the subscription yet.' });
    }

    await createNotification(payment.user_id, 'subscription_activated', {
      plan_name: plan.name,
      expires_at: expiresAt.toISOString()
    });

    await auditLog({
      actorId: payment.user_id,
      action: 'subscribe_crypto_instant',
      targetType: 'user_subscription',
      targetId: subscription.id,
      metadata: { plan_id: plan.id, payment_id: payment.id, provider_payment_id: paymentId }
    });
  }

  const { error: markPaidError } = await supabase
    .from('momo_donations')
    .update({
      status: 'completed',
      metadata: {
        ...metadata,
        provider_payment_id: paymentId,
        invoice_status: 'finished',
        pay_currency: verifiedPayment.pay_currency || payload.pay_currency || null,
        actually_paid: verifiedPayment.actually_paid || payload.actually_paid || null
      }
    })
    .eq('id', payment.id);

  if (markPaidError) return res.status(500).json({ error: 'Subscription payment was confirmed but could not be recorded.' });

  return res.status(200).json({ received: true });
}


async function subscribe(body, res, ctx) {
  const { plan_id, payment_id } = body;
  if (!plan_id || !payment_id) throw new SecurityError('plan_id and payment_id required', 400);

  const { data: plan } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('id', plan_id)
    .eq('is_active', true)
    .maybeSingle();
  if (!plan) throw new SecurityError('Plan not found or inactive', 404);

  const { data: payment } = await supabase
    .from('momo_donations')
    .select('id, payment_type, status, amount, user_id')
    .eq('id', payment_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();
  if (!payment) throw new SecurityError('Payment not found', 404);
  if (payment.payment_type !== 'subscription') throw new SecurityError('Invalid payment type', 400);
  if (payment.status === 'failed') throw new SecurityError('Payment failed', 400);

  const { data: existingForPayment } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('payment_id', payment_id)
    .maybeSingle();
  if (existingForPayment) throw new SecurityError('This payment has already been used for a subscription', 409);

  const { data: activeExisting } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('status', 'active')
    .maybeSingle();
  if (activeExisting) throw new SecurityError('You already have an active subscription', 409);

  const instant = INSTANT_PAYMENT_STATUSES.includes(payment.status);
  const now = new Date();

  const subscriptionPayload = {
    user_id: ctx.userId,
    plan_id: plan.id,
    payment_id,
    auto_renew: false,
  };

  if (instant) {
    subscriptionPayload.status = 'active';
    subscriptionPayload.starts_at = now.toISOString();
    subscriptionPayload.expires_at = new Date(now.getTime() + plan.duration_days * 24 * 60 * 60 * 1000).toISOString();
  } else {
    subscriptionPayload.status = 'awaiting_verification';
  }

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .insert(subscriptionPayload)
    .select()
    .single();

  if (!instant) {
    await supabase.from('payment_verifications').insert({
      payment_id,
      status: 'pending',
    });
  } else {
    await createNotification(ctx.userId, 'subscription_activated', {
      plan_name: plan.name,
      expires_at: subscriptionPayload.expires_at,
    });
  }

  await auditLog({
    actorId: ctx.userId,
    action: instant ? 'subscribe_instant' : 'subscribe_pending_verification',
    targetType: 'user_subscription',
    targetId: subscription.id,
    metadata: { plan_id: plan.id, payment_id },
  });

  return res.status(200).json({ success: true, subscription });
}

async function cancelSubscription(body, res, ctx) {
  const { subscription_id } = body;
  if (!subscription_id) throw new SecurityError('subscription_id required', 400);

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('id', subscription_id)
    .maybeSingle();
  if (!subscription) throw new SecurityError('Subscription not found', 404);

  if (subscription.user_id !== ctx.userId && !ctx.adminData) {
    throw new SecurityError('Not authorized', 403);
  }
  if (!['active', 'awaiting_verification', 'pending'].includes(subscription.status)) {
    throw new SecurityError('Subscription cannot be cancelled in its current state', 400);
  }

  await supabase.from('user_subscriptions').update({
    status: 'cancelled',
    cancelled_at: new Date().toISOString(),
    auto_renew: false,
    updated_at: new Date().toISOString(),
  }).eq('id', subscription_id);

  await auditLog({
    actorId: ctx.userId,
    actorRole: ctx.adminData?.admin_role,
    action: 'cancel_subscription',
    targetType: 'user_subscription',
    targetId: subscription_id,
  });

  return res.status(200).json({ success: true });
}

// ---- Admin ----

async function adminListSubscriptions(req, res) {
  const { status, plan_id, user_id } = req.query;
  let query = supabase
    .from('user_subscriptions')
    .select(`*, subscription_plans ( name, slug )`)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (plan_id) query = query.eq('plan_id', plan_id);
  if (user_id) query = query.eq('user_id', user_id);

  const { data } = await query;
  return res.status(200).json(data || []);
}

async function adminListVerifications(req, res) {
  const { status } = req.query;
  let query = supabase
    .from('payment_verifications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  else query = query.in('status', ['pending', 'awaiting_proof', 'under_review']);

  const { data } = await query;
  return res.status(200).json(data || []);
}

async function adminVerifyPayment(body, res, ctx) {
  const { verification_id, action, review_notes, verified_amount } = body;
  if (!verification_id || !['approve', 'reject'].includes(action)) {
    throw new SecurityError('verification_id and action (approve/reject) required', 400);
  }

  const { data: verification } = await supabase
    .from('payment_verifications')
    .select('*')
    .eq('id', verification_id)
    .maybeSingle();
  if (!verification) throw new SecurityError('Verification not found', 404);

  const { data: subscription } = await supabase
    .from('user_subscriptions')
    .select('*, subscription_plans ( name, duration_days )')
    .eq('payment_id', verification.payment_id)
    .maybeSingle();
  if (!subscription) throw new SecurityError('No subscription linked to this payment', 404);

  if (action === 'approve') {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + subscription.subscription_plans.duration_days * 24 * 60 * 60 * 1000).toISOString();

    await supabase.from('payment_verifications').update({
      status: 'approved',
      reviewed_by: ctx.userId,
      reviewed_at: now.toISOString(),
      verified_amount: verified_amount || null,
      review_notes: review_notes || null,
    }).eq('id', verification_id);

    await supabase.from('momo_donations').update({
      status: 'success',
      verified_by: ctx.userId,
      verified_at: now.toISOString(),
    }).eq('id', verification.payment_id);

    await supabase.from('user_subscriptions').update({
      status: 'active',
      starts_at: now.toISOString(),
      expires_at: expiresAt,
      updated_at: now.toISOString(),
    }).eq('id', subscription.id);

    await createNotification(subscription.user_id, 'subscription_activated', {
      plan_name: subscription.subscription_plans.name,
      expires_at: expiresAt,
    });
  } else {
    await supabase.from('payment_verifications').update({
      status: 'rejected',
      reviewed_by: ctx.userId,
      reviewed_at: new Date().toISOString(),
      discrepancy_reason: review_notes || null,
      review_notes: review_notes || null,
    }).eq('id', verification_id);

    await supabase.from('user_subscriptions').update({
      status: 'payment_failed',
      updated_at: new Date().toISOString(),
    }).eq('id', subscription.id);

    await createNotification(subscription.user_id, 'subscription_payment_rejected', {
      reason: review_notes || '',
    });
  }

  await auditLog({
    actorId: ctx.userId,
    actorRole: ctx.adminData?.admin_role,
    action: action === 'approve' ? 'approve_subscription_payment' : 'reject_subscription_payment',
    targetType: 'payment_verification',
    targetId: verification_id,
    metadata: { subscription_id: subscription.id },
  });

  return res.status(200).json({ success: true });
}

async function adminRunExpirySweep(res, ctx) {
  const { data, error } = await supabase.rpc('expire_user_subscriptions');
  if (error) throw new SecurityError('Expiry sweep failed', 500);

  await auditLog({
    actorId: ctx.userId,
    actorRole: ctx.adminData?.admin_role,
    action: 'run_subscription_expiry_sweep',
    targetType: 'user_subscription',
    targetId: 'bulk',
    metadata: { expired_count: data },
  });

  return res.status(200).json({ success: true, expired_count: data });
}
