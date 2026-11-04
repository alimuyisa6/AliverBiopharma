DROP FUNCTION IF EXISTS public.fn_record_ad_click(uuid, text);

CREATE FUNCTION public.fn_record_ad_click(
  p_impression_id uuid,
  p_session_fingerprint text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_impression record;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Backend authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT id, user_id, session_fingerprint INTO v_impression
  FROM public.ad_impressions
  WHERE id = p_impression_id;

  IF v_impression.id IS NULL THEN
    RAISE EXCEPTION 'Invalid impression reference' USING ERRCODE = 'P0002';
  END IF;

  IF v_impression.session_fingerprint IS DISTINCT FROM p_session_fingerprint THEN
    RAISE EXCEPTION 'Invalid ad session' USING ERRCODE = '42501';
  END IF;

  IF v_impression.user_id IS DISTINCT FROM p_user_id THEN
    RAISE EXCEPTION 'Not authorized to record this click' USING ERRCODE = '42501';
  END IF;

  INSERT INTO public.ad_clicks (impression_id)
  VALUES (p_impression_id)
  ON CONFLICT (impression_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.fn_record_ad_click(uuid, text, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_record_ad_click(uuid, text, uuid) TO service_role;

REVOKE ALL ON FUNCTION public.fn_serve_ad(text, text, text, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_serve_ad(text, text, text, text, text) TO service_role;
