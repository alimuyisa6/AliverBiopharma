alter table public.user_quiz_sessions
  drop constraint if exists user_quiz_sessions_activity_scope_check;

alter table public.user_quiz_sessions
  add constraint user_quiz_sessions_activity_scope_check
  check (
    activity_scope is null
    or activity_scope = any (array['theme'::text, 'lesson'::text, 'note'::text])
    or activity_scope ~ '^custom_test:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );

alter table public.quiz_attempts
  drop constraint if exists quiz_attempts_activity_scope_check;

alter table public.quiz_attempts
  add constraint quiz_attempts_activity_scope_check
  check (
    activity_scope is null
    or activity_scope = any (array['theme'::text, 'lesson'::text, 'note'::text])
    or activity_scope ~ '^custom_test:[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
  );
