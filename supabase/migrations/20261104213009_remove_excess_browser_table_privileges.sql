REVOKE TRUNCATE, REFERENCES, TRIGGER
ON ALL TABLES IN SCHEMA public
FROM PUBLIC, anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
REVOKE TRUNCATE, REFERENCES, TRIGGER ON TABLES
FROM PUBLIC, anon, authenticated;

REVOKE ALL PRIVILEGES ON TABLE public.ad_campaign_categories
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.newsletter_subscribers
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.past_paper_download_attempts
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.admin_master
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.premium_grants
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.payment_verifications
FROM PUBLIC, anon, authenticated;
REVOKE ALL PRIVILEGES ON TABLE public.user_sessions
FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.user_profiles
FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.level_change_requests
FROM PUBLIC, anon, authenticated;

REVOKE INSERT, UPDATE, DELETE
ON TABLE public.user_subscriptions
FROM PUBLIC, anon, authenticated;
