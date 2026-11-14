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
      FROM unnest(p_code_hashes) AS hashes(code_hash)
      WHERE hashes.code_hash !~ '^[a-f0-9]{64}$'
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
    hashes.code_hash,
    p_expires_at
  FROM unnest(p_code_hashes) AS hashes(code_hash);

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.replace_admin_device_recovery_codes(uuid, text, timestamptz, text[], timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.replace_admin_device_recovery_codes(uuid, text, timestamptz, text[], timestamptz) TO service_role;