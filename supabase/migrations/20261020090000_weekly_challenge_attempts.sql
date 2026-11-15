-- Weekly challenge attempts use the live curriculum's text-based level identifiers.
-- Keep attempts private; all reads/writes are performed by the authenticated server API.
create table if not exists public.user_weekly_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  level_id text not null,
  section_id uuid not null references public.platform_sections(id) on delete restrict,
  selected_option integer not null check (selected_option between 0 and 3),
  correct boolean not null,
  explanation text not null default '',
  created_at timestamptz not null default now(),
  constraint uq_user_weekly_challenge_attempt unique (user_id, week_start, level_id)
);

create index if not exists idx_user_weekly_challenge_attempts_user_week
  on public.user_weekly_challenge_attempts (user_id, week_start desc);

create index if not exists idx_user_weekly_challenge_attempts_level_week
  on public.user_weekly_challenge_attempts (level_id, week_start desc);

alter table public.user_weekly_challenge_attempts enable row level security;

-- The server uses its service-role Supabase client after verifying the user's session.
-- No direct client-side table access policies are intentionally added.
revoke all on table public.user_weekly_challenge_attempts from anon, authenticated;
grant all on table public.user_weekly_challenge_attempts to service_role;
