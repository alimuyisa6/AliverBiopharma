-- Expand the existing curriculum hierarchy and add canonical, many-to-many learning-resource links.
-- This is additive: existing IDs and unit_id columns remain intact.

alter table public.curriculum_units
  drop constraint if exists curriculum_units_node_type_check;

alter table public.curriculum_units
  add constraint curriculum_units_node_type_check
  check (
    node_type = any (
      array[
        'unit',
        'topic',
        'theme',
        'module',
        'sub_course_unit',
        'lesson',
        'subtopic',
        'concept'
      ]::text[]
    )
  );

create table if not exists public.learning_content_links (
  id uuid primary key default gen_random_uuid(),
  curriculum_unit_id uuid not null references public.curriculum_units(id) on delete cascade,
  content_type text not null check (
    content_type = any (
      array[
        'note',
        'article',
        'video',
        'flashcard_deck',
        'quiz_question',
        'recall_question',
        'past_paper',
        'pdf_resource',
        'curriculum_unit_block',
        'glossary_term'
      ]::text[]
    )
  ),
  content_id text not null,
  relationship_type text not null default 'associated' check (
    relationship_type = any (
      array[
        'associated',
        'primary',
        'supports',
        'assesses',
        'reinforces',
        'defines',
        'related',
        'next'
      ]::text[]
    )
  ),
  is_primary boolean not null default false,
  link_origin text not null default 'manual' check (
    link_origin = any (array['manual', 'legacy_unit_id', 'imported']::text[])
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint learning_content_links_unique
    unique (curriculum_unit_id, content_type, content_id, relationship_type)
);

create index if not exists learning_content_links_unit_type_idx
  on public.learning_content_links (curriculum_unit_id, content_type);

create index if not exists learning_content_links_content_idx
  on public.learning_content_links (content_type, content_id);

create index if not exists learning_content_links_primary_idx
  on public.learning_content_links (curriculum_unit_id, is_primary)
  where is_primary = true;

alter table public.learning_content_links enable row level security;
revoke all on table public.learning_content_links from anon, authenticated;
grant all on table public.learning_content_links to service_role;

comment on table public.learning_content_links is
  'Canonical many-to-many links between curriculum nodes and existing learning resources. content_id retains the source table ID; resources are never copied.';

comment on column public.learning_content_links.link_origin is
  'legacy_unit_id means this link was safely backfilled from an existing resource unit_id; it does not claim a more specific subtopic than the source data proves.';

-- Preserve existing curriculum assignments as canonical links. Do not guess deeper subtopic assignments.
insert into public.learning_content_links
  (curriculum_unit_id, content_type, content_id, relationship_type, is_primary, link_origin)
select unit_id, content_type, content_id, 'primary', true, 'legacy_unit_id'
from (
  select unit_id, 'note'::text content_type, id::text content_id from public.notes where unit_id is not null
  union all
  select unit_id, 'article', id::text from public.articles where unit_id is not null
  union all
  select unit_id, 'video', id::text from public.videos where unit_id is not null
  union all
  select unit_id, 'flashcard_deck', id::text from public.flashcard_decks where unit_id is not null
  union all
  select unit_id, 'quiz_question', id::text from public.quiz_questions where unit_id is not null
  union all
  select unit_id, 'recall_question', id::text from public.recall_questions_bank where unit_id is not null
  union all
  select unit_id, 'past_paper', id::text from public.past_papers where unit_id is not null
  union all
  select unit_id, 'pdf_resource', id::text from public.pdf_resources where unit_id is not null
  union all
  select unit_id, 'curriculum_unit_block', id::text from public.curriculum_unit_blocks where unit_id is not null
) source_links
on conflict (curriculum_unit_id, content_type, content_id, relationship_type) do nothing;
