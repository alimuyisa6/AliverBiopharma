-- Count resources reachable through either legacy unit_id assignment or
-- canonical learning_content_links, so theme activity cards reflect actual content.
create or replace function public.get_curriculum_node(p_unit_id uuid)
returns jsonb
language sql
stable
set search_path to 'public'
as $function$
with recursive ancestors as (
  select u.id, u.parent_id, u.group_id, u.name, u.slug, u.node_type, u.display_order, 0 as depth
  from public.curriculum_units u
  where u.id = p_unit_id and u.is_active = true
  union all
  select p.id, p.parent_id, p.group_id, p.name, p.slug, p.node_type, p.display_order, a.depth + 1
  from public.curriculum_units p
  join ancestors a on a.parent_id = p.id
  where p.is_active = true and p.group_id = a.group_id
),
descendants as (
  select u.id, u.group_id
  from public.curriculum_units u
  where u.id = p_unit_id and u.is_active = true
  union all
  select c.id, c.group_id
  from public.curriculum_units c
  join descendants d on d.id = c.parent_id
  where c.is_active = true and c.group_id = d.group_id
),
children as (
  select u.id, u.parent_id, u.group_id, u.name, u.slug, u.node_type, u.display_order, u.icon, u.is_premium, u.is_hard_topic, u.topic_image_url
  from public.curriculum_units u
  where u.parent_id = p_unit_id and u.is_active = true
  order by u.display_order, u.name
),
relationships as (
  select jsonb_agg(x order by x.relationship_type, x.display_order, x.target_name) as items
  from (
    select r.relationship_type, r.display_order, r.metadata,
      t.id as target_id, t.name as target_name, t.slug as target_slug,
      t.node_type as target_node_type
    from public.curriculum_unit_relationships r
    join public.curriculum_units t on t.id = r.target_unit_id and t.is_active = true
    where r.source_unit_id = p_unit_id
  ) x
),
resource_counts as (
  select jsonb_build_object(
    'notes', (select count(*) from (
      select n.id::text resource_id from public.notes n where n.unit_id in (select id from descendants) and n.is_active
      union
      select l.content_id from public.learning_content_links l join public.notes n on n.id::text=l.content_id and n.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='note'
    ) x),
    'quiz_questions', (select count(*) from (
      select q.id::text resource_id from public.quiz_questions q where q.unit_id in (select id from descendants) and q.is_active and q.status='published' and not q.is_note_practice
      union
      select l.content_id from public.learning_content_links l join public.quiz_questions q on q.id::text=l.content_id and q.is_active and q.status='published' and not q.is_note_practice where l.curriculum_unit_id in (select id from descendants) and l.content_type='quiz_question'
    ) x),
    'flashcard_decks', (select count(*) from (
      select f.id::text resource_id from public.flashcard_decks f where f.unit_id in (select id from descendants) and f.is_active
      union
      select l.content_id from public.learning_content_links l join public.flashcard_decks f on f.id::text=l.content_id and f.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='flashcard_deck'
    ) x),
    'recall_questions_bank', (select count(*) from (
      select r.id::text resource_id from public.recall_questions_bank r where r.unit_id in (select id from descendants) and r.is_active
      union
      select l.content_id from public.learning_content_links l join public.recall_questions_bank r on r.id::text=l.content_id and r.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='recall_question'
    ) x),
    'pdf_resources', (select count(*) from (
      select p.id::text resource_id from public.pdf_resources p where p.unit_id in (select id from descendants) and p.is_active
      union
      select l.content_id from public.learning_content_links l join public.pdf_resources p on p.id::text=l.content_id and p.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='pdf_resource'
    ) x),
    'past_papers', (select count(*) from (
      select p.id::text resource_id from public.past_papers p where p.unit_id in (select id from descendants) and p.is_active
      union
      select l.content_id from public.learning_content_links l join public.past_papers p on p.id::text=l.content_id and p.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='past_paper'
    ) x),
    'videos', (select count(*) from (
      select v.id::text resource_id from public.videos v where v.unit_id in (select id from descendants) and v.is_active
      union
      select l.content_id from public.learning_content_links l join public.videos v on v.id::text=l.content_id and v.is_active where l.curriculum_unit_id in (select id from descendants) and l.content_type='video'
    ) x),
    'articles', (select count(*) from (
      select a.id::text resource_id from public.articles a where a.unit_id in (select id from descendants) and a.status='published'
      union
      select l.content_id from public.learning_content_links l join public.articles a on a.id::text=l.content_id and a.status='published' where l.curriculum_unit_id in (select id from descendants) and l.content_type='article'
    ) x),
    'glossary_terms', (select count(*) from (
      select l.content_id from public.learning_content_links l
      join public.glossary_terms g on g.id::text=l.content_id
      where l.curriculum_unit_id in (select id from descendants) and l.content_type='glossary_term'
    ) x),
    'curriculum_unit_blocks', (select count(*) from (
      select b.id::text resource_id from public.curriculum_unit_blocks b where b.unit_id in (select id from descendants)
      union
      select l.content_id from public.learning_content_links l join public.curriculum_unit_blocks b on b.id::text=l.content_id where l.curriculum_unit_id in (select id from descendants) and l.content_type='curriculum_unit_block'
    ) x)
  ) as counts
)
select jsonb_build_object(
  'node', (select to_jsonb(u) from public.curriculum_units u where u.id=p_unit_id and u.is_active=true),
  'ancestors', coalesce((select jsonb_agg(to_jsonb(a) order by a.depth desc) from ancestors a), '[]'::jsonb),
  'children', coalesce((select jsonb_agg(to_jsonb(c) order by c.display_order,c.name) from children c), '[]'::jsonb),
  'relationships', coalesce((select items from relationships), '[]'::jsonb),
  'resource_counts', (select counts from resource_counts)
)
where exists (select 1 from public.curriculum_units u where u.id=p_unit_id and u.is_active=true);
$function$;
