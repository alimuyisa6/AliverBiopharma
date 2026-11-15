-- Sketchy-reference learning foundations and integrity safeguards.
-- Extends existing Aliver learning tables; does not create a duplicate question bank.

-- Searchable global question bank using existing formal published questions.
alter table public.quiz_questions
  add column if not exists search_vector tsvector
  generated always as (
    to_tsvector('english',
      coalesce(question_text,'') || ' ' || coalesce(explanation,'') || ' ' ||
      coalesce(concept_name,'') || ' ' || coalesce(subtopic,'') || ' ' ||
      coalesce(learning_objective,'')
    )
  ) stored;

create index if not exists quiz_questions_global_bank_search_idx
  on public.quiz_questions using gin (search_vector)
  where status='published' and is_active=true and is_note_practice=false;
create index if not exists quiz_questions_global_bank_filter_idx
  on public.quiz_questions (difficulty,question_type,id)
  where status='published' and is_active=true and is_note_practice=false;

-- Persist custom test runs against the existing quiz_attempts and answer records.
create table if not exists public.learning_test_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  blueprint_id uuid references public.learning_test_blueprints(id) on delete set null,
  attempt_id uuid not null unique references public.quiz_attempts(id) on delete cascade,
  question_snapshot jsonb not null,
  filters jsonb not null default '{}'::jsonb,
  time_limit_seconds integer,
  status text not null default 'in_progress'
    check(status in ('in_progress','submitted','abandoned')),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint learning_test_runs_question_snapshot_check
    check(jsonb_typeof(question_snapshot)='array' and jsonb_array_length(question_snapshot)>0),
  constraint learning_test_runs_time_limit_check
    check(time_limit_seconds is null or time_limit_seconds>0),
  constraint learning_test_runs_completion_check
    check((status='submitted' and completed_at is not null)
       or (status<>'submitted' and completed_at is null))
);
create index if not exists learning_test_runs_user_started_idx
  on public.learning_test_runs(user_id,started_at desc);
create index if not exists learning_test_runs_blueprint_idx
  on public.learning_test_runs(blueprint_id,started_at desc) where blueprint_id is not null;

alter table public.learning_test_runs enable row level security;
revoke all on public.learning_test_runs from anon,authenticated;
grant select on public.learning_test_runs to authenticated;
grant all on public.learning_test_runs to service_role;
drop policy if exists learning_test_runs_owner_select on public.learning_test_runs;
create policy learning_test_runs_owner_select on public.learning_test_runs
  for select to authenticated using(user_id=(select auth.uid()));

create or replace function public.validate_learning_test_run_ownership()
returns trigger language plpgsql set search_path=public as $$
declare v_attempt_user uuid; v_blueprint_user uuid; v_blueprint_archived boolean;
begin
  select user_id into v_attempt_user from public.quiz_attempts where id=new.attempt_id;
  if v_attempt_user is null or v_attempt_user<>new.user_id then
    raise exception 'Quiz attempt must belong to the learning test run owner';
  end if;
  if new.blueprint_id is not null then
    select user_id,is_archived into v_blueprint_user,v_blueprint_archived
      from public.learning_test_blueprints where id=new.blueprint_id;
    if v_blueprint_user is null or v_blueprint_user<>new.user_id or v_blueprint_archived then
      raise exception 'Blueprint must be active and belong to the learning test run owner';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists learning_test_runs_validate_ownership on public.learning_test_runs;
create trigger learning_test_runs_validate_ownership
  before insert or update of user_id,blueprint_id,attempt_id on public.learning_test_runs
  for each row execute function public.validate_learning_test_run_ownership();

-- Only active, published, formal QBank questions can be attached to saved tests.
create or replace function public.validate_learning_test_blueprint_item()
returns trigger language plpgsql set search_path=public as $$
declare v_archived boolean; v_question_active boolean; v_question_status text; v_note_practice boolean;
begin
  select is_archived into v_archived from public.learning_test_blueprints where id=new.blueprint_id;
  if v_archived is null or v_archived then
    raise exception 'Cannot add questions to a missing or archived test blueprint';
  end if;
  select is_active,status,is_note_practice
    into v_question_active,v_question_status,v_note_practice
    from public.quiz_questions where id=new.question_id;
  if not found or v_question_active is not true or v_question_status<>'published' or v_note_practice is true then
    raise exception 'Custom tests can only include active, published formal QBank questions';
  end if;
  return new;
end $$;
drop trigger if exists learning_test_blueprint_items_validate on public.learning_test_blueprint_items;
create trigger learning_test_blueprint_items_validate
  before insert or update of blueprint_id,question_id on public.learning_test_blueprint_items
  for each row execute function public.validate_learning_test_blueprint_item();

-- Maintain the displayed saved-test question count from the item relation.
create or replace function public.sync_learning_test_blueprint_question_count()
returns trigger language plpgsql set search_path=public as $$
declare v_old_blueprint uuid; v_new_blueprint uuid;
begin
  if tg_op<>'INSERT' then v_old_blueprint:=old.blueprint_id; end if;
  if tg_op<>'DELETE' then v_new_blueprint:=new.blueprint_id; end if;
  if v_old_blueprint is not null then
    update public.learning_test_blueprints
      set question_count=(select count(*)::integer from public.learning_test_blueprint_items where blueprint_id=v_old_blueprint),
          updated_at=now()
      where id=v_old_blueprint;
  end if;
  if v_new_blueprint is not null and v_new_blueprint is distinct from v_old_blueprint then
    update public.learning_test_blueprints
      set question_count=(select count(*)::integer from public.learning_test_blueprint_items where blueprint_id=v_new_blueprint),
          updated_at=now()
      where id=v_new_blueprint;
  end if;
  return null;
end $$;
drop trigger if exists learning_test_blueprint_items_sync_count on public.learning_test_blueprint_items;
create trigger learning_test_blueprint_items_sync_count
  after insert or update or delete on public.learning_test_blueprint_items
  for each row execute function public.sync_learning_test_blueprint_question_count();

-- Clinical cases require review before publication/learner visibility.
alter table public.lab_cases
  add column if not exists description text,
  add column if not exists clinical_domain text,
  add column if not exists case_type text not null default 'patient_encounter',
  add column if not exists learning_objectives jsonb not null default '[]'::jsonb,
  add column if not exists estimated_duration_minutes integer,
  add column if not exists author_id uuid references auth.users(id) on delete set null,
  add column if not exists reviewer_id uuid references auth.users(id) on delete set null,
  add column if not exists review_status text not null default 'draft',
  add column if not exists reviewed_at timestamptz,
  add column if not exists created_at timestamptz not null default now(),
  add column if not exists updated_at timestamptz not null default now();
alter table public.lab_cases alter column is_active set default false;
alter table public.lab_cases
  add constraint lab_cases_case_type_check
    check(case_type in ('patient_encounter','diagnostic_reasoning','imaging_interpretation','lab_interpretation','differential_building','clinical_vignette')),
  add constraint lab_cases_learning_objectives_check check(jsonb_typeof(learning_objectives)='array'),
  add constraint lab_cases_duration_check check(estimated_duration_minutes is null or estimated_duration_minutes>0),
  add constraint lab_cases_review_status_check check(review_status in ('draft','in_review','approved','published','archived')),
  add constraint lab_cases_active_requires_published_check check(is_active is not true or review_status='published');
create index if not exists lab_cases_review_status_idx on public.lab_cases(review_status,is_active);
create index if not exists lab_cases_clinical_domain_idx on public.lab_cases(clinical_domain,difficulty) where is_active=true;

-- Deterministic stage order and protected marking rubrics.
alter table public.lab_case_stages alter column case_id set not null;
alter table public.lab_case_stages
  add constraint lab_case_stages_order_positive_check check(stage_order>0),
  add constraint lab_case_stages_case_order_unique unique(case_id,stage_order),
  add constraint lab_case_stages_id_case_unique unique(id,case_id);

create table if not exists public.lab_case_stage_evaluations (
  stage_id uuid primary key references public.lab_case_stages(id) on delete cascade,
  expected_response jsonb not null default '{}'::jsonb,
  scoring_rubric jsonb not null default '{}'::jsonb,
  feedback_config jsonb not null default '{}'::jsonb,
  max_score numeric(8,2) not null default 1 check(max_score>0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lab_case_stage_evaluations enable row level security;
revoke all on public.lab_case_stage_evaluations from anon,authenticated;
grant all on public.lab_case_stage_evaluations to service_role;

-- Enforce that a simulation's selected stage belongs to its selected case.
alter table public.clinical_simulation_sessions
  add constraint clinical_simulation_sessions_current_stage_case_fkey
  foreign key(current_stage_id,case_id)
  references public.lab_case_stages(id,case_id) on delete restrict not valid;
alter table public.clinical_simulation_sessions
  validate constraint clinical_simulation_sessions_current_stage_case_fkey;
create index if not exists clinical_simulation_sessions_current_stage_case_idx
  on public.clinical_simulation_sessions(current_stage_id,case_id);
create index if not exists clinical_simulation_turns_stage_idx
  on public.clinical_simulation_turns(stage_id) where stage_id is not null;

alter table public.clinical_simulation_sessions
  add column if not exists score numeric(8,2),
  add column if not exists max_score numeric(8,2),
  add column if not exists feedback jsonb not null default '{}'::jsonb,
  add constraint clinical_simulation_sessions_score_check
    check((score is null and max_score is null) or
      (score is not null and max_score is not null and max_score>0 and score>=0 and score<=max_score));

-- Session lifecycle and scoring are server-owned; learners only read their own
-- sessions and append learner-authored turns.
drop policy if exists clinical_simulation_sessions_owner_insert on public.clinical_simulation_sessions;
drop policy if exists clinical_simulation_sessions_owner_update on public.clinical_simulation_sessions;
revoke all on public.clinical_simulation_sessions from anon;
revoke insert,update,delete on public.clinical_simulation_sessions from authenticated;
grant select on public.clinical_simulation_sessions to authenticated;
revoke all on public.clinical_simulation_turns from anon;
revoke update,delete on public.clinical_simulation_turns from authenticated;
grant select,insert on public.clinical_simulation_turns to authenticated;

-- Legacy score rows become read-only to learners; new results must be computed
-- by the trusted clinical simulation service.
alter table public.lab_case_scores
  add column if not exists session_id uuid unique
    references public.clinical_simulation_sessions(id) on delete set null,
  add constraint lab_case_scores_score_bounds_check
    check((score is null or score>=0) and (max_score is null or max_score>0) and
      (score is null or max_score is null or score<=max_score));

create or replace function public.validate_lab_case_score_session()
returns trigger language plpgsql set search_path=public as $$
declare v_session_user uuid; v_session_case uuid;
begin
  if new.session_id is not null then
    select user_id,case_id into v_session_user,v_session_case
      from public.clinical_simulation_sessions where id=new.session_id;
    if v_session_user is null or v_session_user<>new.user_id or v_session_case<>new.case_id then
      raise exception 'Simulation score must match the session owner and case';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists lab_case_scores_validate_session on public.lab_case_scores;
create trigger lab_case_scores_validate_session
  before insert or update of session_id,user_id,case_id on public.lab_case_scores
  for each row execute function public.validate_lab_case_score_session();
drop policy if exists lab_case_scores_insert_own on public.lab_case_scores;
drop policy if exists lab_case_scores_update_own on public.lab_case_scores;
revoke all on public.lab_case_scores from anon;
revoke insert,update,delete on public.lab_case_scores from authenticated;
grant select on public.lab_case_scores to authenticated;
