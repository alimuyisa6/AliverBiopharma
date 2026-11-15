-- Support updates/deletes of threshold rows that reference an administrator.
create index if not exists learning_thresholds_updated_by_idx
  on public.learning_thresholds(updated_by)
  where updated_by is not null;
