-- Track the server-owned start of an active note-reading session.
-- This supports completion eligibility without trusting client-reported time.
alter table public.reading_progress
  add column if not exists reading_started_at timestamptz;

comment on column public.reading_progress.reading_started_at is
  'Server-owned timestamp for the current note-reading session; used to validate minimum reading duration.';
