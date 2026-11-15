-- Freeze custom test provenance and enforce clinical stage consistency.
create or replace function public.prevent_learning_test_run_snapshot_mutation()
returns trigger language plpgsql set search_path=public as $$
begin
  if new.user_id is distinct from old.user_id
     or new.blueprint_id is distinct from old.blueprint_id
     or new.attempt_id is distinct from old.attempt_id
     or new.question_snapshot is distinct from old.question_snapshot
     or new.filters is distinct from old.filters
     or new.time_limit_seconds is distinct from old.time_limit_seconds
     or new.started_at is distinct from old.started_at then
    raise exception 'Custom test run provenance and question snapshot are immutable';
  end if;
  return new;
end $$;
drop trigger if exists learning_test_runs_snapshot_immutable on public.learning_test_runs;
create trigger learning_test_runs_snapshot_immutable
  before update on public.learning_test_runs
  for each row execute function public.prevent_learning_test_run_snapshot_mutation();

alter table public.lab_cases
  add constraint lab_cases_published_review_check
  check (review_status <> 'published' or (reviewer_id is not null and reviewed_at is not null));

create or replace function public.validate_clinical_simulation_turn_stage()
returns trigger language plpgsql set search_path=public as $$
declare v_session_case uuid; v_stage_case uuid;
begin
  if new.stage_id is not null then
    select case_id into v_session_case from public.clinical_simulation_sessions where id=new.session_id;
    select case_id into v_stage_case from public.lab_case_stages where id=new.stage_id;
    if v_session_case is null or v_stage_case is null or v_session_case<>v_stage_case then
      raise exception 'Simulation turn stage must belong to the session case';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists clinical_simulation_turns_validate_stage on public.clinical_simulation_turns;
create trigger clinical_simulation_turns_validate_stage
  before insert or update of session_id,stage_id on public.clinical_simulation_turns
  for each row execute function public.validate_clinical_simulation_turn_stage();