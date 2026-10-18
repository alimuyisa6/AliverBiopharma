-- Add a lesson beneath each existing third-level curriculum theme.
WITH RECURSIVE tree AS (
  SELECT id, group_id, parent_id, name, slug, node_type, display_order, 0 AS depth
  FROM public.curriculum_units WHERE parent_id IS NULL
  UNION ALL
  SELECT c.id, c.group_id, c.parent_id, c.name, c.slug, c.node_type, c.display_order, p.depth + 1
  FROM public.curriculum_units c JOIN tree p ON c.parent_id = p.id
),
themes AS (
  SELECT t.* FROM tree t WHERE t.depth = 2 AND t.node_type = 'subtopic'
)
INSERT INTO public.curriculum_units
  (group_id, parent_id, name, code, icon, display_order, is_hard_topic, is_premium, is_active, slug, node_type)
SELECT theme.group_id, theme.id, theme.name || ' — Lesson', NULL, theme.icon, 1,
       COALESCE(theme.is_hard_topic, false), COALESCE(theme.is_premium, false),
       COALESCE(theme.is_active, true),
       COALESCE(NULLIF(theme.slug, ''), trim(both '-' from regexp_replace(lower(theme.name), '[^a-z0-9]+', '-', 'g'))) || '-lesson',
       'lesson'
FROM themes theme
WHERE NOT EXISTS (
  SELECT 1 FROM public.curriculum_units existing
  WHERE existing.parent_id = theme.id AND existing.node_type = 'lesson'
);

INSERT INTO public.learning_content_links
  (curriculum_unit_id, content_type, content_id, relationship_type, is_primary, link_origin)
SELECT lesson.id, link.content_type, link.content_id, link.relationship_type, link.is_primary, 'imported'
FROM public.curriculum_units lesson
JOIN public.curriculum_units theme ON theme.id = lesson.parent_id AND theme.node_type = 'subtopic'
JOIN public.learning_content_links link ON link.curriculum_unit_id = theme.id
WHERE lesson.node_type = 'lesson' AND link.content_type <> 'curriculum_unit_block'
ON CONFLICT DO NOTHING;

INSERT INTO public.curriculum_unit_blocks
  (unit_id, block_number, is_premium, title, content_type, content, media_url)
SELECT lesson.id, block.block_number, block.is_premium, block.title, block.content_type, block.content, block.media_url
FROM public.curriculum_units lesson
JOIN public.curriculum_units theme ON theme.id = lesson.parent_id AND theme.node_type = 'subtopic'
JOIN public.curriculum_unit_blocks block ON block.unit_id = theme.id
WHERE lesson.node_type = 'lesson'
  AND NOT EXISTS (
    SELECT 1 FROM public.curriculum_unit_blocks existing
    WHERE existing.unit_id = lesson.id AND existing.block_number = block.block_number
  );
