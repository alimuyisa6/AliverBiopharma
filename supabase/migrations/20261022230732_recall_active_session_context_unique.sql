-- Preserve one active recall session per user and activity context, not per
-- topic string alone. This allows a note-specific session to coexist with
-- theme-wide practice and keeps separate curriculum nodes distinct.
begin;

drop index if exists public.uq_recall_active_session_context;

create unique index uq_recall_active_session_context
  on public.recall_sessions (
    user_id,
    level,
    coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(topic, ''),
    coalesce(class_name, ''),
    coalesce(activity_scope, 'lesson'),
    coalesce(source_note_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where is_active = true;

commit;
