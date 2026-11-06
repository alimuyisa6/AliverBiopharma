CREATE TABLE IF NOT EXISTS public.admin_device_recovery_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_normalized text NOT NULL,
  password_updated_at timestamptz NOT NULL,
  code_hash text NOT NULL UNIQUE CHECK (code_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  consumed_at timestamptz,
  revoked_at timestamptz,
  CONSTRAINT admin_device_recovery_codes_email_check CHECK (email_normalized = lower(trim(email_normalized)))
);

ALTER TABLE public.admin_device_recovery_codes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_device_recovery_codes FROM anon, authenticated, public;
GRANT ALL ON TABLE public.admin_device_recovery_codes TO service_role;

CREATE INDEX IF NOT EXISTS admin_device_recovery_codes_active_user_idx
ON public.admin_device_recovery_codes (admin_user_id, expires_at)
WHERE consumed_at IS NULL AND revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS admin_device_recovery_codes_email_idx
ON public.admin_device_recovery_codes (admin_user_id, email_normalized);
