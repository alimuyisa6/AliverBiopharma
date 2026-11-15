-- Explicit note-to-article recommendations and one central threshold registry.
begin;

create table if not exists public.note_articles (
  note_id uuid not null,
  article_id uuid not null,
  display_order integer not null default 0,
  reason text,
  relevance_score numeric,
  link_origin text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint note_articles_pkey primary key (note_id,article_id),
  constraint note_articles_note_id_fkey foreign key (note_id) references public.notes(id) on delete cascade,
  constraint note_articles_article_id_fkey foreign key (article_id) references public.articles(id) on delete cascade,
  constraint note_articles_display_order_check check (display_order >= 0),
  constraint note_articles_reason_check check (reason is null or (char_length(reason)>=1 and char_length(reason)<=300)),
  constraint note_articles_relevance_check check (relevance_score is null or (relevance_score>=0 and relevance_score<=1)),
  constraint note_articles_link_origin_check check (link_origin in ('manual','backfill_same_lesson'))
);

create table if not exists public.learning_thresholds (
  activity_type text not null,
  threshold_key text not null,
  threshold_value numeric not null,
  description text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid,
  constraint learning_thresholds_pkey primary key (activity_type,threshold_key),
  constraint learning_thresholds_activity_type_check check (activity_type in ('quiz','flashcard','recall')),
  constraint learning_thresholds_key_check check (threshold_key ~ '^[a-z][a-z0-9_]*$'),
  constraint learning_thresholds_value_check check (threshold_value>=0 and threshold_value<=100),
  constraint learning_thresholds_updated_by_fkey foreign key (updated_by) references auth.users(id) on delete set null
);

create index if not exists note_articles_article_idx on public.note_articles(article_id);
create index if not exists note_articles_note_order_idx on public.note_articles(note_id,display_order);

insert into public.learning_thresholds(activity_type,threshold_key,threshold_value,description) values
 ('quiz','pass_percent',70,'Quiz percentage at or above which an attempt counts as passed'),
 ('quiz','low_percent',50,'Quiz percentage below which performance is low and note revision is recommended'),
 ('flashcard','mastery_percent',80,'Share of cards answered correctly at or above which a deck counts as mastered'),
 ('flashcard','low_percent',50,'Share of cards answered correctly below which performance is low'),
 ('recall','mastery_percent',70,'Share of recall answers rated excellent or strong at or above which recall counts as mastered'),
 ('recall','low_percent',40,'Share of recall answers rated excellent or strong below which performance is low')
on conflict (activity_type,threshold_key) do nothing;

alter table public.note_articles enable row level security;
alter table public.learning_thresholds enable row level security;

drop policy if exists note_articles_public_read on public.note_articles;
create policy note_articles_public_read on public.note_articles
  for select to anon,authenticated using (
    exists(select 1 from public.notes n where n.id=note_articles.note_id and n.is_active)
    and exists(select 1 from public.articles a where a.id=note_articles.article_id and a.status='published')
  );

drop policy if exists note_articles_admin_all on public.note_articles;
create policy note_articles_admin_all on public.note_articles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists learning_thresholds_public_read on public.learning_thresholds;
create policy learning_thresholds_public_read on public.learning_thresholds
  for select to anon,authenticated using (true);

drop policy if exists learning_thresholds_admin_all on public.learning_thresholds;
create policy learning_thresholds_admin_all on public.learning_thresholds
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

with one_note_per_unit as (
  select unit_id,(array_agg(id order by id::text))[1] note_id
  from public.notes where is_active and unit_id is not null
  group by unit_id having count(*)=1
)
insert into public.note_articles(note_id,article_id,display_order,link_origin)
select n.note_id,a.id,0,'backfill_same_lesson'
from one_note_per_unit n join public.articles a on a.unit_id=n.unit_id and a.status='published'
on conflict(note_id,article_id) do nothing;

grant select,insert,update,delete on public.note_articles,public.learning_thresholds to authenticated;
grant select on public.note_articles,public.learning_thresholds to anon;
grant all on public.note_articles,public.learning_thresholds to service_role;

commit;
