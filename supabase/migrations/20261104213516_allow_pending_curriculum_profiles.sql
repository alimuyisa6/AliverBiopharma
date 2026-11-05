ALTER TABLE public.user_profiles
  ALTER COLUMN track DROP NOT NULL,
  ALTER COLUMN class_name DROP NOT NULL;
