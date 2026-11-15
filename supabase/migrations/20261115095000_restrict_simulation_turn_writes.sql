drop policy if exists clinical_simulation_turns_owner_insert on public.clinical_simulation_turns;

create policy clinical_simulation_turns_owner_insert
on public.clinical_simulation_turns
for insert
to authenticated
with check (
  speaker = 'learner'
  and exists (
    select 1
    from public.clinical_simulation_sessions s
    where s.id = session_id
      and s.user_id = (select auth.uid())
  )
);
