ALTER TABLE public.admin_trusted_devices
  ADD COLUMN IF NOT EXISTS email_normalized text;

ALTER TABLE public.admin_trusted_devices
  ADD COLUMN IF NOT EXISTS password_updated_at timestamptz;

UPDATE public.admin_trusted_devices AS device
SET
  email_normalized = lower(trim(auth_user.email)),
  password_updated_at = auth_user.updated_at
FROM auth.users AS auth_user
WHERE device.admin_user_id = auth_user.id
  AND (device.email_normalized IS NULL OR device.password_updated_at IS NULL);

CREATE INDEX IF NOT EXISTS admin_trusted_devices_identity_binding_idx
ON public.admin_trusted_devices (
  admin_user_id,
  device_id_hash,
  email_normalized,
  password_updated_at
)
WHERE revoked_at IS NULL;
