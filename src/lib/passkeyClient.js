// src/lib/passkeyClient.js
//
// Browser-only Supabase client used exclusively for the real WebAuthn passkey
// ceremony. The main application session remains the existing AliverBiopharm
// server session; this client is deliberately memory-only and never persists
// a Supabase session to localStorage.

import { createClient } from '@supabase/supabase-js';

let clientPromise = null;

async function getConfig() {
  const response = await fetch('/api/server?module=auth&path=passkey_config', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store'
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data?.url || !data?.publishable_key) {
    throw new Error(data?.error || 'Passkey authentication is not configured.');
  }

  return data;
}

async function getClient() {
  if (!clientPromise) {
    clientPromise = getConfig().then(({ url, publishable_key }) =>
      createClient(url, publishable_key, {
        auth: {
          experimental: { passkey: true },
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      })
    );
  }

  return clientPromise;
}

export async function registerPasskey() {
  const client = await getClient();
  return client.auth.registerPasskey();
}

export async function signInWithPasskey(captchaToken) {
  const client = await getClient();
  return client.auth.signInWithPasskey({
    options: { captchaToken }
  });
}

export async function signInForPasskeyEnrollment(email, password, captchaToken) {
  const client = await getClient();

  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken }
  });

  if (error) throw error;
  if (!data?.session) {
    throw new Error('Your account must have an active session before a passkey can be registered.');
  }

  return client;
}

export async function listPasskeys() {
  const client = await getClient();
  const { data, error } = await client.auth.passkey.list();

  if (error) throw error;
  return data || [];
}

export async function renamePasskey(passkeyId, friendlyName) {
  const client = await getClient();
  const { data, error } = await client.auth.passkey.update({
    passkeyId,
    friendlyName
  });

  if (error) throw error;
  return data;
}

export async function deletePasskey(passkeyId) {
  const client = await getClient();
  const { data, error } = await client.auth.passkey.delete({
    passkeyId
  });

  if (error) throw error;
  return data;
}
