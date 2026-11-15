REVOKE ALL PRIVILEGES ON TABLE public.user_sessions FROM PUBLIC, anon, authenticated;
DROP POLICY IF EXISTS own_sessions ON public.user_sessions;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.user_sessions TO service_role;
