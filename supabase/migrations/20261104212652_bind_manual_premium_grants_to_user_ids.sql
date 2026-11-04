ALTER TABLE public.premium_grants
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

UPDATE public.premium_grants AS grants
SET user_id = users.id
FROM auth.users AS users
WHERE grants.user_id IS NULL
  AND lower(trim(grants.email)) = lower(trim(users.email));

CREATE INDEX IF NOT EXISTS premium_grants_user_content_lookup
ON public.premium_grants(user_id, content_type, content_id);

ALTER TABLE public.premium_grants
  ALTER COLUMN user_id SET NOT NULL;
