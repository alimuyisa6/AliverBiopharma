-- Challenge foundation: authoritative state transitions and DB-side invariants.
-- Dedicated Quiz/Flashcard/Recall content tables are intentionally NOT created here.

create or replace function public.trg_touch_challenge_updated_at()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin new.updated_at:=now(); return new; end $$;

create or replace function public.trg_validate_daily_challenge_attempt()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype;
begin
  select * into c from public.user_daily_challenges where id=new.daily_challenge_id for share;
  if not found then raise exception 'DAILY_CHALLENGE_NOT_FOUND'; end if;
  if new.user_id<>c.user_id then raise exception 'DAILY_CHALLENGE_USER_MISMATCH'; end if;
  if new.challenge_type<>c.challenge_type then raise exception 'DAILY_CHALLENGE_TYPE_MISMATCH'; end if;
  if new.progress<0 or new.progress>c.target_count then raise exception 'DAILY_CHALLENGE_PROGRESS_INVALID'; end if;
  if new.score is not null and (new.score<0 or new.score>100) then raise exception 'DAILY_CHALLENGE_SCORE_INVALID'; end if;
  return new;
end $$;

create or replace function public.trg_update_challenge_performance()
returns trigger language plpgsql set search_path=public,pg_temp as $$
declare s numeric:=greatest(0,least(100,coalesce(new.score,0)));
begin
  insert into public.user_challenge_performance(
    user_id,challenge_type,level_id,group_id,unit_id,attempts,passes,failures,
    total_score,best_score,last_score,current_streak,best_streak,
    last_attempt_at,last_passed_at,last_failed_at,updated_at
  )
  select c.user_id,c.challenge_type,c.level_id,c.group_id,c.unit_id,1,
    case when new.passed then 1 else 0 end,case when new.passed then 0 else 1 end,
    s,s,s,case when new.passed then 1 else 0 end,case when new.passed then 1 else 0 end,
    coalesce(new.completed_at,now()),
    case when new.passed then coalesce(new.completed_at,now()) end,
    case when not new.passed then coalesce(new.completed_at,now()) end,now()
  from public.user_daily_challenges c where c.id=new.daily_challenge_id
  on conflict(user_id,challenge_type,level_id,group_id,unit_id) do update set
    attempts=public.user_challenge_performance.attempts+1,
    passes=public.user_challenge_performance.passes+excluded.passes,
    failures=public.user_challenge_performance.failures+excluded.failures,
    total_score=public.user_challenge_performance.total_score+excluded.total_score,
    best_score=greatest(coalesce(public.user_challenge_performance.best_score,0),excluded.last_score),
    last_score=excluded.last_score,
    current_streak=case when new.passed then public.user_challenge_performance.current_streak+1 else 0 end,
    best_streak=greatest(public.user_challenge_performance.best_streak,
      case when new.passed then public.user_challenge_performance.current_streak+1 else 0 end),
    last_attempt_at=excluded.last_attempt_at,
    last_passed_at=case when new.passed then excluded.last_passed_at else public.user_challenge_performance.last_passed_at end,
    last_failed_at=case when not new.passed then excluded.last_failed_at else public.user_challenge_performance.last_failed_at end,
    updated_at=now();
  return new;
end $$;

drop trigger if exists trg_touch_user_daily_challenges on public.user_daily_challenges;
create trigger trg_touch_user_daily_challenges before update on public.user_daily_challenges
for each row execute function public.trg_touch_challenge_updated_at();

drop trigger if exists trg_touch_user_challenge_performance on public.user_challenge_performance;
create trigger trg_touch_user_challenge_performance before update on public.user_challenge_performance
for each row execute function public.trg_touch_challenge_updated_at();

drop trigger if exists trg_validate_daily_challenge_attempt on public.user_daily_challenge_attempts;
create trigger trg_validate_daily_challenge_attempt before insert or update on public.user_daily_challenge_attempts
for each row execute function public.trg_validate_daily_challenge_attempt();

drop trigger if exists trg_update_challenge_performance on public.user_daily_challenge_attempts;
create trigger trg_update_challenge_performance after insert on public.user_daily_challenge_attempts
for each row execute function public.trg_update_challenge_performance();

create or replace function public.get_daily_challenge_summary(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype;
begin
  if p_user_id is null then raise exception 'USER_ID_REQUIRED'; end if;
  select * into c from public.user_daily_challenges
  where user_id=p_user_id and challenge_date=(now() at time zone 'Africa/Kampala')::date limit 1;
  if not found or c.status='expired' then return jsonb_build_object('available',false,'challenge',null); end if;
  return jsonb_build_object('available',true,'challenge',jsonb_build_object(
    'id',c.id,'date',c.challenge_date,'type',c.challenge_type,'title',c.title,
    'description',c.description,'target',c.target_count,'passing_score',c.passing_score,
    'reward_xp',c.reward_xp,'status',c.status,'progress',c.progress,'score',c.score,
    'passed',c.passed,'started_at',c.started_at,'completed_at',c.completed_at));
end $$;

create or replace function public.atomic_start_daily_challenge(p_user_id uuid,p_challenge_id uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype;
begin
  if p_user_id is null or p_challenge_id is null then raise exception 'CHALLENGE_ID_AND_USER_REQUIRED'; end if;
  select * into c from public.user_daily_challenges where id=p_challenge_id and user_id=p_user_id for update;
  if not found then raise exception 'DAILY_CHALLENGE_NOT_FOUND'; end if;
  if c.challenge_date<>(now() at time zone 'Africa/Kampala')::date then raise exception 'DAILY_CHALLENGE_NOT_CURRENT'; end if;
  if c.status='completed' then return jsonb_build_object('started',false,'already_completed',true,'challenge_id',c.id); end if;
  if c.status='expired' then raise exception 'DAILY_CHALLENGE_EXPIRED'; end if;
  update public.user_daily_challenges set status='in_progress',started_at=coalesce(started_at,now()) where id=c.id;
  return jsonb_build_object('started',true,'challenge_id',c.id,'type',c.challenge_type,
    'status','in_progress','target',c.target_count,'passing_score',c.passing_score);
end $$;

create or replace function public.atomic_complete_daily_challenge(
  p_user_id uuid,p_challenge_id uuid,p_score numeric,p_progress integer,
  p_source_session_id uuid default null,p_source_attempt_id uuid default null,
  p_performance_data jsonb default '{}'::jsonb,p_failure_reason text default null)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c public.user_daily_challenges%rowtype; a public.user_daily_challenge_attempts%rowtype;
        passed boolean; n integer;
begin
  if p_user_id is null or p_challenge_id is null then raise exception 'CHALLENGE_ID_AND_USER_REQUIRED'; end if;
  if p_score is null or p_score<0 or p_score>100 then raise exception 'CHALLENGE_SCORE_INVALID'; end if;
  select * into c from public.user_daily_challenges where id=p_challenge_id and user_id=p_user_id for update;
  if not found then raise exception 'DAILY_CHALLENGE_NOT_FOUND'; end if;
  if c.status='completed' then return jsonb_build_object('completed',true,'already_completed',true,
    'challenge_id',c.id,'score',c.score,'passed',c.passed,'progress',c.progress); end if;
  if c.status<>'in_progress' then raise exception 'DAILY_CHALLENGE_NOT_IN_PROGRESS'; end if;
  if p_progress<0 or p_progress>c.target_count then raise exception 'DAILY_CHALLENGE_PROGRESS_INVALID'; end if;
  if p_source_session_id is not null then
    select * into a from public.user_daily_challenge_attempts where daily_challenge_id=c.id and source_session_id=p_source_session_id limit 1;
    if found then return jsonb_build_object('completed',true,'idempotent',true,'challenge_id',c.id,'score',c.score,'passed',c.passed,'progress',c.progress,'attempt_id',a.id); end if;
  end if;
  if p_source_attempt_id is not null then
    select * into a from public.user_daily_challenge_attempts where daily_challenge_id=c.id and source_attempt_id=p_source_attempt_id limit 1;
    if found then return jsonb_build_object('completed',true,'idempotent',true,'challenge_id',c.id,'score',c.score,'passed',c.passed,'progress',c.progress,'attempt_id',a.id); end if;
  end if;
  passed:=p_progress>=c.target_count and (c.passing_score is null or p_score>=c.passing_score);
  select coalesce(max(attempt_number),0)+1 into n from public.user_daily_challenge_attempts where daily_challenge_id=c.id;
  insert into public.user_daily_challenge_attempts(
    daily_challenge_id,user_id,attempt_number,challenge_type,source_session_id,source_attempt_id,
    score,passed,progress,failure_reason,performance_data,completed_at)
  values(c.id,p_user_id,n,c.challenge_type,p_source_session_id,p_source_attempt_id,p_score,passed,p_progress,
    p_failure_reason,coalesce(p_performance_data,'{}'::jsonb),now()) returning * into a;
  update public.user_daily_challenges set status=case when passed then 'completed' else 'available' end,
    progress=p_progress,score=p_score,passed=passed,completed_at=case when passed then now() else null end where id=c.id;
  if passed and c.reward_xp>0 and c.xp_awarded_at is null then
    perform public.atomic_add_xp(p_user_id,c.reward_xp,'personalized_daily_challenge','daily_challenge',
      jsonb_build_object('challenge_id',c.id,'challenge_type',c.challenge_type,'attempt_id',a.id),
      c.unit_id,c.group_id,c.level_id);
    update public.user_daily_challenges set xp_awarded_at=now() where id=c.id;
  end if;
  if passed then insert into public.user_daily_challenge_completions(user_id,completed_date,completed_at)
    values(p_user_id,c.challenge_date,now()) on conflict(user_id,completed_date) do nothing; end if;
  return jsonb_build_object('completed',true,'already_completed',false,'challenge_id',c.id,
    'attempt_id',a.id,'score',p_score,'passed',passed,'progress',p_progress,
    'status',case when passed then 'completed' else 'available' end);
end $$;

revoke all on function public.get_daily_challenge_summary(uuid) from public,anon,authenticated;
revoke all on function public.atomic_start_daily_challenge(uuid,uuid) from public,anon,authenticated;
revoke all on function public.atomic_complete_daily_challenge(uuid,uuid,numeric,integer,uuid,uuid,jsonb,text) from public,anon,authenticated;
grant execute on function public.get_daily_challenge_summary(uuid) to service_role;
grant execute on function public.atomic_start_daily_challenge(uuid,uuid) to service_role;
grant execute on function public.atomic_complete_daily_challenge(uuid,uuid,numeric,integer,uuid,uuid,jsonb,text) to service_role;
