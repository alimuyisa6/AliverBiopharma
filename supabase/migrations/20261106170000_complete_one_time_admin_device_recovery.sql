CREATE OR REPLACE FUNCTION public.replace_admin_device_recovery_codes(
  p_admin_user_id uuid,
  p_email_normalized text,
  p_password_updated_at timestamptz,
  p_code_hashes text[],
  p_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_now timestamptz := now();
BEGIN
  IF p_admin_user_id IS NULL
    OR p_email_normalized IS NULL
    OR p_email_normalized <> lower(trim(p_email_normalized))
    OR p_password_updated_at IS NULL
    OR p_expires_at <= v_now
    OR p_code_hashes IS NULL
    OR cardinality(p_code_hashes) <> 8
    OR EXISTS (
      SELECT 1
      FROM unnest(p_code_hashes) AS code_hash
      WHERE code_hash !~ '^[a-f0-9]{64}$'
    )
  THEN
    RAISE EXCEPTION 'Invalid administrator recovery code issuance request';
  END IF;

  UPDATE public.admin_device_recovery_codes
  SET revoked_at = v_now
  WHERE admin_user_id = p_admin_user_id
    AND consumed_at IS NULL
    AND revoked_at IS NULL;

  INSERT INTO public.admin_device_recovery_codes (
    admin_user_id,
    email_normalized,
    password_updated_at,
    code_hash,
    expires_at
  )
  SELECT
    p_admin_user_id,
    p_email_normalized,
    p_password_updated_at,
    code_hash,
    p_expires_at
  FROM unnest(p_code_hashes) AS code_hash;

  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.consume_admin_device_recovery_code(
  p_admin_user_id uuid,
  p_email_normalized text,
  p_password_updated_at timestamptz,
  p_code_hash text,
  p_device_id_hash text,
  p_fingerprint_hash text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_code_id uuid;
  v_now timestamptz := now();
BEGIN
  UPDATE public.admin_device_recovery_codes
  SET consumed_at = v_now
  WHERE admin_user_id = p_admin_user_id
    AND email_normalized = p_email_normalized
    AND password_updated_at = p_password_updated_at
    AND code_hash = p_code_hash
    AND consumed_at IS NULL
    AND revoked_at IS NULL
    AND expires_at > v_now
  RETURNING id INTO v_code_id;

  IF v_code_id IS NULL THEN
    RETURN false;
  END IF;

  INSERT INTO public.admin_trusted_devices (
    admin_user_id,
    email_normalized,
    password_updated_at,
    device_id_hash,
    fingerprint_hash,
    approved_at,
    last_seen_at,
    expires_at,
    revoked_at
  )
  VALUES (
    p_admin_user_id,
    p_email_normalized,
    p_password_updated_at,
    p_device_id_hash,
    p_fingerprint_hash,
    v_now,
    v_now,
    v_now + interval '180 days',
    NULL
  )
  ON CONFLICT (admin_user_id, device_id_hash)
  DO UPDATE SET
    email_normalized = EXCLUDED.email_normalized,
    password_updated_at = EXCLUDED.password_updated_at,
    fingerprint_hash = EXCLUDED.fingerprint_hash,
    approved_at = EXCLUDED.approved_at,
    last_seen_at = EXCLUDED.last_seen_at,
    expires_at = EXCLUDED.expires_at,
    revoked_at = NULL;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_admin_device_recovery_codes(uuid, text, timestamptz, text[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_admin_device_recovery_codes(uuid, text, timestamptz, text[], timestamptz) TO service_role;

REVOKE ALL ON FUNCTION public.consume_admin_device_recovery_code(uuid, text, timestamptz, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_admin_device_recovery_code(uuid, text, timestamptz, text, text, text) TO service_role;
