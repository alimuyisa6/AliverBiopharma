-- Reading progress is written only by the authenticated server API.
-- This prevents clients from forging completion flags used by note learning.
revoke all on table public.reading_progress from anon;
revoke insert, update, delete, truncate, references, trigger
  on table public.reading_progress from authenticated;
grant select on table public.reading_progress to authenticated;
