CREATE OR REPLACE FUNCTION public.get_request_security_context(p_token_hash text)
RETURNS jsonb
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $function$
  SELECT jsonb_build_object(
    'session', to_jsonb(s),
    'restriction', CASE
      WHEN r.user_id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'restriction_type', r.restriction_type,
        'lock_reason', r.lock_reason,
        'expires_at', r.expires_at
      )
    END,
    'admin', CASE
      WHEN a.admin_id IS NULL THEN NULL
      ELSE jsonb_build_object(
        'admin_role', a.admin_role,
        'permissions', a.permissions,
        'is_active', a.is_active,
        'is_locked', a.is_locked,
        'ip_whitelist', a.ip_whitelist,
        'id', a.id,
        'admin_id', a.admin_id,
        'admin_email', a.admin_email,
        'mfa_enabled', a.mfa_enabled,
        'mfa_secret', a.mfa_secret,
        'passkey_enabled', a.passkey_enabled
      )
    END
  )
  FROM public.user_sessions s
  LEFT JOIN LATERAL (
    SELECT user_id, restriction_type, lock_reason, expires_at
    FROM public.user_restrictions
    WHERE user_id = s.user_id
    LIMIT 1
  ) r ON true
  LEFT JOIN LATERAL (
    SELECT admin_role, permissions, is_active, is_locked, ip_whitelist, id, admin_id, admin_email, mfa_enabled, mfa_secret, passkey_enabled
    FROM public.admin_master
    WHERE admin_id = s.user_id AND is_active = true
    LIMIT 1
  ) a ON true
  WHERE s.is_active = true
    AND (
      s.session_token_hash = p_token_hash
      OR (
        s.prev_session_token_hash = p_token_hash
        AND s.prev_token_grace_until > now()
      )
    )
  ORDER BY CASE WHEN s.session_token_hash = p_token_hash THEN 0 ELSE 1 END
  LIMIT 1;
$function$;

REVOKE ALL ON FUNCTION public.get_request_security_context(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_request_security_context(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_request_security_context(text) TO service_role;
