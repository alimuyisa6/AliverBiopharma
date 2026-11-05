CREATE TABLE IF NOT EXISTS public.admin_trusted_devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id_hash text NOT NULL CHECK (device_id_hash ~ '^[a-f0-9]{64}$'),
  approved_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT admin_trusted_devices_user_device_unique UNIQUE (admin_user_id, device_id_hash)
);

ALTER TABLE public.admin_trusted_devices ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_trusted_devices FROM anon, authenticated;
GRANT ALL ON TABLE public.admin_trusted_devices TO service_role;

CREATE INDEX IF NOT EXISTS admin_trusted_devices_active_user_idx
ON public.admin_trusted_devices (admin_user_id, last_seen_at DESC)
WHERE revoked_at IS NULL;

COMMENT ON TABLE public.admin_trusted_devices IS
'Backend-only registry of administrator devices approved after email-bound environment-secret verification. Device identifiers are stored only as SHA-256 hashes.';
