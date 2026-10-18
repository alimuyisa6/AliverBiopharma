-- Remove duplicate overview themes when a Core concepts theme already exists.
-- Transfer their resource links to the canonical lesson first.
WITH duplicates AS (
  SELECT theme.id theme_id, lesson.id lesson_id, sibling_lesson.id destination_lesson_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units sibling
    ON sibling.parent_id=theme.parent_id
   AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  JOIN public.curriculum_units sibling_lesson
    ON sibling_lesson.parent_id=sibling.id AND sibling_lesson.node_type='lesson'
  WHERE theme.slug LIKE 'overview-topic-auto-%'
)
INSERT INTO public.learning_content_links
  (curriculum_unit_id,content_type,content_id,relationship_type,is_primary,link_origin)
SELECT d.destination_lesson_id,l.content_type,l.content_id,l.relationship_type,l.is_primary,'imported'
FROM duplicates d JOIN public.learning_content_links l ON l.curriculum_unit_id=d.lesson_id
ON CONFLICT DO NOTHING;

DELETE FROM public.curriculum_unit_relationships
WHERE source_unit_id IN (
  SELECT theme.id FROM public.curriculum_units theme
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
) OR target_unit_id IN (
  SELECT theme.id FROM public.curriculum_units theme
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
) OR source_unit_id IN (
  SELECT lesson.id FROM public.curriculum_units lesson
  JOIN public.curriculum_units theme ON theme.id=lesson.parent_id
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
) OR target_unit_id IN (
  SELECT lesson.id FROM public.curriculum_units lesson
  JOIN public.curriculum_units theme ON theme.id=lesson.parent_id
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
);

DELETE FROM public.learning_content_links
WHERE curriculum_unit_id IN (
  SELECT lesson.id FROM public.curriculum_units lesson
  JOIN public.curriculum_units theme ON theme.id=lesson.parent_id
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
);

DELETE FROM public.curriculum_unit_blocks
WHERE unit_id IN (
  SELECT lesson.id FROM public.curriculum_units lesson
  JOIN public.curriculum_units theme ON theme.id=lesson.parent_id
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
);

DELETE FROM public.curriculum_units lesson
WHERE lesson.node_type='lesson' AND lesson.parent_id IN (
  SELECT theme.id FROM public.curriculum_units theme
  JOIN public.curriculum_units sibling ON sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  WHERE theme.slug LIKE 'overview-topic-auto-%'
);

DELETE FROM public.curriculum_units theme
WHERE theme.slug LIKE 'overview-topic-auto-%'
  AND EXISTS (
    SELECT 1 FROM public.curriculum_units sibling
    WHERE sibling.parent_id=theme.parent_id AND sibling.slug='core-concepts-auto-'||substr(theme.parent_id::text,1,8)
  );
