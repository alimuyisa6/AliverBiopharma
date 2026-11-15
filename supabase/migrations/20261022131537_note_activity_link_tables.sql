-- Explicit, reusable note-to-activity relationships. Existing content remains
-- canonical in quiz_questions, flashcard_decks and recall_questions_bank.
begin;

create table if not exists public.note_quiz_questions (
  note_id uuid not null,
  question_id bigint not null,
  display_order integer not null default 0,
  link_origin text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint note_quiz_questions_pkey primary key (note_id, question_id),
  constraint note_quiz_questions_note_id_fkey foreign key (note_id) references public.notes(id) on delete cascade,
  constraint note_quiz_questions_question_id_fkey foreign key (question_id) references public.quiz_questions(id) on delete cascade,
  constraint note_quiz_questions_link_origin_check check (link_origin in ('manual','backfill_lesson_single_note'))
);

create table if not exists public.note_flashcard_decks (
  note_id uuid not null,
  deck_id uuid not null,
  display_order integer not null default 0,
  link_origin text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint note_flashcard_decks_pkey primary key (note_id, deck_id),
  constraint note_flashcard_decks_note_id_fkey foreign key (note_id) references public.notes(id) on delete cascade,
  constraint note_flashcard_decks_deck_id_fkey foreign key (deck_id) references public.flashcard_decks(id) on delete cascade,
  constraint note_flashcard_decks_link_origin_check check (link_origin in ('manual','backfill_lesson_single_note'))
);

create table if not exists public.note_recall_questions (
  note_id uuid not null,
  question_id bigint not null,
  display_order integer not null default 0,
  link_origin text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint note_recall_questions_pkey primary key (note_id, question_id),
  constraint note_recall_questions_note_id_fkey foreign key (note_id) references public.notes(id) on delete cascade,
  constraint note_recall_questions_question_id_fkey foreign key (question_id) references public.recall_questions_bank(id) on delete cascade,
  constraint note_recall_questions_link_origin_check check (link_origin in ('manual','backfill_lesson_single_note'))
);

create index if not exists note_quiz_questions_question_idx on public.note_quiz_questions(question_id);
create index if not exists note_flashcard_decks_deck_idx on public.note_flashcard_decks(deck_id);
create index if not exists note_recall_questions_question_idx on public.note_recall_questions(question_id);

alter table public.note_quiz_questions enable row level security;
alter table public.note_flashcard_decks enable row level security;
alter table public.note_recall_questions enable row level security;

drop policy if exists note_quiz_questions_admin_all on public.note_quiz_questions;
create policy note_quiz_questions_admin_all on public.note_quiz_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists note_flashcard_decks_admin_all on public.note_flashcard_decks;
create policy note_flashcard_decks_admin_all on public.note_flashcard_decks
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists note_flashcard_decks_public_read on public.note_flashcard_decks;
create policy note_flashcard_decks_public_read on public.note_flashcard_decks
  for select to anon, authenticated using (
    exists (select 1 from public.notes n where n.id=note_flashcard_decks.note_id and n.is_active)
    and exists (select 1 from public.flashcard_decks d where d.id=note_flashcard_decks.deck_id and d.is_active)
  );

drop policy if exists note_recall_questions_admin_all on public.note_recall_questions;
create policy note_recall_questions_admin_all on public.note_recall_questions
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists note_recall_questions_public_read on public.note_recall_questions;
create policy note_recall_questions_public_read on public.note_recall_questions
  for select to anon, authenticated using (
    exists (select 1 from public.notes n where n.id=note_recall_questions.note_id and n.is_active)
    and exists (select 1 from public.recall_questions_bank r where r.id=note_recall_questions.question_id and r.is_active)
  );

-- Deterministic backfill only when a lesson has exactly one active note.
-- No titles are used as identifiers and underlying questions/decks are reused.
with one_note_per_unit as (
  select unit_id, (array_agg(id order by id::text))[1] as note_id
  from public.notes
  where is_active and unit_id is not null
  group by unit_id
  having count(*) = 1
)
insert into public.note_quiz_questions(note_id,question_id,display_order,link_origin)
select n.note_id,q.id,(row_number() over(partition by n.note_id order by q.id)-1)::integer,'backfill_lesson_single_note'
from one_note_per_unit n
join public.quiz_questions q on q.unit_id=n.unit_id and q.is_active and q.status='published' and not q.is_note_practice
on conflict (note_id,question_id) do nothing;

with one_note_per_unit as (
  select unit_id, (array_agg(id order by id::text))[1] as note_id
  from public.notes
  where is_active and unit_id is not null
  group by unit_id
  having count(*) = 1
)
insert into public.note_flashcard_decks(note_id,deck_id,display_order,link_origin)
select n.note_id,d.id,(row_number() over(partition by n.note_id order by d.title,d.id)-1)::integer,'backfill_lesson_single_note'
from one_note_per_unit n
join public.flashcard_decks d on d.unit_id=n.unit_id and d.is_active
on conflict (note_id,deck_id) do nothing;

with one_note_per_unit as (
  select unit_id, (array_agg(id order by id::text))[1] as note_id
  from public.notes
  where is_active and unit_id is not null
  group by unit_id
  having count(*) = 1
)
insert into public.note_recall_questions(note_id,question_id,display_order,link_origin)
select n.note_id,r.id,(row_number() over(partition by n.note_id order by r.id)-1)::integer,'backfill_lesson_single_note'
from one_note_per_unit n
join public.recall_questions_bank r on r.unit_id=n.unit_id and r.is_active
on conflict (note_id,question_id) do nothing;

grant select, insert, update, delete on public.note_quiz_questions, public.note_flashcard_decks, public.note_recall_questions to authenticated;
grant select on public.note_flashcard_decks, public.note_recall_questions to anon;
grant all on public.note_quiz_questions, public.note_flashcard_decks, public.note_recall_questions to service_role;

commit;
