-- Additive activity context on existing history tables; no attempt/session
-- rows are deleted or rewritten.
begin;

alter table public.quiz_attempts
  add column if not exists activity_scope text,
  add column if not exists source_note_id uuid;

alter table public.user_flashcard_sessions
  add column if not exists activity_scope text,
  add column if not exists source_note_id uuid,
  add column if not exists unit_id uuid;

alter table public.recall_sessions
  add column if not exists activity_scope text,
  add column if not exists source_note_id uuid,
  add column if not exists unit_id uuid,
  add column if not exists group_id text;

do $migration$
begin
  if not exists(select 1 from pg_constraint where conrelid='public.quiz_attempts'::regclass and conname='quiz_attempts_activity_scope_check') then
    alter table public.quiz_attempts add constraint quiz_attempts_activity_scope_check check (activity_scope is null or activity_scope in ('theme','lesson','note'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.quiz_attempts'::regclass and conname='quiz_attempts_source_note_id_fkey') then
    alter table public.quiz_attempts add constraint quiz_attempts_source_note_id_fkey foreign key (source_note_id) references public.notes(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.quiz_attempts'::regclass and conname='quiz_attempts_source_note_scope_check') then
    alter table public.quiz_attempts add constraint quiz_attempts_source_note_scope_check check (source_note_id is null or activity_scope='note');
  end if;

  if not exists(select 1 from pg_constraint where conrelid='public.user_flashcard_sessions'::regclass and conname='user_flashcard_sessions_activity_scope_check') then
    alter table public.user_flashcard_sessions add constraint user_flashcard_sessions_activity_scope_check check (activity_scope is null or activity_scope in ('theme','lesson','note'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.user_flashcard_sessions'::regclass and conname='user_flashcard_sessions_source_note_id_fkey') then
    alter table public.user_flashcard_sessions add constraint user_flashcard_sessions_source_note_id_fkey foreign key (source_note_id) references public.notes(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.user_flashcard_sessions'::regclass and conname='user_flashcard_sessions_source_note_scope_check') then
    alter table public.user_flashcard_sessions add constraint user_flashcard_sessions_source_note_scope_check check (source_note_id is null or activity_scope='note');
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.user_flashcard_sessions'::regclass and conname='user_flashcard_sessions_unit_id_fkey') then
    alter table public.user_flashcard_sessions add constraint user_flashcard_sessions_unit_id_fkey foreign key (unit_id) references public.curriculum_units(id) on delete set null;
  end if;

  if not exists(select 1 from pg_constraint where conrelid='public.recall_sessions'::regclass and conname='recall_sessions_activity_scope_check') then
    alter table public.recall_sessions add constraint recall_sessions_activity_scope_check check (activity_scope is null or activity_scope in ('theme','lesson','note'));
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.recall_sessions'::regclass and conname='recall_sessions_source_note_id_fkey') then
    alter table public.recall_sessions add constraint recall_sessions_source_note_id_fkey foreign key (source_note_id) references public.notes(id) on delete set null;
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.recall_sessions'::regclass and conname='recall_sessions_source_note_scope_check') then
    alter table public.recall_sessions add constraint recall_sessions_source_note_scope_check check (source_note_id is null or activity_scope='note');
  end if;
  if not exists(select 1 from pg_constraint where conrelid='public.recall_sessions'::regclass and conname='recall_sessions_unit_id_fkey') then
    alter table public.recall_sessions add constraint recall_sessions_unit_id_fkey foreign key (unit_id) references public.curriculum_units(id);
  end if;
end
$migration$;

create index if not exists quiz_attempts_source_note_idx on public.quiz_attempts(source_note_id) where source_note_id is not null;
create index if not exists user_flashcard_sessions_source_note_idx on public.user_flashcard_sessions(source_note_id) where source_note_id is not null;
create index if not exists user_flashcard_sessions_unit_idx on public.user_flashcard_sessions(unit_id) where unit_id is not null;
create index if not exists recall_sessions_source_note_idx on public.recall_sessions(source_note_id) where source_note_id is not null;

commit;
