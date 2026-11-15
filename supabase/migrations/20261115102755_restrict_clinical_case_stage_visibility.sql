-- Restrict clinical simulation stages to published active cases.
drop policy if exists lab_case_stages_public_read on public.lab_case_stages;
create policy lab_case_stages_public_read
  on public.lab_case_stages
  for select
  to anon, authenticated
  using (
    exists (
      select 1 from public.lab_cases c
      where c.id = lab_case_stages.case_id
        and c.is_active = true
        and c.review_status = 'published'
    ) or is_admin()
  );
drop policy if exists lab_cases_public_read_active on public.lab_cases;
create policy lab_cases_public_read_active
  on public.lab_cases
  for select to anon, authenticated
  using ((is_active = true and review_status = 'published') or is_admin());
create index if not exists lab_case_stages_case_order_idx
  on public.lab_case_stages(case_id, stage_order);