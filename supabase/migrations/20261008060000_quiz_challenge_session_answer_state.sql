-- Ensure resumed Quiz Challenge sessions return safe answer state.
-- Never expose correct_option; only return the user's submitted choice and
-- correctness already recorded by the server.

create or replace function public.get_quiz_challenge_session(
  p_user_id uuid,
  p_session_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path=public,pg_temp
as $$
declare
  s public.quiz_challenge_sessions%rowtype;
  c public.user_daily_challenges%rowtype;
  questions jsonb;
begin
  if p_user_id is null or p_session_id is null then
    raise exception 'QUIZ_CHALLENGE_SESSION_ARGUMENTS_REQUIRED';
  end if;

  select * into s
  from public.quiz_challenge_sessions
  where id=p_session_id and user_id=p_user_id
  for update;

  if not found then
    raise exception 'QUIZ_CHALLENGE_SESSION_NOT_FOUND';
  end if;

  if s.status='in_progress' and s.expires_at<=now() then
    update public.quiz_challenge_sessions
    set status='expired',updated_at=now()
    where id=s.id;
    s.status:='expired';
  end if;

  select * into c
  from public.user_daily_challenges
  where id=s.challenge_id and user_id=p_user_id;

  if not found then
    raise exception 'QUIZ_CHALLENGE_NOT_FOUND';
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id',q.id,
      'question_text',q.question_text,
      'option_a',q.option_a,
      'option_b',q.option_b,
      'option_c',q.option_c,
      'option_d',q.option_d,
      'explanation',
        case when s.status in ('completed','submitted')
          then q.explanation else null end,
      'concept_name',q.concept_name,
      'subtopic',q.subtopic,
      'learning_objective',q.learning_objective,
      'difficulty',q.difficulty,
      'answer_state',
        case when s.answers ? q.id::text then
          jsonb_build_object(
            'selected_option',
            s.answers->q.id::text->>'selected_option',
            'is_correct',
            (s.answers->q.id::text->>'is_correct')::boolean
          )
        else null end
    ) order by ord.ordinality
  ),'[]'::jsonb)
  into questions
  from jsonb_array_elements_text(s.question_ids)
       with ordinality ord(question_id,ordinality)
  join public.quiz_challenge_questions q
    on q.id=ord.question_id::uuid;

  return jsonb_build_object(
    'session_id',s.id,
    'challenge_id',s.challenge_id,
    'status',s.status,
    'question_count',s.question_count,
    'answered_count',s.answered_count,
    'score',s.score,
    'started_at',s.started_at,
    'submitted_at',s.submitted_at,
    'expires_at',s.expires_at,
    'questions',questions
  );
end $$;

revoke all on function public.get_quiz_challenge_session(uuid,uuid)
from public,anon,authenticated;

grant execute on function public.get_quiz_challenge_session(uuid,uuid)
to service_role;
