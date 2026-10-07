-- Dedicated Quiz Challenge answer submission.
-- Correctness is evaluated server-side against quiz_challenge_questions.
-- Client roles receive no direct execution rights.

create or replace function public.submit_quiz_challenge_answer(
  p_user_id uuid,
  p_session_id uuid,
  p_question_id uuid,
  p_selected_option text,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  s public.quiz_challenge_sessions%rowtype;
  q public.quiz_challenge_questions%rowtype;
  existing jsonb;
  normalized_option text;
  correct boolean;
  new_answers jsonb;
  new_answered_count integer;
begin
  if p_user_id is null or p_session_id is null or p_question_id is null
     or nullif(btrim(p_selected_option),'') is null
     or nullif(btrim(p_idempotency_key),'') is null then
    raise exception 'QUIZ_CHALLENGE_ANSWER_ARGUMENTS_REQUIRED';
  end if;

  normalized_option := upper(btrim(p_selected_option));
  if normalized_option not in ('A','B','C','D') then
    raise exception 'QUIZ_CHALLENGE_OPTION_INVALID';
  end if;

  select * into s
  from public.quiz_challenge_sessions
  where id=p_session_id and user_id=p_user_id
  for update;

  if not found then raise exception 'QUIZ_CHALLENGE_SESSION_NOT_FOUND'; end if;
  if s.status <> 'in_progress' then raise exception 'QUIZ_CHALLENGE_SESSION_NOT_ACTIVE'; end if;

  if s.expires_at <= now() then
    update public.quiz_challenge_sessions
    set status='expired',updated_at=now()
    where id=s.id;
    raise exception 'QUIZ_CHALLENGE_SESSION_EXPIRED';
  end if;

  if not exists (
    select 1 from jsonb_array_elements_text(s.question_ids) x(question_id)
    where x.question_id=p_question_id::text
  ) then
    raise exception 'QUIZ_CHALLENGE_QUESTION_NOT_IN_SESSION';
  end if;

  existing := s.answers -> p_question_id::text;

  if existing is not null then
    if existing ->> 'idempotency_key'=p_idempotency_key then
      return jsonb_build_object(
        'accepted',true,'idempotent',true,'session_id',s.id,
        'question_id',p_question_id,'answered_count',s.answered_count,
        'question_count',s.question_count,
        'is_correct',(existing ->> 'is_correct')::boolean
      );
    end if;
    raise exception 'QUIZ_CHALLENGE_QUESTION_ALREADY_ANSWERED';
  end if;

  select * into q
  from public.quiz_challenge_questions
  where id=p_question_id and is_active=true and status='published';

  if not found then raise exception 'QUIZ_CHALLENGE_QUESTION_NOT_FOUND'; end if;

  correct := q.correct_option=normalized_option;
  new_answered_count:=s.answered_count+1;

  new_answers:=jsonb_set(
    coalesce(s.answers,'{}'::jsonb),
    array[p_question_id::text],
    jsonb_build_object(
      'selected_option',normalized_option,
      'is_correct',correct,
      'idempotency_key',p_idempotency_key,
      'answered_at',now()
    ),true
  );

  update public.quiz_challenge_sessions
  set answers=new_answers,answered_count=new_answered_count,updated_at=now()
  where id=s.id;

  return jsonb_build_object(
    'accepted',true,'idempotent',false,'session_id',s.id,
    'question_id',p_question_id,'answered_count',new_answered_count,
    'question_count',s.question_count,'is_correct',correct,
    'complete',new_answered_count=s.question_count
  );
end $$;

revoke all on function public.submit_quiz_challenge_answer(uuid,uuid,uuid,text,text)
from public,anon,authenticated;
grant execute on function public.submit_quiz_challenge_answer(uuid,uuid,uuid,text,text)
to service_role;
