import { supabase } from './core.js';
import { createNotification } from './notifications.js';
import {
  parseAndValidateBody,
  SecurityError,
} from './security-middleware.js';

const CONTACT_REASONS = new Set(['Account Support', 'Subscription', 'Donations']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handler(req, res, path, ctx) {
  if (req.method !== 'POST') {
    throw new SecurityError('Method not allowed', 405);
  }

  const body = await parseAndValidateBody(req);
  return handlePost(path, body, res);
}

async function handlePost(path, body, res) {
  switch (path) {
    case 'submit_contact':
      return submitContact(body, res);
    case 'subscribe_newsletter':
      return subscribeNewsletter(body, res);
    default:
      throw new SecurityError('Invalid action', 400);
  }
}

async function submitContact(body, res) {
  const formData = body?.formData;
  const name = typeof formData?.name === 'string' ? formData.name.trim() : '';
  const email = typeof formData?.email === 'string' ? formData.email.trim().toLowerCase() : '';
  const subject = typeof formData?.subject === 'string' ? formData.subject.trim() : '';
  const message = typeof formData?.message === 'string' ? formData.message.trim() : '';

  if (!name || !email || !subject || !message) {
    throw new SecurityError('All contact form fields are required', 400);
  }
  if (name.length > 120) {
    throw new SecurityError('Name is too long', 400);
  }
  if (email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new SecurityError('Please provide a valid email address', 400);
  }
  if (!CONTACT_REASONS.has(subject)) {
    throw new SecurityError('Please select a valid contact reason', 400);
  }
  if (message.length > 3000) {
    throw new SecurityError('Message is too long', 400);
  }

  const dayStart = new Date();
  dayStart.setUTCHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', dayStart.toISOString());

  if (countError) {
    throw new SecurityError('Unable to send your message right now. Please try again later.', 500);
  }
  if (count >= 2) {
    throw new SecurityError('You can only send two messages per day. Please try again tomorrow.', 429);
  }

  const { error } = await supabase.from('contact_messages').insert({
    name,
    email,
    subject,
    message,
    is_read: false,
  });

  if (error) {
    throw new SecurityError('Unable to send your message right now. Please try again later.', 500);
  }

  return res.status(200).json({ success: true, message: 'Your message has been sent.' });
}

async function subscribeNewsletter(body, res) {
  const email = body?.formData?.email?.trim().toLowerCase();

  if (!email || email.length > 320 || !EMAIL_PATTERN.test(email)) {
    throw new SecurityError('Valid email required', 400);
  }

  const { data: authData, error: authError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });

  if (authError) throw authError;

  const user = (authData?.users || []).find(
    (candidate) => candidate.email?.trim().toLowerCase() === email
  );

  const { error: subscriberError } = await supabase
    .from('newsletter_subscribers')
    .upsert(
      {
        email,
        user_id: user?.id || null,
        status: 'active',
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'email' }
    );

  if (subscriberError) throw subscriberError;

  if (user?.id) {
    const { error: preferenceError } = await supabase
      .from('notification_preferences')
      .upsert(
        {
          user_id: user.id,
          module: 'newsletter',
          in_app: true,
          email: true,
        },
        { onConflict: 'user_id,module' }
      );

    if (preferenceError) throw preferenceError;

    await createNotification(user.id, 'newsletter_subscription', {
      email,
    });
  }

  return res.status(200).json({
    success: true,
    message: 'You are now subscribed to AliverBiopharm newsletter updates.',
  });
}
