CREATE SEQUENCE IF NOT EXISTS public.user_sessions_id_seq;

SELECT setval(
  'public.user_sessions_id_seq',
  COALESCE((SELECT MAX(id) FROM public.user_sessions), 0) + 1,
  false
);

ALTER TABLE public.user_sessions
  ALTER COLUMN id SET DEFAULT nextval('public.user_sessions_id_seq');

ALTER SEQUENCE public.user_sessions_id_seq
  OWNED BY public.user_sessions.id;
