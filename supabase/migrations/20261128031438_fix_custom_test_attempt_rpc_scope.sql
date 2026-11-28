create or replace function public.atomic_create_quiz_attempt_with_context(
  p_user_id uuid,
  p_unit_id uuid,
  p_group_id text,
  p_level_id text,
  p_session_id uuid,
  p_block_number integer,
  p_attempt_number integer,
  p_status text,
  p_started_at timestamptz,
  p_question_set_hash text,
  p_total_questions integer,
  p_activity_scope text,
  p_source_note_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_attempt_id uuid;
begin
  if p_activity_scope is not null
    and p_activity_scope not in ('theme','lesson','note')
    and p_activity_scope !~ '^custom_test:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$' then
    raise exception 'invalid activity scope %', p_activity_scope using errcode='22023';
  end if;
  if p_source_note_id is not null and p_activity_scope <> 'note' then
    raise exception 'source note requires note activity scope' using errcode='23514';
  end if;

  v_attempt_id := public.atomic_create_quiz_attempt(
    p_user_id,
    p_unit_id,
    p_group_id,
    p_level_id,
    p_session_id,
    p_block_number,
    p_attempt_number,
    p_status,
    p_started_at,
    p_question_set_hash,
    p_total_questions
  );

  update public.quiz_attempts
  set activity_scope = p_activity_scope,
      source_note_id = p_source_note_id
  where id = v_attempt_id and user_id = p_user_id;

  if not found then
    raise exception 'failed to save quiz attempt context' using errcode='P0001';
  end if;

  return v_attempt_id;
end;
$function$;

revoke all on function public.atomic_create_quiz_attempt_with_context(uuid,uuid,text,text,uuid,integer,integer,text,timestamptz,text,integer,text,uuid)
  from public, anon, authenticated;
grant execute on function public.atomic_create_quiz_attempt_with_context(uuid,uuid,text,text,uuid,integer,integer,text,timestamptz,text,integer,text,uuid)
  to service_role;

create or replace function public.validate_activity_session_context()
returns trigger
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_node_type text;
  v_note_unit uuid;
begin
  if new.activity_scope is null then
    return new;
  end if;

  if new.unit_id is null then
    raise exception 'activity_scope % requires unit_id', new.activity_scope using errcode = '23514';
  end if;

  select node_type into v_node_type from public.curriculum_units where id = new.unit_id;
  if v_node_type is null then
    raise exception 'unit_id % does not exist', new.unit_id using errcode = '23503';
  end if;

  if new.activity_scope = 'theme' and v_node_type not in ('theme','subtopic') then
    raise exception 'theme scope requires a theme or subtopic node, got %', v_node_type using errcode = '23514';
  elsif new.activity_scope in ('lesson','note') and v_node_type <> 'lesson' then
    raise exception '% scope requires a lesson node, got %', new.activity_scope, v_node_type using errcode = '23514';
  elsif new.activity_scope like 'custom_test:%' and v_node_type <> 'lesson' then
    raise exception 'custom_test scope requires a lesson node, got %', v_node_type using errcode = '23514';
  end if;

  if new.activity_scope = 'note' then
    if new.source_note_id is null then
      if tg_op = 'UPDATE' and old.source_note_id is not null then
        return new;
      end if;
      raise exception 'note scope requires source_note_id' using errcode = '23514';
    end if;
    select unit_id into v_note_unit from public.notes where id = new.source_note_id;
    if v_note_unit is distinct from new.unit_id then
      raise exception 'source_note_id does not belong to lesson unit_id' using errcode = '23514';
    end if;
  end if;

  return new;
end;
$function$;
