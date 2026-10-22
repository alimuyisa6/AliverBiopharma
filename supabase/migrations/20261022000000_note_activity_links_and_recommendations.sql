-- Launch learning flow: note-specific activity links and configurable mastery threshold.
-- Additive migration: preserves current curriculum/resource IDs and existing activity tables.

create table if not exists public.note_learning_activity_links (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.notes(id) on delete cascade,
  activity_type text not null
    check (activity_type in ('quiz', 'flashcards', 'recall')),
  quiz_question_id bigint references public.quiz_questions(id) on delete cascade,
  flashcard_deck_id uuid references public.flashcard_decks(id) on delete cascade,
  recall_question_id bigint references public.recall_questions_bank(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint note_learning_activity_target_check check (
    (activity_type = 'quiz'
      and quiz_question_id is not null
      and flashcard_deck_id is null
      and recall_question_id is null)
    or
    (activity_type = 'flashcards'
      and quiz_question_id is null
      and flashcard_deck_id is not null
      and recall_question_id is null)
    or
    (activity_type = 'recall'
      and quiz_question_id is null
      and flashcard_deck_id is null
      and recall_question_id is not null)
  )
);

create unique index if not exists note_learning_activity_quiz_unique
  on public.note_learning_activity_links(note_id, quiz_question_id)
  where quiz_question_id is not null;
create unique index if not exists note_learning_activity_flashcard_unique
  on public.note_learning_activity_links(note_id, flashcard_deck_id)
  where flashcard_deck_id is not null;
create unique index if not exists note_learning_activity_recall_unique
  on public.note_learning_activity_links(note_id, recall_question_id)
  where recall_question_id is not null;
create index if not exists note_learning_activity_note_type_order_idx
  on public.note_learning_activity_links(note_id, activity_type, display_order);

alter table public.note_learning_activity_links enable row level security;
revoke all on table public.note_learning_activity_links from anon, authenticated;
grant all on table public.note_learning_activity_links to service_role;

comment on table public.note_learning_activity_links is
  'Maps a specific note to the exact quiz questions, flashcard decks, and recall questions used for note-level practice. Does not duplicate learning content.';
comment on column public.note_learning_activity_links.activity_type is
  'Activity type that selects exactly one corresponding target column.';

create table if not exists public.learning_recommendation_settings (
  id smallint primary key default 1 check (id = 1),
  passing_threshold numeric(5,2) not null default 70
    check (passing_threshold >= 0 and passing_threshold <= 100),
  low_mastery_threshold numeric(5,2) not null default 50
    check (low_mastery_threshold >= 0 and low_mastery_threshold <= 100),
  updated_at timestamptz not null default now()
);

insert into public.learning_recommendation_settings (id, passing_threshold, low_mastery_threshold)
values (1, 70, 50)
on conflict (id) do nothing;

alter table public.learning_recommendation_settings enable row level security;
revoke all on table public.learning_recommendation_settings from anon, authenticated;
grant all on table public.learning_recommendation_settings to service_role;
comment on table public.learning_recommendation_settings is
  'Single source of truth for learning recommendation thresholds; activity pages must read this setting instead of hardcoding thresholds.';