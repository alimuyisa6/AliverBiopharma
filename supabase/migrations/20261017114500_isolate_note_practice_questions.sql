-- Keep note-comprehension checks inside the existing question bank,
-- but exclude them from formal quiz blocks, challenges, and spaced-repetition review.
begin;

alter table public.quiz_questions
  add column if not exists is_note_practice boolean not null default false;

comment on column public.quiz_questions.is_note_practice is
  'True only for short, no-XP comprehension checks shown inside note learning; exclude from formal quiz/challenge/review pools.';

update public.quiz_questions
set is_note_practice = true
where created_at = timestamptz '2026-10-17 11:39:01.820026+00'
  and batch_name is null
  and unit_id in (
    '97f7fd08-1714-42e6-a37f-eddd34a0008d'::uuid,
    '059aa074-7228-458d-a6d2-c270bdb972f2'::uuid,
    '0ed34551-ca95-45c0-93a8-90eb7b93e23e'::uuid,
    '67245ca2-e8b7-4992-9fe5-3cb75b09a604'::uuid,
    '1a6da14f-a371-41cd-800b-9885c4769d6a'::uuid,
    '62f176ee-0381-4da2-849d-d8de510a6eb9'::uuid,
    '102a7a2e-5d91-4ca9-8464-ae54a478ab70'::uuid
  )
  and status = 'published'
  and is_active = true;

create index if not exists idx_quiz_questions_note_practice_pool
  on public.quiz_questions (unit_id, id)
  where is_note_practice = true and is_active = true and status = 'published';

commit;
