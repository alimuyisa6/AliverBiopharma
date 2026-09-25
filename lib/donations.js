/* lib/donations.js */
import { supabase } from './core.js';
import { parseAndValidateBody, SecurityError } from './security-middleware.js';

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET') {
    if (path === 'config') return getConfig(res, ctx);
    if (path === 'donors') return getDonors(res);
    throw new SecurityError('Invalid action', 400);
  }

  if (req.method === 'POST') {
    if (path === 'submit_momo') {
      const body = await parseAndValidateBody(req);
      return submitMomoDonation(body, res, ctx);
    }
    throw new SecurityError('Invalid action', 400);
  }

  throw new SecurityError('Method not allowed', 405);
}

async function getConfig(res, ctx) {
  const levelId = await resolveLevelId(ctx);
  const { data: sections, error } = await supabase
    .from('platform_sections')
    .select('section_key, content')
    .eq('level_id', levelId)
    .eq('is_active', true)
    .in('section_key', ['donate', 'donate_config', 'footer']);

  if (error) throw new SecurityError('Failed to load donation configuration', 500);

  const map = {};
  (sections || []).forEach((row) => { map[row.section_key] = row.content || {}; });

  const donate = map.donate || {};
  const donateConfig = map.donate_config || {};

  const { data: completed } = await supabase
    .from('momo_donations')
    .select('amount')
    .eq('status', 'completed');

  const raised = (completed || []).reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  return res.status(200).json({
    title: donate.title || 'Support Our Mission',
    subtitle: donate.subtitle || 'Help keep biology and pharmacy education free and accessible.',
    goal_amount: Number(donate.goal_amount) || 500000,
    raised_amount: raised,
    background_image: donate.background_image || '',
    momo: donateConfig.momo || {},
    nowpayments_api_key: process.env.NOWPAYMENTS_API_KEY || '',
  });
}

async function getDonors(res) {
  const { data, error } = await supabase
    .from('momo_donations')
    .select('id, name, amount, created_at, status')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new SecurityError('Failed to load supporters', 500);

  return res.status(200).json((data || []).map((row) => ({
    id: row.id,
    name: row.name || 'Anonymous',
    amount: Number(row.amount) || 0,
    date: row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB') : '',
  })));
}

async function submitMomoDonation(body, res, ctx) {
  const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : 'Anonymous';
  const txid = typeof body.txid === 'string' ? body.txid.trim().slice(0, 100) : '';
  const amount = Number(body.amount);

  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) {
    throw new SecurityError('Enter a valid donation amount.', 400);
  }
  if (!txid || !/^[A-Za-z0-9._:/-]{3,100}$/.test(txid)) {
    throw new SecurityError('Enter a valid Mobile Money transaction ID.', 400);
  }

  const { data: existing } = await supabase
    .from('momo_donations')
    .select('id')
    .eq('txid', txid)
    .maybeSingle();

  if (existing) throw new SecurityError('That transaction ID has already been submitted.', 409);

  const { data, error } = await supabase
    .from('momo_donations')
    .insert({
      user_id: ctx?.userId || null,
      name: name || 'Anonymous',
      amount,
      txid,
      status: 'pending',
      currency: 'UGX',
    })
    .select('id')
    .single();

  if (error) {
    console.error('[DONATION] insert failed', error);
    throw new SecurityError('Unable to record the donation right now.', 500);
  }

  return res.status(200).json({ success: true, donation_id: data.id });
}

async function resolveLevelId(ctx) {
  if (ctx?.userId) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('active_level_id')
      .eq('user_id', ctx.userId)
      .maybeSingle();
    if (profile?.active_level_id) return profile.active_level_id;
  }

  const { data } = await supabase
    .from('curriculum_levels')
    .select('id')
    .order('display_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data?.id) throw new SecurityError('No curriculum level configured', 500);
  return data.id;
}
