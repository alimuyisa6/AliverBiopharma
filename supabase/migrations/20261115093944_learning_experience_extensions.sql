alter table public.curriculum_unit_blocks add column if not exists interactive_config jsonb not null default '{}'::jsonb;
create table if not exists public.learning_test_blueprints (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check (length(btrim(title)) between 1 and 120),
 description text,
 filters jsonb not null default '{}'::jsonb,
 question_count integer not null default 0 check (question_count >= 0),
 is_archived boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.learning_test_blueprint_items (
 id uuid primary key default gen_random_uuid(),
 blueprint_id uuid not null references public.learning_test_blueprints(id) on delete cascade,
 question_id bigint not null references public.quiz_questions(id) on delete cascade,
 position integer not null check (position > 0),
 created_at timestamptz not null default now(),
 constraint learning_test_blueprint_items_unique_question unique (blueprint_id, question_id),
 constraint learning_test_blueprint_items_unique_position unique (blueprint_id, position)
);
create table if not exists public.clinical_simulation_sessions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 case_id uuid not null references public.lab_cases(id) on delete restrict,
 status text not null default 'in_progress' check (status in ('in_progress','completed','abandoned')),
 current_stage_id uuid references public.lab_case_stages(id) on delete set null,
 started_at timestamptz not null default now(),
 completed_at timestamptz,
 last_activity_at timestamptz not null default now(),
 constraint clinical_simulation_completed_at_check check ((status = 'completed' and completed_at is not null) or (status <> 'completed' and completed_at is null))
);
create table if not exists public.clinical_simulation_turns (
 id uuid primary key default gen_random_uuid(),
 session_id uuid not null references public.clinical_simulation_sessions(id) on delete cascade,
 stage_id uuid references public.lab_case_stages(id) on delete set null,
 turn_number integer not null check (turn_number > 0),
 speaker text not null check (speaker in ('learner','patient','attending','system')),
 message text not null check (length(btrim(message)) > 0),
 response_data jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(),
 constraint clinical_simulation_turns_unique_number unique (session_id,turn_number)
);
create index if not exists learning_test_blueprints_user_updated_idx on public.learning_test_blueprints(user_id,updated_at desc) where is_archived = false;
create index if not exists learning_test_blueprint_items_question_idx on public.learning_test_blueprint_items(question_id);
create index if not exists clinical_simulation_sessions_user_activity_idx on public.clinical_simulation_sessions(user_id,last_activity_at desc);
create index if not exists clinical_simulation_sessions_case_idx on public.clinical_simulation_sessions(case_id,status);
create index if not exists clinical_simulation_turns_session_order_idx on public.clinical_simulation_turns(session_id,turn_number);
alter table public.learning_test_blueprints enable row level security;
alter table public.learning_test_blueprint_items enable row level security;
alter table public.clinical_simulation_sessions enable row level security;
alter table public.clinical_simulation_turns enable row level security;
drop policy if exists learning_test_blueprints_owner_select on public.learning_test_blueprints;
create policy learning_test_blueprints_owner_select on public.learning_test_blueprints for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists learning_test_blueprints_owner_insert on public.learning_test_blueprints;
create policy learning_test_blueprints_owner_insert on public.learning_test_blueprints for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists learning_test_blueprints_owner_update on public.learning_test_blueprints;
create policy learning_test_blueprints_owner_update on public.learning_test_blueprints for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists learning_test_blueprints_owner_delete on public.learning_test_blueprints;
create policy learning_test_blueprints_owner_delete on public.learning_test_blueprints for delete to authenticated using (user_id = (select auth.uid()));
drop policy if exists learning_test_blueprint_items_owner_select on public.learning_test_blueprint_items;
create policy learning_test_blueprint_items_owner_select on public.learning_test_blueprint_items for select to authenticated using (exists (select 1 from public.learning_test_blueprints b where b.id = blueprint_id and b.user_id = (select auth.uid())));
drop policy if exists learning_test_blueprint_items_owner_insert on public.learning_test_blueprint_items;
create policy learning_test_blueprint_items_owner_insert on public.learning_test_blueprint_items for insert to authenticated with check (exists (select 1 from public.learning_test_blueprints b where b.id = blueprint_id and b.user_id = (select auth.uid())));
drop policy if exists learning_test_blueprint_items_owner_update on public.learning_test_blueprint_items;
create policy learning_test_blueprint_items_owner_update on public.learning_test_blueprint_items for update to authenticated using (exists (select 1 from public.learning_test_blueprints b where b.id = blueprint_id and b.user_id = (select auth.uid()))) with check (exists (select 1 from public.learning_test_blueprints b where b.id = blueprint_id and b.user_id = (select auth.uid())));
drop policy if exists learning_test_blueprint_items_owner_delete on public.learning_test_blueprint_items;
create policy learning_test_blueprint_items_owner_delete on public.learning_test_blueprint_items for delete to authenticated using (exists (select 1 from public.learning_test_blueprints b where b.id = blueprint_id and b.user_id = (select auth.uid())));
drop policy if exists clinical_simulation_sessions_owner_select on public.clinical_simulation_sessions;
create policy clinical_simulation_sessions_owner_select on public.clinical_simulation_sessions for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists clinical_simulation_sessions_owner_insert on public.clinical_simulation_sessions;
create policy clinical_simulation_sessions_owner_insert on public.clinical_simulation_sessions for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists clinical_simulation_sessions_owner_update on public.clinical_simulation_sessions;
create policy clinical_simulation_sessions_owner_update on public.clinical_simulation_sessions for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
drop policy if exists clinical_simulation_turns_owner_select on public.clinical_simulation_turns;
create policy clinical_simulation_turns_owner_select on public.clinical_simulation_turns for select to authenticated using (exists (select 1 from public.clinical_simulation_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
drop policy if exists clinical_simulation_turns_owner_insert on public.clinical_simulation_turns;
create policy clinical_simulation_turns_owner_insert on public.clinical_simulation_turns for insert to authenticated with check (exists (select 1 from public.clinical_simulation_sessions s where s.id = session_id and s.user_id = (select auth.uid())));
grant select,insert,update,delete on public.learning_test_blueprints to authenticated;
grant select,insert,update,delete on public.learning_test_blueprint_items to authenticated;
grant select,insert,update on public.clinical_simulation_sessions to authenticated;
grant select,insert on public.clinical_simulation_turns to authenticated;
