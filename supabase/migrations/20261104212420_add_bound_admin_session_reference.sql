ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS admin_session_reference_hash text,
  ADD COLUMN IF NOT EXISTS admin_session_reference_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS user_sessions_admin_reference_hash_unique
ON public.user_sessions(admin_session_reference_hash)
WHERE admin_session_reference_hash IS NOT NULL;

COMMENT ON COLUMN public.user_sessions.admin_session_reference_hash IS
'Hash of a backend-generated 22-digit administrator session reference. The reference itself is never returned to clients.';

COMMENT ON COLUMN public.user_sessions.admin_session_reference_expires_at IS
'Expiry of the backend-only administrator session reference, bound to this authenticated session.';
