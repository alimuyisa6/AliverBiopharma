-- Give every topic without children a theme and lesson level.
WITH candidates AS (
  SELECT topic.*
  FROM public.curriculum_units topic
  WHERE topic.is_active = true AND topic.node_type = 'topic' AND topic.parent_id IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.curriculum_units child WHERE child.parent_id = topic.id AND child.is_active = true)
)
INSERT INTO public.curriculum_units
  (group_id, parent_id, name, code, icon, display_order, is_hard_topic, is_premium, is_active, slug, node_type)
SELECT topic.group_id, topic.id, 'Core concepts of ' || topic.name, NULL, topic.icon, 1,
       COALESCE(topic.is_hard_topic, false), COALESCE(topic.is_premium, false), true,
       'core-concepts-auto-' || substr(topic.id::text, 1, 8), 'theme'
FROM candidates topic
ON CONFLICT DO NOTHING;

INSERT INTO public.curriculum_units
  (group_id, parent_id, name, code, icon, display_order, is_hard_topic, is_premium, is_active, slug, node_type)
SELECT theme.group_id, theme.id, 'Introduction to ' || parent.name, NULL, theme.icon, 1,
       COALESCE(parent.is_hard_topic, false), COALESCE(parent.is_premium, false), true,
       'introduction-auto-' || substr(parent.id::text, 1, 8), 'lesson'
FROM public.curriculum_units theme
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.node_type = 'theme' AND theme.slug LIKE 'core-concepts-auto-%'
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_units existing WHERE existing.parent_id = theme.id AND existing.node_type = 'lesson');

INSERT INTO public.learning_content_links
  (curriculum_unit_id, content_type, content_id, relationship_type, is_primary, link_origin)
SELECT lesson.id, link.content_type, link.content_id, link.relationship_type, link.is_primary, 'imported'
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
JOIN public.learning_content_links link ON link.curriculum_unit_id = parent.id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND link.content_type <> 'curriculum_unit_block'
ON CONFLICT DO NOTHING;

INSERT INTO public.curriculum_unit_blocks
  (unit_id, block_number, is_premium, title, content_type, content, media_url)
SELECT lesson.id, block.block_number, block.is_premium, block.title, block.content_type, block.content, block.media_url
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
JOIN public.curriculum_unit_blocks block ON block.unit_id = parent.id
WHERE theme.slug LIKE 'core-concepts-auto-%'
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_unit_blocks existing WHERE existing.unit_id = lesson.id AND existing.block_number = block.block_number);

UPDATE public.notes r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.flashcard_decks r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.quiz_questions r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.recall_questions_bank r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.pdf_resources r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.past_papers r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.videos r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;

UPDATE public.articles r SET unit_id = lesson.id
FROM public.curriculum_units theme JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson'
JOIN public.curriculum_units parent ON parent.id = theme.parent_id
WHERE theme.slug LIKE 'core-concepts-auto-%' AND r.unit_id = parent.id;
