-- Dedicated Quiz Challenge session layer.
-- Sessions are separate from normal user_quiz_sessions and are never exposed
-- directly to browser roles.

create table if not exists public.quiz_challenge_sessions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid not null references public.user_daily_challenges(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  unit_id uuid references public.curriculum_units(id) on delete set null,
  group_id text,
  level_id text,
  question_ids jsonb not null,
  answers jsonb not null default '{}'::jsonb,
  question_count integer not null check (question_count > 0),
  answered_count integer not null default 0 check (answered_count >= 0),
  score numeric check (score is null or (score >= 0 and score <= 100)),
  status text not null default 'in_progress'
    check (status in ('in_progress','submitted','completed','expired','abandoned')),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  expires_at timestamptz not null,
  attempt_id uuid references public.user_daily_challenge_attempts(id) on delete set null,
  idempotency_key text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint quiz_challenge_sessions_question_ids_array
    check (jsonb_typeof(question_ids) = 'array'),
  constraint quiz_challenge_sessions_answers_object
    check (jsonb_typeof(answers) = 'object'),
  constraint quiz_challenge_sessions_answered_count_valid
    check (answered_count <= question_count),
  constraint quiz_challenge_sessions_scope_consistent
    check (unit_id is not null or group_id is not null or level_id is not null)
);

create unique index if not exists uq_quiz_challenge_sessions_idempotency
  on public.quiz_challenge_sessions(user_id, idempotency_key);

create unique index if not exists uq_quiz_challenge_sessions_active
  on public.quiz_challenge_sessions(challenge_id)
  where status = 'in_progress';

create index if not exists idx_quiz_challenge_sessions_user
  on public.quiz_challenge_sessions(user_id, created_at desc);

create index if not exists idx_quiz_challenge_sessions_challenge
  on public.quiz_challenge_sessions(challenge_id, created_at desc);

create index if not exists idx_quiz_challenge_sessions_status_expiry
  on public.quiz_challenge_sessions(status, expires_at)
  where status = 'in_progress';

alter table public.quiz_challenge_sessions enable row level security;
revoke all on table public.quiz_challenge_sessions from anon, authenticated;
grant all on table public.quiz_challenge_sessions to service_role;

drop trigger if exists trg_touch_quiz_challenge_sessions on public.quiz_challenge_sessions;
create trigger trg_touch_quiz_challenge_sessions
before update on public.quiz_challenge_sessions
for each row execute function public.trg_touch_challenge_updated_at();

create or replace function public.trg_validate_quiz_challenge_session()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype;
begin
  select * into c from public.user_daily_challenges where id=new.challenge_id for share;
  if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
  if c.user_id<>new.user_id then raise exception 'QUIZ_CHALLENGE_USER_MISMATCH'; end if;
  if c.challenge_type<>'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;
  if c.unit_id is distinct from new.unit_id then raise exception 'QUIZ_CHALLENGE_UNIT_MISMATCH'; end if;
  if c.group_id::text is distinct from new.group_id then raise exception 'QUIZ_CHALLENGE_GROUP_MISMATCH'; end if;
  if c.level_id::text is distinct from new.level_id then raise exception 'QUIZ_CHALLENGE_LEVEL_MISMATCH'; end if;
  if jsonb_array_length(new.question_ids)<>new.question_count then raise exception 'QUIZ_CHALLENGE_QUESTION_COUNT_MISMATCH'; end if;
  if new.answered_count>new.question_count then raise exception 'QUIZ_CHALLENGE_ANSWER_COUNT_INVALID'; end if;
  if new.expires_at<=new.started_at then raise exception 'QUIZ_CHALLENGE_EXPIRY_INVALID'; end if;
  return new;
end $$;

drop trigger if exists trg_validate_quiz_challenge_session on public.quiz_challenge_sessions;
create trigger trg_validate_quiz_challenge_session
before insert or update on public.quiz_challenge_sessions
for each row execute function public.trg_validate_quiz_challenge_session();

create or replace function public.atomic_start_quiz_challenge(
  p_user_id uuid,p_challenge_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype;
existing public.quiz_challenge_sessions%rowtype;
s public.quiz_challenge_sessions%rowtype;
ids jsonb; selected_count integer;
session_ttl interval:=interval '30 minutes';
begin
  if p_user_id is null or p_challenge_id is null or nullif(btrim(p_idempotency_key),'') is null then
    raise exception 'QUIZ_CHALLENGE_START_ARGUMENTS_REQUIRED';
  end if;
  select * into existing from public.quiz_challenge_sessions
    where user_id=p_user_id and idempotency_key=p_idempotency_key limit 1;
  if found then
    return jsonb_build_object('started',true,'idempotent',true,'session_id',existing.id,
      'challenge_id',existing.challenge_id,'status',existing.status,
      'question_count',existing.question_count,'answered_count',existing.answered_count,
      'expires_at',existing.expires_at);
  end if;
  select * into c from public.user_daily_challenges
    where id=p_challenge_id and user_id=p_user_id for update;
  if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
  if c.challenge_type<>'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;
  if c.challenge_date<>(now() at time zone 'Africa/Kampala')::date then raise exception 'QUIZ_CHALLENGE_NOT_CURRENT'; end if;
  if c.status='completed' then raise exception 'QUIZ_CHALLENGE_ALREADY_COMPLETED'; end if;
  if c.status='expired' then raise exception 'QUIZ_CHALLENGE_EXPIRED'; end if;
  if c.target_count<=0 then raise exception 'QUIZ_CHALLENGE_TARGET_INVALID'; end if;

  update public.quiz_challenge_sessions set status='expired',updated_at=now()
    where challenge_id=c.id and status='in_progress' and expires_at<=now();

  select * into existing from public.quiz_challenge_sessions
    where challenge_id=c.id and status='in_progress'
    order by created_at desc limit 1;
  if found then
    return jsonb_build_object('started',true,'resumed',true,'session_id',existing.id,
      'challenge_id',existing.challenge_id,'status',existing.status,
      'question_count',existing.question_count,'answered_count',existing.answered_count,
      'expires_at',existing.expires_at);
  end if;

  select jsonb_agg(x.id order by x.rn),count(*) into ids,selected_count
  from (
    select q.id,row_number() over(order by random()) rn
    from public.quiz_challenge_questions q
    where q.is_active=true and q.status='published'
      and (c.unit_id is null or q.unit_id=c.unit_id)
      and (c.group_id is null or q.group_id=c.group_id)
      and (c.level_id is null or q.level_id=c.level_id)
    order by random() limit c.target_count
  ) x;

  if coalesce(selected_count,0)<c.target_count then
    raise exception 'QUIZ_CHALLENGE_CONTENT_INSUFFICIENT';
  end if;

  insert into public.quiz_challenge_sessions(
    challenge_id,user_id,unit_id,group_id,level_id,question_ids,answers,
    question_count,answered_count,status,started_at,expires_at,idempotency_key)
  values(c.id,p_user_id,c.unit_id,c.group_id,c.level_id,ids,'{}'::jsonb,
    c.target_count,0,'in_progress',now(),now()+session_ttl,p_idempotency_key)
  returning * into s;

  return jsonb_build_object('started',true,'resumed',false,'idempotent',false,
    'session_id',s.id,'challenge_id',s.challenge_id,'status',s.status,
    'question_count',s.question_count,'answered_count',s.answered_count,
    'expires_at',s.expires_at);
end $$;

create or replace function public.get_quiz_challenge_session(
  p_user_id uuid,p_session_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.quiz_challenge_sessions%rowtype;
c public.user_daily_challenges%rowtype;
questions jsonb;
begin
  if p_user_id is null or p_session_id is null then raise exception 'QUIZ_CHALLENGE_SESSION_ARGUMENTS_REQUIRED'; end if;
  select * into s from public.quiz_challenge_sessions
    where id=p_session_id and user_id=p_user_id for update;
  if not found then raise exception 'QUIZ_CHALLENGE_SESSION_NOT_FOUND'; end if;
  if s.status='in_progress' and s.expires_at<=now() then
    update public.quiz_challenge_sessions set status='expired',updated_at=now() where id=s.id;
    s.status:='expired';
  end if;
  select * into c from public.user_daily_challenges where id=s.challenge_id and user_id=p_user_id;
  if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',q.id,'question_text',q.question_text,'option_a',q.option_a,
    'option_b',q.option_b,'option_c',q.option_c,'option_d',q.option_d,
    'explanation',case when s.status in ('completed','submitted') then q.explanation else null end,
    'concept_name',q.concept_name,'subtopic',q.subtopic,
    'learning_objective',q.learning_objective,'difficulty',q.difficulty
  ) order by ord.ordinality),'[]'::jsonb)
  into questions
  from jsonb_array_elements_text(s.question_ids) with ordinality ord(question_id,ordinality)
  join public.quiz_challenge_questions q on q.id=ord.question_id::uuid;

  return jsonb_build_object('session_id',s.id,'challenge_id',s.challenge_id,
    'status',s.status,'question_count',s.question_count,'answered_count',s.answered_count,
    'score',s.score,'started_at',s.started_at,'submitted_at',s.submitted_at,
    'expires_at',s.expires_at,'questions',questions);
end $$;

revoke all on function public.atomic_start_quiz_challenge(uuid,uuid,text) from public,anon,authenticated;
revoke all on function public.get_quiz_challenge_session(uuid,uuid) from public,anon,authenticated;
grant execute on function public.atomic_start_quiz_challenge(uuid,uuid,text) to service_role;
grant execute on function public.get_quiz_challenge_session(uuid,uuid) to service_role;
