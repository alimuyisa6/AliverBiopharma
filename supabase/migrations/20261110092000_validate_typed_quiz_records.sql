begin;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_question_revisions'::regclass
      and conname = 'quiz_question_revisions_question_data_object_check'
  ) then
    alter table public.quiz_question_revisions
      add constraint quiz_question_revisions_question_data_object_check
      check (jsonb_typeof(question_data) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_question_revisions'::regclass
      and conname = 'quiz_question_revisions_answer_key_object_check'
  ) then
    alter table public.quiz_question_revisions
      add constraint quiz_question_revisions_answer_key_object_check
      check (jsonb_typeof(answer_key) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_attempt_answers'::regclass
      and conname = 'quiz_attempt_answers_question_type_check'
  ) then
    alter table public.quiz_attempt_answers
      add constraint quiz_attempt_answers_question_type_check
      check (question_type in ('single_choice','multiple_select','true_false','short_answer','fill_blank','dropdown','numerical'));
  end if;
end
$migration$;

commit;
