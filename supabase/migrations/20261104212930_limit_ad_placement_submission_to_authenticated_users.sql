REVOKE ALL ON FUNCTION public.fn_submit_ad_campaign_placement(
  uuid, uuid, uuid, uuid, uuid, date, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.fn_submit_ad_campaign_placement(
  uuid, uuid, uuid, uuid, uuid, date, text, text
) TO authenticated, service_role;
