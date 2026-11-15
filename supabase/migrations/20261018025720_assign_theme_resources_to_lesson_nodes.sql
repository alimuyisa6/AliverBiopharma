-- Move resources owned by a theme onto its lesson; theme queries still include descendants.
UPDATE public.notes r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.flashcard_decks r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.quiz_questions r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.recall_questions_bank r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.pdf_resources r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.past_papers r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.videos r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';

UPDATE public.articles r SET unit_id = lesson.id
FROM public.curriculum_units theme
JOIN public.curriculum_units lesson ON lesson.parent_id = theme.id AND lesson.node_type = 'lesson' AND lesson.is_active = true
WHERE r.unit_id = theme.id AND theme.node_type = 'subtopic';
