-- Durable learner questions and AI explanations for note understanding.
-- Reuses the existing notes and AI assistant; does not duplicate resource or chat records.
create table if not exists public.note_learning_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  note_id uuid not null references public.notes(id) on delete cascade,
  learner_question text not null check (char_length(btrim(learner_question)) between 3 and 4000),
  explanation text,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'open' check (status in ('open', 'answered', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists note_learning_threads_user_updated_idx
  on public.note_learning_threads (user_id, updated_at desc);
create index if not exists note_learning_threads_note_user_idx
  on public.note_learning_threads (note_id, user_id, created_at desc);

alter table public.note_learning_threads enable row level security;
revoke all on table public.note_learning_threads from anon, authenticated;
grant all on table public.note_learning_threads to service_role;
