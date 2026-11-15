-- Dedicated Quiz Challenge content bank.
-- Challenge questions are separate from normal quiz_questions.
-- Client roles intentionally receive no table privileges; challenge RPCs will
-- read this table server-side.

create table if not exists public.quiz_challenge_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_option char(1) not null check (correct_option in ('A','B','C','D')),
  explanation text,
  unit_id uuid references public.curriculum_units(id) on delete set null,
  group_id text,
  level_id text,
  concept_id uuid,
  concept_name text,
  subtopic text,
  learning_objective text,
  difficulty text not null default 'medium'
    check (difficulty in ('easy','medium','hard')),
  source_type text not null default 'remediation'
    check (source_type in ('remediation','personalized','generated','manual')),
  source_question_id bigint references public.quiz_questions(id) on delete set null,
  remediation_reason text,
  status text not null default 'draft'
    check (status in ('draft','review','approved','published','retired')),
  is_active boolean not null default true,
  version integer not null default 1 check (version > 0),
  content_hash text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quiz_challenge_questions_content_nonempty
    check (length(btrim(question_text)) > 0),

  constraint quiz_challenge_questions_options_distinct
    check (
      option_a <> option_b
      and option_a <> option_c
      and option_a <> option_d
      and option_b <> option_c
      and option_b <> option_d
      and option_c <> option_d
    )
);

create index if not exists idx_quiz_challenge_questions_scope
  on public.quiz_challenge_questions (unit_id, group_id, level_id, is_active, status);

create index if not exists idx_quiz_challenge_questions_concept
  on public.quiz_challenge_questions (concept_id, unit_id, is_active, status);

create index if not exists idx_quiz_challenge_questions_source
  on public.quiz_challenge_questions (source_question_id)
  where source_question_id is not null;

create index if not exists idx_quiz_challenge_questions_hash
  on public.quiz_challenge_questions (content_hash)
  where content_hash is not null;

alter table public.quiz_challenge_questions enable row level security;

revoke all on table public.quiz_challenge_questions from anon, authenticated;
grant all on table public.quiz_challenge_questions to service_role;

drop trigger if exists trg_touch_quiz_challenge_questions on public.quiz_challenge_questions;
create trigger trg_touch_quiz_challenge_questions
before update on public.quiz_challenge_questions
for each row execute function public.trg_touch_challenge_updated_at();
