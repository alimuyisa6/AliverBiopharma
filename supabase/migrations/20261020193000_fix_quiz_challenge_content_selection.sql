create or replace function public.atomic_start_quiz_challenge(
  p_user_id uuid,
  p_challenge_id uuid,
  p_idempotency_key text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  c public.user_daily_challenges%rowtype;
  existing public.quiz_challenge_sessions%rowtype;
  s public.quiz_challenge_sessions%rowtype;
  ids jsonb;
  configured_ids uuid[];
  selected_count integer;
  session_ttl interval := interval '30 minutes';
begin
  if p_user_id is null or p_challenge_id is null or nullif(btrim(p_idempotency_key), '') is null then
    raise exception 'QUIZ_CHALLENGE_START_ARGUMENTS_REQUIRED';
  end if;

  select * into existing
  from public.quiz_challenge_sessions
  where user_id = p_user_id and idempotency_key = p_idempotency_key
  limit 1;

  if found then
    return jsonb_build_object(
      'started', true, 'idempotent', true,
      'session_id', existing.id, 'challenge_id', existing.challenge_id,
      'status', existing.status, 'question_count', existing.question_count,
      'answered_count', existing.answered_count, 'expires_at', existing.expires_at
    );
  end if;

  select * into c
  from public.user_daily_challenges
  where id = p_challenge_id and user_id = p_user_id
  for update;

  if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
  if c.challenge_type <> 'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;
  if c.challenge_date <> (now() at time zone 'Africa/Kampala')::date then
    raise exception 'QUIZ_CHALLENGE_NOT_CURRENT';
  end if;
  if c.status = 'completed' then raise exception 'QUIZ_CHALLENGE_ALREADY_COMPLETED'; end if;
  if c.status = 'expired' then raise exception 'QUIZ_CHALLENGE_EXPIRED'; end if;
  if c.target_count <= 0 then raise exception 'QUIZ_CHALLENGE_TARGET_INVALID'; end if;

  update public.quiz_challenge_sessions
  set status = 'expired', updated_at = now()
  where challenge_id = c.id and status = 'in_progress' and expires_at <= now();

  select * into existing
  from public.quiz_challenge_sessions
  where challenge_id = c.id and status = 'in_progress'
  order by created_at desc
  limit 1;

  if found then
    if c.status = 'available' then
      update public.user_daily_challenges
      set status = 'in_progress', started_at = coalesce(started_at, existing.started_at)
      where id = c.id;
    end if;
    return jsonb_build_object(
      'started', true, 'resumed', true,
      'session_id', existing.id, 'challenge_id', existing.challenge_id,
      'status', existing.status, 'question_count', existing.question_count,
      'answered_count', existing.answered_count, 'expires_at', existing.expires_at
    );
  end if;

  -- Daily challenge creation stores a server-selected list of dedicated question
  -- IDs. Honor that list first: some valid published questions intentionally have
  -- null group_id/level_id, so strict equality filters wrongly discard them.
  select coalesce(array_agg(value::uuid), array[]::uuid[])
  into configured_ids
  from jsonb_array_elements_text(
    case
      when jsonb_typeof(c.content_config->'question_ids') = 'array'
        then c.content_config->'question_ids'
      else '[]'::jsonb
    end
  ) as configured(value)
  where value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';

  with ranked as (
    select q.id,
           row_number() over (
             order by
               case when w.question_id is not null and coalesce(w.resolved, false) = false then 0 else 1 end,
               case when w.question_id is not null and coalesce(w.resolved, false) = false
                    then coalesce(w.incorrect_attempts, 0) else 0 end desc,
               case q.difficulty when 'hard' then 1 when 'medium' then 2 else 3 end,
               random()
           ) as rn
    from public.quiz_challenge_questions q
    left join public.user_weak_concepts_v2 w
      on w.user_id = p_user_id
     and w.question_id = q.source_question_id
     and coalesce(w.resolved, false) = false
    where q.id = any(configured_ids)
      and q.unit_id = c.unit_id
      and q.is_active = true
      and q.status = 'published'
      and (q.group_id is null or c.group_id is null or q.group_id = c.group_id)
      and (q.level_id is null or c.level_id is null or q.level_id = c.level_id)
  )
  select jsonb_agg(id order by rn), count(*)
  into ids, selected_count
  from ranked
  where rn <= c.target_count;

  -- Older challenge rows may not have stored question IDs. Retain a scoped
  -- fallback for those rows, without weakening user/challenge ownership checks.
  if coalesce(selected_count, 0) < c.target_count then
    with ranked as (
      select q.id,
             row_number() over (
               order by
                 case when w.question_id is not null and coalesce(w.resolved, false) = false then 0 else 1 end,
                 case when w.question_id is not null and coalesce(w.resolved, false) = false
                      then coalesce(w.incorrect_attempts, 0) else 0 end desc,
                 case q.difficulty when 'hard' then 1 when 'medium' then 2 else 3 end,
                 random()
             ) as rn
      from public.quiz_challenge_questions q
      left join public.user_weak_concepts_v2 w
        on w.user_id = p_user_id
       and w.question_id = q.source_question_id
       and coalesce(w.resolved, false) = false
      where q.is_active = true
        and q.status = 'published'
        and (c.unit_id is null or q.unit_id = c.unit_id)
        and (c.group_id is null or q.group_id = c.group_id)
        and (c.level_id is null or q.level_id = c.level_id)
    )
    select jsonb_agg(id order by rn), count(*)
    into ids, selected_count
    from ranked
    where rn <= c.target_count;
  end if;

  if coalesce(selected_count, 0) < c.target_count then
    raise exception 'QUIZ_CHALLENGE_CONTENT_INSUFFICIENT';
  end if;

  insert into public.quiz_challenge_sessions(
    challenge_id, user_id, unit_id, group_id, level_id, question_ids, answers,
    question_count, answered_count, status, started_at, expires_at, idempotency_key
  )
  values (
    c.id, p_user_id, c.unit_id, c.group_id, c.level_id, ids, '{}'::jsonb,
    c.target_count, 0, 'in_progress', now(), now() + session_ttl, p_idempotency_key
  )
  returning * into s;

  update public.user_daily_challenges
  set status = 'in_progress', started_at = coalesce(started_at, s.started_at)
  where id = c.id;

  return jsonb_build_object(
    'started', true, 'resumed', false, 'idempotent', false,
    'session_id', s.id, 'challenge_id', s.challenge_id, 'status', s.status,
    'question_count', s.question_count, 'answered_count', s.answered_count,
    'expires_at', s.expires_at
  );
end
$function$;
