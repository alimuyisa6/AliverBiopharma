-- Dedicated Quiz Challenge completion and compatibility fixes.
-- Final score is recomputed server-side from the immutable session question set.
-- XP/state transition is delegated to the authoritative challenge foundation.

create or replace function public.trg_validate_quiz_challenge_session()
returns trigger
language plpgsql
set search_path=public,pg_temp
as $$
declare
  c public.user_daily_challenges%rowtype;
  answer_key text;
  answer_count integer;
begin
  select * into c from public.user_daily_challenges where id=new.challenge_id for share;
  if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
  if c.user_id<>new.user_id then raise exception 'QUIZ_CHALLENGE_USER_MISMATCH'; end if;
  if c.challenge_type<>'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;
  if c.unit_id is distinct from new.unit_id then raise exception 'QUIZ_CHALLENGE_UNIT_MISMATCH'; end if;
  if c.group_id::text is distinct from new.group_id then raise exception 'QUIZ_CHALLENGE_GROUP_MISMATCH'; end if;
  if c.level_id::text is distinct from new.level_id then raise exception 'QUIZ_CHALLENGE_LEVEL_MISMATCH'; end if;
  if jsonb_typeof(new.question_ids)<>'array' or jsonb_array_length(new.question_ids)<>new.question_count then
    raise exception 'QUIZ_CHALLENGE_QUESTION_COUNT_MISMATCH';
  end if;
  if jsonb_typeof(new.answers)<>'object' then raise exception 'QUIZ_CHALLENGE_ANSWERS_INVALID'; end if;

  select count(*) into answer_count from jsonb_object_keys(new.answers);
  for answer_key in select jsonb_object_keys(new.answers)
  loop
    if not exists (
      select 1 from jsonb_array_elements_text(new.question_ids) x(question_id)
      where x.question_id=answer_key
    ) then raise exception 'QUIZ_CHALLENGE_ANSWER_QUESTION_INVALID'; end if;
  end loop;

  if new.answered_count<>answer_count then raise exception 'QUIZ_CHALLENGE_ANSWER_COUNT_MISMATCH'; end if;
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
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 c public.user_daily_challenges%rowtype;
 existing public.quiz_challenge_sessions%rowtype;
 s public.quiz_challenge_sessions%rowtype;
 ids jsonb; selected_count integer;
 session_ttl interval:=interval '30 minutes';
begin
 if p_user_id is null or p_challenge_id is null or nullif(btrim(p_idempotency_key),'') is null then raise exception 'QUIZ_CHALLENGE_START_ARGUMENTS_REQUIRED'; end if;

 select * into existing from public.quiz_challenge_sessions where user_id=p_user_id and idempotency_key=p_idempotency_key limit 1;
 if found then
   return jsonb_build_object('started',true,'idempotent',true,'session_id',existing.id,'challenge_id',existing.challenge_id,'status',existing.status,'question_count',existing.question_count,'answered_count',existing.answered_count,'expires_at',existing.expires_at);
 end if;

 select * into c from public.user_daily_challenges where id=p_challenge_id and user_id=p_user_id for update;
 if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
 if c.challenge_type<>'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;
 if c.challenge_date<>(now() at time zone 'Africa/Kampala')::date then raise exception 'QUIZ_CHALLENGE_NOT_CURRENT'; end if;
 if c.status='completed' then raise exception 'QUIZ_CHALLENGE_ALREADY_COMPLETED'; end if;
 if c.status='expired' then raise exception 'QUIZ_CHALLENGE_EXPIRED'; end if;
 if c.target_count<=0 then raise exception 'QUIZ_CHALLENGE_TARGET_INVALID'; end if;

 update public.quiz_challenge_sessions set status='expired',updated_at=now()
 where challenge_id=c.id and status='in_progress' and expires_at<=now();

 select * into existing from public.quiz_challenge_sessions
 where challenge_id=c.id and status='in_progress' order by created_at desc limit 1;

 if found then
   if c.status='available' then
     update public.user_daily_challenges set status='in_progress',started_at=coalesce(started_at,existing.started_at) where id=c.id;
   end if;
   return jsonb_build_object('started',true,'resumed',true,'session_id',existing.id,'challenge_id',existing.challenge_id,'status',existing.status,'question_count',existing.question_count,'answered_count',existing.answered_count,'expires_at',existing.expires_at);
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

 if coalesce(selected_count,0)<c.target_count then raise exception 'QUIZ_CHALLENGE_CONTENT_INSUFFICIENT'; end if;

 insert into public.quiz_challenge_sessions(challenge_id,user_id,unit_id,group_id,level_id,question_ids,answers,question_count,answered_count,status,started_at,expires_at,idempotency_key)
 values(c.id,p_user_id,c.unit_id,c.group_id,c.level_id,ids,'{}'::jsonb,c.target_count,0,'in_progress',now(),now()+session_ttl,p_idempotency_key)
 returning * into s;

 update public.user_daily_challenges set status='in_progress',started_at=coalesce(started_at,s.started_at) where id=c.id;

 return jsonb_build_object('started',true,'resumed',false,'idempotent',false,'session_id',s.id,'challenge_id',s.challenge_id,'status',s.status,'question_count',s.question_count,'answered_count',s.answered_count,'expires_at',s.expires_at);
end $$;

revoke all on function public.atomic_start_quiz_challenge(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.atomic_start_quiz_challenge(uuid,uuid,text) to service_role;

create or replace function public.atomic_complete_quiz_challenge(
 p_user_id uuid,p_session_id uuid,p_idempotency_key text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp
as $$
declare
 s public.quiz_challenge_sessions%rowtype;
 c public.user_daily_challenges%rowtype;
 total_questions integer;
 answered_questions integer;
 correct_answers integer;
 calculated_score numeric;
 performance jsonb;
 completion jsonb;
begin
 if p_user_id is null or p_session_id is null or nullif(btrim(p_idempotency_key),'') is null then raise exception 'QUIZ_CHALLENGE_COMPLETE_ARGUMENTS_REQUIRED'; end if;

 select * into s from public.quiz_challenge_sessions where id=p_session_id and user_id=p_user_id for update;
 if not found then raise exception 'QUIZ_CHALLENGE_SESSION_NOT_FOUND'; end if;

 select * into c from public.user_daily_challenges where id=s.challenge_id and user_id=p_user_id for update;
 if not found then raise exception 'QUIZ_CHALLENGE_NOT_FOUND'; end if;
 if c.challenge_type<>'quiz' then raise exception 'QUIZ_CHALLENGE_TYPE_MISMATCH'; end if;

 if s.status='completed' then
   return jsonb_build_object('completed',true,'idempotent',true,'session_id',s.id,'challenge_id',c.id,'score',s.score,'passed',c.passed,'progress',s.answered_count,'attempt_id',s.attempt_id);
 end if;

 if s.status<>'in_progress' then raise exception 'QUIZ_CHALLENGE_SESSION_NOT_ACTIVE'; end if;

 if s.expires_at<=now() then
   update public.quiz_challenge_sessions set status='expired',updated_at=now() where id=s.id;
   raise exception 'QUIZ_CHALLENGE_SESSION_EXPIRED';
 end if;

 total_questions:=jsonb_array_length(s.question_ids);
 select count(*) into answered_questions from jsonb_object_keys(s.answers);

 if total_questions<>s.question_count then raise exception 'QUIZ_CHALLENGE_QUESTION_COUNT_INVALID'; end if;
 if answered_questions<>s.answered_count then raise exception 'QUIZ_CHALLENGE_PROGRESS_INTEGRITY_ERROR'; end if;
 if answered_questions<>total_questions then raise exception 'QUIZ_CHALLENGE_INCOMPLETE'; end if;

 select count(*) into correct_answers
 from jsonb_array_elements_text(s.question_ids) ids(question_id)
 join public.quiz_challenge_questions q on q.id=ids.question_id::uuid
 where q.correct_option=upper(coalesce(s.answers->ids.question_id->>'selected_option',''));

 calculated_score:=round((correct_answers::numeric/total_questions::numeric)*100,2);

 performance:=jsonb_build_object('total_questions',total_questions,'answered_questions',answered_questions,'correct_answers',correct_answers,'incorrect_answers',total_questions-correct_answers);

 completion:=public.atomic_complete_daily_challenge(
   p_user_id,c.id,calculated_score,answered_questions,s.id,null,performance,
   case when c.passing_score is not null and calculated_score<c.passing_score then 'passing_score_not_reached' else null end
 );

 update public.quiz_challenge_sessions
 set status='completed',score=calculated_score,submitted_at=coalesce(submitted_at,now()),updated_at=now()
 where id=s.id;

 return completion || jsonb_build_object('session_id',s.id,'correct_answers',correct_answers,'incorrect_answers',total_questions-correct_answers);
end $$;

revoke all on function public.atomic_complete_quiz_challenge(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.atomic_complete_quiz_challenge(uuid,uuid,text) to service_role;
