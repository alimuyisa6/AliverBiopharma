 import { supabase } from './core.js';
import { createNotification } from './notifications.js';
import {
  parseAndValidateBody,
  SecurityError,
} from './security-middleware.js';

export async function handler(req, res, path, ctx) {
  if (req.method === 'POST') {
    const body = await parseAndValidateBody(req);
    return handlePost(path, body, req, res);
  }
  throw new SecurityError('Method not allowed', 405);
}

async function handlePost(path, body, req, res) {
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
  const { formData } = body;
  if (!formData?.name || !formData?.email || !formData?.message) {
    throw new SecurityError('Name, email and message are required', 400);
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
    throw new SecurityError('Invalid email', 400);
  }

  await supabase.from('contact_messages').insert({
    name: formData.name.trim(),
    email: formData.email.trim().toLowerCase(),
    subject: formData.subject?.trim() || '',
    message: formData.message.trim(),
    is_read: false,
  });

  return res.status(200).json({ success: true });
}

async function subscribeNewsletter(body, res) {
  const email = body?.formData?.email?.trim().toLowerCase();

  if (!email || email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
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
