-- Preserve resources directly attached to top-level units or populated topics by
-- routing them through a dedicated overview subtopic/theme/lesson path.
WITH resource_units AS (
  SELECT unit_id AS id FROM public.notes WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.flashcard_decks WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.quiz_questions WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.recall_questions_bank WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.pdf_resources WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.past_papers WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.videos WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.articles WHERE unit_id IS NOT NULL
)
INSERT INTO public.curriculum_units
  (group_id,parent_id,name,code,icon,display_order,is_hard_topic,is_premium,is_active,slug,node_type)
SELECT root.group_id,root.id,'Overview of '||root.name,NULL,root.icon,0,
       COALESCE(root.is_hard_topic,false),COALESCE(root.is_premium,false),true,
       'overview-auto-'||substr(root.id::text,1,8),'topic'
FROM public.curriculum_units root JOIN resource_units r ON r.id=root.id
WHERE root.parent_id IS NULL AND root.is_active=true
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_units x WHERE x.parent_id=root.id AND x.slug='overview-auto-'||substr(root.id::text,1,8));

WITH resource_units AS (
  SELECT unit_id AS id FROM public.notes WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.flashcard_decks WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.quiz_questions WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.recall_questions_bank WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.pdf_resources WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.past_papers WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.videos WHERE unit_id IS NOT NULL
  UNION SELECT unit_id FROM public.articles WHERE unit_id IS NOT NULL
)
INSERT INTO public.curriculum_units
  (group_id,parent_id,name,code,icon,display_order,is_hard_topic,is_premium,is_active,slug,node_type)
SELECT topic.group_id,topic.id,'Overview of '||topic.name,NULL,topic.icon,0,
       COALESCE(topic.is_hard_topic,false),COALESCE(topic.is_premium,false),true,
       'overview-topic-auto-'||substr(topic.id::text,1,8),'theme'
FROM public.curriculum_units topic JOIN resource_units r ON r.id=topic.id
WHERE topic.node_type='topic' AND topic.parent_id IS NOT NULL AND topic.is_active=true
  AND EXISTS (SELECT 1 FROM public.curriculum_units child WHERE child.parent_id=topic.id AND child.is_active=true)
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_units x WHERE x.parent_id=topic.id AND x.slug='overview-topic-auto-'||substr(topic.id::text,1,8));

INSERT INTO public.curriculum_units
  (group_id,parent_id,name,code,icon,display_order,is_hard_topic,is_premium,is_active,slug,node_type)
SELECT overview.group_id,overview.id,'Core concepts of '||root.name,NULL,overview.icon,1,
       COALESCE(root.is_hard_topic,false),COALESCE(root.is_premium,false),true,
       'core-concepts-overview-auto-'||substr(root.id::text,1,8),'theme'
FROM public.curriculum_units overview JOIN public.curriculum_units root ON root.id=overview.parent_id
WHERE overview.slug LIKE 'overview-auto-%' AND root.parent_id IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_units child WHERE child.parent_id=overview.id AND child.node_type='theme');

INSERT INTO public.curriculum_units
  (group_id,parent_id,name,code,icon,display_order,is_hard_topic,is_premium,is_active,slug,node_type)
SELECT theme.group_id,theme.id,
       'Introduction to '||CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN root.name ELSE topic.name END,
       NULL,theme.icon,1,COALESCE(source.is_hard_topic,false),COALESCE(source.is_premium,false),true,
       CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%'
            THEN 'introduction-overview-auto-'||substr(root.id::text,1,8)
            ELSE 'introduction-topic-auto-'||substr(topic.id::text,1,8) END,
       'lesson'
FROM public.curriculum_units theme
JOIN public.curriculum_units source ON source.id=theme.parent_id
LEFT JOIN public.curriculum_units root ON theme.slug LIKE 'core-concepts-overview-auto-%' AND root.id=source.parent_id
LEFT JOIN public.curriculum_units topic ON theme.slug LIKE 'overview-topic-auto-%' AND topic.id=source.id
WHERE theme.node_type='theme'
  AND (theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%')
  AND NOT EXISTS (SELECT 1 FROM public.curriculum_units child WHERE child.parent_id=theme.id AND child.node_type='lesson');

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
INSERT INTO public.learning_content_links
  (curriculum_unit_id,content_type,content_id,relationship_type,is_primary,link_origin)
SELECT s.lesson_id,l.content_type,l.content_id,l.relationship_type,l.is_primary,'imported'
FROM lesson_sources s JOIN public.learning_content_links l ON l.curriculum_unit_id=s.source_id
WHERE l.content_type<>'curriculum_unit_block'
ON CONFLICT DO NOTHING;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
INSERT INTO public.curriculum_unit_blocks
  (unit_id,block_number,is_premium,title,content_type,content,media_url)
SELECT s.lesson_id,b.block_number,b.is_premium,b.title,b.content_type,b.content,b.media_url
FROM lesson_sources s JOIN public.curriculum_unit_blocks b ON b.unit_id=s.source_id
WHERE NOT EXISTS (SELECT 1 FROM public.curriculum_unit_blocks x WHERE x.unit_id=s.lesson_id AND x.block_number=b.block_number);

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.notes r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.flashcard_decks r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.quiz_questions r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.recall_questions_bank r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.pdf_resources r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.past_papers r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.videos r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;

WITH lesson_sources AS (
  SELECT lesson.id lesson_id,
         CASE WHEN theme.slug LIKE 'core-concepts-overview-auto-%' THEN overview.parent_id ELSE theme.parent_id END source_id
  FROM public.curriculum_units theme
  JOIN public.curriculum_units lesson ON lesson.parent_id=theme.id AND lesson.node_type='lesson'
  JOIN public.curriculum_units overview ON overview.id=theme.parent_id
  WHERE theme.slug LIKE 'core-concepts-overview-auto-%' OR theme.slug LIKE 'overview-topic-auto-%'
)
UPDATE public.articles r SET unit_id=s.lesson_id FROM lesson_sources s WHERE r.unit_id=s.source_id;
