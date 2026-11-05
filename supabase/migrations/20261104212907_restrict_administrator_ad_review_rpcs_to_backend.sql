DROP FUNCTION IF EXISTS public.fn_review_ad_campaign_placement(uuid, text, text);
DROP FUNCTION IF EXISTS public.fn_verify_ad_payment(uuid, bigint);

CREATE FUNCTION public.fn_review_ad_campaign_placement(
  p_campaign_placement_id uuid,
  p_decision text,
  p_reason text,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_payment_status text;
  v_owner uuid;
  v_admin_role text;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Backend administrator authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT admin_role INTO v_admin_role
  FROM public.admin_master
  WHERE admin_id = p_admin_id
    AND is_active = true
    AND is_locked = false;

  IF v_admin_role IS NULL THEN
    RAISE EXCEPTION 'Active administrator required' USING ERRCODE = '42501';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision: %', p_decision USING ERRCODE = '22023';
  END IF;

  SELECT cp.payment_status, a.created_by INTO v_payment_status, v_owner
  FROM public.ad_campaign_placements cp
  JOIN public.ad_campaigns c ON c.id = cp.campaign_id
  JOIN public.ad_advertisers a ON a.id = c.advertiser_id
  WHERE cp.id = p_campaign_placement_id
  FOR UPDATE;

  IF v_payment_status IS NULL THEN
    RAISE EXCEPTION 'Campaign placement not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_payment_status <> 'paid' AND p_decision = 'approved' THEN
    RAISE EXCEPTION 'Cannot approve a placement before payment is verified' USING ERRCODE = 'P0005';
  END IF;

  IF p_admin_id = v_owner THEN
    RAISE EXCEPTION 'Self-review is not permitted' USING ERRCODE = '42501';
  END IF;

  IF p_decision = 'rejected' AND (p_reason IS NULL OR length(trim(p_reason)) = 0) THEN
    RAISE EXCEPTION 'A rejection reason is required' USING ERRCODE = '22023';
  END IF;

  UPDATE public.ad_campaign_placements
  SET review_status = p_decision,
      rejection_reason = CASE WHEN p_decision = 'rejected' THEN p_reason ELSE NULL END,
      reviewed_by = p_admin_id,
      reviewed_at = now(),
      lifecycle_status = CASE WHEN p_decision = 'approved' THEN 'scheduled' ELSE 'cancelled' END,
      updated_at = now()
  WHERE id = p_campaign_placement_id;

  INSERT INTO public.ad_audit_log (entity_type, entity_id, action, actor_id, reason)
  VALUES ('ad_campaign_placement', p_campaign_placement_id, 'review_' || p_decision, p_admin_id, p_reason);
END;
$$;

CREATE FUNCTION public.fn_verify_ad_payment(
  p_campaign_placement_id uuid,
  p_payment_id bigint,
  p_admin_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_current_status text;
  v_owner uuid;
  v_admin_role text;
BEGIN
  IF COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Backend administrator authorization required' USING ERRCODE = '42501';
  END IF;

  SELECT admin_role INTO v_admin_role
  FROM public.admin_master
  WHERE admin_id = p_admin_id
    AND is_active = true
    AND is_locked = false;

  IF v_admin_role IS NULL THEN
    RAISE EXCEPTION 'Active administrator required' USING ERRCODE = '42501';
  END IF;

  SELECT cp.payment_status, a.created_by INTO v_current_status, v_owner
  FROM public.ad_campaign_placements cp
  JOIN public.ad_campaigns c ON c.id = cp.campaign_id
  JOIN public.ad_advertisers a ON a.id = c.advertiser_id
  WHERE cp.id = p_campaign_placement_id
  FOR UPDATE;

  IF v_current_status IS NULL THEN
    RAISE EXCEPTION 'Campaign placement not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_current_status = 'paid' THEN
    RAISE EXCEPTION 'Payment already verified for this placement' USING ERRCODE = 'P0004';
  END IF;

  IF p_admin_id = v_owner THEN
    RAISE EXCEPTION 'Self-verification is not permitted' USING ERRCODE = '42501';
  END IF;

  UPDATE public.ad_campaign_placements
  SET payment_status = 'paid',
      payment_id = p_payment_id,
      updated_at = now()
  WHERE id = p_campaign_placement_id;

  INSERT INTO public.ad_audit_log (entity_type, entity_id, action, actor_id, metadata)
  VALUES ('ad_campaign_placement', p_campaign_placement_id, 'payment_verified', p_admin_id,
          jsonb_build_object('payment_id', p_payment_id));
END;
$$;

REVOKE ALL ON FUNCTION public.fn_review_ad_campaign_placement(uuid, text, text, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.fn_verify_ad_payment(uuid, bigint, uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fn_review_ad_campaign_placement(uuid, text, text, uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.fn_verify_ad_payment(uuid, bigint, uuid) TO service_role;

ALTER FUNCTION public.guard_user_curriculum_assignment()
SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.generate_navigation_token()
SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.set_navigation_token()
SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.sync_content_reference_note()
SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.sync_content_reference_article()
SET search_path = public, extensions, pg_temp;

ALTER FUNCTION public.sync_content_reference_video()
SET search_path = public, extensions, pg_temp;
