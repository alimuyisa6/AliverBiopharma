begin;

alter table public.quiz_question_revisions
  add column if not exists question_type text not null default 'single_choice',
  add column if not exists question_data jsonb not null default '{}'::jsonb,
  add column if not exists answer_key jsonb not null default '{}'::jsonb;

alter table public.quiz_attempt_answers
  add column if not exists selected_answer jsonb,
  add column if not exists question_type text not null default 'single_choice';

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.quiz_question_revisions'::regclass
      and conname = 'quiz_question_revisions_question_type_check'
  ) then
    alter table public.quiz_question_revisions
      add constraint quiz_question_revisions_question_type_check
      check (question_type in ('single_choice','multiple_select','true_false','short_answer','fill_blank','dropdown','numerical'));
  end if;
end
$migration$;

commit;
