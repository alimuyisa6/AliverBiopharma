ALTER TABLE public.admin_trusted_devices
ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '180 days');

CREATE INDEX IF NOT EXISTS admin_trusted_devices_active_expiry_idx
ON public.admin_trusted_devices (admin_user_id, expires_at)
WHERE revoked_at IS NULL;