-- Challenge system schema: daily personalized challenges + weekly curriculum challenges
-- Safe to apply to environments where the daily tables already exist.

create table if not exists public.user_daily_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_date date not null,
  challenge_type text not null,
  level_id uuid,
  group_id uuid,
  unit_id uuid,
  title text not null,
  description text,
  source text not null default 'personalized',
  target_count integer not null default 1,
  passing_score numeric not null default 60,
  reward_xp integer not null default 0,
  content_config jsonb not null default '{}'::jsonb,
  status text not null default 'available',
  progress integer not null default 0,
  score numeric,
  passed boolean not null default false,
  started_at timestamptz,
  completed_at timestamptz,
  xp_awarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.user_daily_challenges
  add column if not exists level_id uuid,
  add column if not exists group_id uuid,
  add column if not exists unit_id uuid,
  add column if not exists title text,
  add column if not exists description text,
  add column if not exists source text default 'personalized',
  add column if not exists target_count integer default 1,
  add column if not exists passing_score numeric default 60,
  add column if not exists reward_xp integer default 0,
  add column if not exists content_config jsonb default '{}'::jsonb,
  add column if not exists status text default 'available',
  add column if not exists progress integer default 0,
  add column if not exists score numeric,
  add column if not exists passed boolean default false,
  add column if not exists started_at timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists xp_awarded_at timestamptz,
  add column if not exists created_at timestamptz default now(),
  add column if not exists updated_at timestamptz default now();

create unique index if not exists uq_user_daily_challenges_user_date
  on public.user_daily_challenges(user_id, challenge_date);

create index if not exists idx_user_daily_challenges_user_date
  on public.user_daily_challenges(user_id, challenge_date desc);

create index if not exists idx_user_daily_challenges_user_status
  on public.user_daily_challenges(user_id, status);

create table if not exists public.user_daily_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  daily_challenge_id uuid not null references public.user_daily_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null,
  challenge_type text not null,
  source_session_id uuid,
  source_attempt_id uuid,
  score numeric not null default 0,
  passed boolean not null default false,
  progress integer not null default 0,
  failure_reason text,
  performance_data jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create unique index if not exists uq_daily_challenge_attempts_attempt_number
  on public.user_daily_challenge_attempts(daily_challenge_id, attempt_number);

create unique index if not exists uq_daily_challenge_attempts_source_attempt
  on public.user_daily_challenge_attempts(daily_challenge_id, source_attempt_id)
  where source_attempt_id is not null;

create unique index if not exists uq_daily_challenge_attempts_source_session
  on public.user_daily_challenge_attempts(daily_challenge_id, source_session_id)
  where source_session_id is not null;

create index if not exists idx_daily_challenge_attempts_challenge
  on public.user_daily_challenge_attempts(daily_challenge_id, attempt_number desc);

create table if not exists public.user_daily_challenge_completions (
  user_id uuid not null references auth.users(id) on delete cascade,
  completed_date date not null,
  completed_at timestamptz not null default now(),
  primary key (user_id, completed_date)
);

create table if not exists public.user_challenge_performance (
  user_id uuid not null references auth.users(id) on delete cascade,
  challenge_type text not null,
  level_id uuid not null,
  group_id uuid not null,
  unit_id uuid not null,
  attempts integer not null default 0,
  passes integer not null default 0,
  failures integer not null default 0,
  total_score numeric not null default 0,
  best_score numeric not null default 0,
  last_score numeric not null default 0,
  current_streak integer not null default 0,
  best_streak integer not null default 0,
  last_attempt_at timestamptz,
  last_passed_at timestamptz,
  last_failed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_type, level_id, group_id, unit_id)
);

-- Weekly challenges are curriculum-level content in platform_sections.
-- Answers deserve their own immutable, one-per-user-per-week record.
create table if not exists public.user_weekly_challenge_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  level_id uuid not null,
  section_id uuid not null,
  selected_option integer not null,
  correct boolean not null,
  explanation text not null default '',
  created_at timestamptz not null default now(),
  unique (user_id, week_start, level_id)
);

create index if not exists idx_weekly_challenge_attempts_user_week
  on public.user_weekly_challenge_attempts(user_id, week_start desc);

create index if not exists idx_weekly_challenge_attempts_level_week
  on public.user_weekly_challenge_attempts(level_id, week_start desc);

-- Backfill the new Weekly table from the existing interaction records.
insert into public.user_weekly_challenge_attempts (
  user_id,
  week_start,
  level_id,
  section_id,
  selected_option,
  correct,
  explanation,
  created_at
)
select
  ui.user_id,
  (ui.metadata->>'week_start')::date,
  (ui.metadata->>'level_id')::uuid,
  (ui.metadata->>'section_id')::uuid,
  (ui.metadata->>'selected_option')::integer,
  coalesce((ui.metadata->>'correct')::boolean, false),
  coalesce(ui.metadata->>'explanation', ''),
  ui.created_at
from public.user_interactions ui
where ui.interaction_type = 'quiz_attempt'
  and ui.metadata->>'week_start' is not null
  and ui.metadata->>'level_id' is not null
  and ui.metadata->>'section_id' is not null
  and ui.metadata->>'selected_option' ~ '^[0-9]+$'
  and not exists (
    select 1
    from public.user_weekly_challenge_attempts wa
    where wa.user_id = ui.user_id
      and wa.week_start = (ui.metadata->>'week_start')::date
      and wa.level_id = (ui.metadata->>'level_id')::uuid
  );
