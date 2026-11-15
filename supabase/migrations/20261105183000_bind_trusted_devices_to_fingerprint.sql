ALTER TABLE public.admin_trusted_devices
  ADD COLUMN IF NOT EXISTS fingerprint_hash text;

ALTER TABLE public.admin_trusted_devices
  ADD CONSTRAINT admin_trusted_devices_fingerprint_hash_check
  CHECK (fingerprint_hash IS NULL OR fingerprint_hash ~ '^[a-f0-9]{64}$');

CREATE INDEX IF NOT EXISTS admin_trusted_devices_active_fingerprint_idx
ON public.admin_trusted_devices (admin_user_id, device_id_hash, fingerprint_hash)
WHERE revoked_at IS NULL;