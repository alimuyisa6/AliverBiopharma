-- Split broad admin ALL policies into operation-specific policies. Public
-- readers remain read-only; write policies require the existing is_admin().
begin;

drop policy if exists note_articles_admin_all on public.note_articles;
drop policy if exists note_articles_admin_insert on public.note_articles;
drop policy if exists note_articles_admin_update on public.note_articles;
drop policy if exists note_articles_admin_delete on public.note_articles;
create policy note_articles_admin_insert on public.note_articles for insert to authenticated with check (public.is_admin());
create policy note_articles_admin_update on public.note_articles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy note_articles_admin_delete on public.note_articles for delete to authenticated using (public.is_admin());

drop policy if exists learning_thresholds_admin_all on public.learning_thresholds;
drop policy if exists learning_thresholds_admin_insert on public.learning_thresholds;
drop policy if exists learning_thresholds_admin_update on public.learning_thresholds;
drop policy if exists learning_thresholds_admin_delete on public.learning_thresholds;
create policy learning_thresholds_admin_insert on public.learning_thresholds for insert to authenticated with check (public.is_admin());
create policy learning_thresholds_admin_update on public.learning_thresholds for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy learning_thresholds_admin_delete on public.learning_thresholds for delete to authenticated using (public.is_admin());

revoke all on public.note_articles,public.learning_thresholds from anon;
grant select on public.note_articles,public.learning_thresholds to anon;
grant select,insert,update,delete on public.note_articles,public.learning_thresholds to authenticated;
grant all on public.note_articles,public.learning_thresholds to service_role;

commit;
