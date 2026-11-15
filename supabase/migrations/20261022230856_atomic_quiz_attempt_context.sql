-- Atomically create a quiz attempt with its activity scope and source note.
-- Keep the legacy RPC signature for existing callers; new session creation uses
-- this context-aware wrapper.
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
  if p_activity_scope is not null and p_activity_scope not in ('theme','lesson','note') then
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
