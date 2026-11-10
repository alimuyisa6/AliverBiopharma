begin;

alter table public.quiz_questions
  add column if not exists question_type text not null default 'single_choice',
  add column if not exists question_data jsonb not null default '{}'::jsonb,
  add column if not exists answer_key jsonb not null default '{}'::jsonb;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_questions'::regclass
      and conname = 'quiz_questions_question_type_check'
  ) then
    alter table public.quiz_questions
      add constraint quiz_questions_question_type_check
      check (question_type in ('single_choice','multiple_select','true_false','short_answer','fill_blank','dropdown','numerical'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_questions'::regclass
      and conname = 'quiz_questions_question_data_object_check'
  ) then
    alter table public.quiz_questions
      add constraint quiz_questions_question_data_object_check
      check (jsonb_typeof(question_data) = 'object');
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_questions'::regclass
      and conname = 'quiz_questions_answer_key_object_check'
  ) then
    alter table public.quiz_questions
      add constraint quiz_questions_answer_key_object_check
      check (jsonb_typeof(answer_key) = 'object');
  end if;
end
$migration$;

create index if not exists idx_quiz_questions_type_unit_status
  on public.quiz_questions (question_type, unit_id, status)
  where is_active = true;

comment on column public.quiz_questions.question_type is
  'Assessment interaction type. Existing questions default to single_choice.';
comment on column public.quiz_questions.question_data is
  'Learner-safe presentation configuration. Never store correct answers here.';
comment on column public.quiz_questions.answer_key is
  'Private server-side grading configuration. Must never be returned by learner endpoints.';

commit;
