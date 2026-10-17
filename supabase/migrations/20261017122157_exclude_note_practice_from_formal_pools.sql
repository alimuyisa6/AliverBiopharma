-- Ensure note-practice rows stay active for the protected note-learning endpoint.
-- Application query filters keep them out of formal quiz, challenge, review and aggregate pools.
begin;

drop index if exists public.idx_quiz_questions_note_practice_pool;
create index idx_quiz_questions_note_practice_pool
  on public.quiz_questions (unit_id, id)
  where is_note_practice = true and is_active = true and status = 'published';

commit;
