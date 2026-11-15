-- Aliver Biopharma: distinguish quiz session context without replacing legacy history.
-- Additive migration: preserves all existing quiz sessions and attempts.
begin;

alter table public.user_quiz_sessions
  add column if not exists activity_scope text,
  add column if not exists source_note_id uuid;

do $migration$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_quiz_sessions'::regclass
      and conname = 'user_quiz_sessions_activity_scope_check'
  ) then
    alter table public.user_quiz_sessions
      add constraint user_quiz_sessions_activity_scope_check
      check (activity_scope is null or activity_scope in ('theme', 'lesson', 'note'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_quiz_sessions'::regclass
      and conname = 'user_quiz_sessions_source_note_id_fkey'
  ) then
    alter table public.user_quiz_sessions
      add constraint user_quiz_sessions_source_note_id_fkey
      foreign key (source_note_id) references public.notes(id) on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.user_quiz_sessions'::regclass
      and conname = 'user_quiz_sessions_source_note_scope_check'
  ) then
    alter table public.user_quiz_sessions
      add constraint user_quiz_sessions_source_note_scope_check
      check (source_note_id is null or activity_scope = 'note');
  end if;
end
$migration$;

-- Existing uniqueness rules treated every session on a unit/block as the same
-- activity. Replace them with context-aware indexes so theme/lesson/note practice
-- can reuse the same questions without colliding, while retaining one row per
-- user, context, and block. Quiz attempt history remains in quiz_attempts.
alter table public.user_quiz_sessions
  drop constraint if exists user_quiz_sessions_scope_key,
  drop constraint if exists user_quiz_sessions_user_unit_block_unique;

create unique index if not exists user_quiz_sessions_context_unique
  on public.user_quiz_sessions (
    user_id,
    unit_id,
    block_number,
    coalesce(activity_scope, 'lesson'),
    coalesce(source_note_id, '00000000-0000-0000-0000-000000000000'::uuid)
  )
  where unit_id is not null;

create unique index if not exists user_quiz_sessions_legacy_scope_unique
  on public.user_quiz_sessions (user_id, level, topic, block_number)
  where unit_id is null;

create index if not exists user_quiz_sessions_source_note_idx
  on public.user_quiz_sessions (source_note_id, user_id, updated_at desc)
  where source_note_id is not null;

-- Resolve canonical links as well as legacy unit_id assignments. This keeps
-- lesson and theme activities discoverable when the resource's stored unit_id
-- differs from the node to which it is explicitly linked.
create or replace function public.resolve_activity_items(
  p_activity_type text,
  p_scope text,
  p_unit_id uuid default null,
  p_note_id uuid default null
)
returns table(r_item_id text, r_display_order integer, r_note_id uuid)
language plpgsql
stable
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
  v_node_type text;
  v_group_id text;
  v_units uuid[];
begin
  if p_activity_type not in ('quiz', 'flashcard', 'recall') then
    raise exception 'invalid activity_type %', p_activity_type using errcode = '22023';
  end if;

  if p_scope not in ('theme', 'lesson', 'note') then
    raise exception 'invalid scope %', p_scope using errcode = '22023';
  end if;

  if p_scope = 'note' then
    if p_note_id is null then
      raise exception 'note scope requires p_note_id' using errcode = '22023';
    end if;
    if not exists (
      select 1 from public.notes n
      where n.id = p_note_id and n.is_active
    ) then
      raise exception 'note % not found or inactive', p_note_id using errcode = '23503';
    end if;

    if p_activity_type = 'quiz' then
      return query
        select nq.question_id::text, nq.display_order, nq.note_id
        from public.note_quiz_questions nq
        join public.quiz_questions q on q.id = nq.question_id
        where nq.note_id = p_note_id
          and q.is_active and q.status = 'published' and not q.is_note_practice
        order by nq.display_order, nq.question_id;
    elsif p_activity_type = 'flashcard' then
      return query
        select nf.deck_id::text, nf.display_order, nf.note_id
        from public.note_flashcard_decks nf
        join public.flashcard_decks d on d.id = nf.deck_id
        where nf.note_id = p_note_id and d.is_active
        order by nf.display_order, nf.deck_id;
    else
      return query
        select nr.question_id::text, nr.display_order, nr.note_id
        from public.note_recall_questions nr
        join public.recall_questions_bank r on r.id = nr.question_id
        where nr.note_id = p_note_id and r.is_active
        order by nr.display_order, nr.question_id;
    end if;
    return;
  end if;

  if p_unit_id is null then
    raise exception '% scope requires p_unit_id', p_scope using errcode = '22023';
  end if;

  select u.node_type, u.group_id
    into v_node_type, v_group_id
  from public.curriculum_units u
  where u.id = p_unit_id and u.is_active;

  if v_node_type is null or v_group_id is null then
    raise exception 'unit % not found or inactive', p_unit_id using errcode = '23503';
  end if;

  if p_scope = 'lesson' then
    if v_node_type <> 'lesson' then
      raise exception 'lesson scope requires a lesson node, got %', v_node_type using errcode = '23514';
    end if;
    v_units := array[p_unit_id];
  else
    if v_node_type not in ('theme', 'subtopic') then
      raise exception 'theme scope requires a theme or subtopic node, got %', v_node_type using errcode = '23514';
    end if;

    select coalesce(array_agg(d.unit_id), array[p_unit_id])
      into v_units
    from public.get_curriculum_descendant_ids(p_unit_id) d
    join public.curriculum_units u on u.id = d.unit_id
    where u.group_id = v_group_id and u.is_active;
  end if;

  if p_activity_type = 'quiz' then
    return query
      select distinct q.id::text,
        coalesce((
          select min(l.display_order)
          from public.learning_content_links l
          where l.curriculum_unit_id = any(v_units)
            and l.content_type = 'quiz_question'
            and l.content_id = q.id::text
        ), (row_number() over (order by q.id))::int),
        null::uuid
      from public.quiz_questions q
      where q.is_active and q.status = 'published' and not q.is_note_practice
        and (
          q.unit_id = any(v_units)
          or exists (
            select 1 from public.learning_content_links l
            where l.curriculum_unit_id = any(v_units)
              and l.content_type = 'quiz_question'
              and l.content_id = q.id::text
          )
        )
      order by 2, 1;
  elsif p_activity_type = 'flashcard' then
    return query
      select distinct d.id::text,
        coalesce((
          select min(l.display_order)
          from public.learning_content_links l
          where l.curriculum_unit_id = any(v_units)
            and l.content_type = 'flashcard_deck'
            and l.content_id = d.id::text
        ), (row_number() over (order by d.title, d.id))::int),
        null::uuid
      from public.flashcard_decks d
      where d.is_active
        and (
          d.unit_id = any(v_units)
          or exists (
            select 1 from public.learning_content_links l
            where l.curriculum_unit_id = any(v_units)
              and l.content_type = 'flashcard_deck'
              and l.content_id = d.id::text
          )
        )
      order by 2, 1;
  else
    return query
      select distinct r.id::text,
        coalesce((
          select min(l.display_order)
          from public.learning_content_links l
          where l.curriculum_unit_id = any(v_units)
            and l.content_type = 'recall_question'
            and l.content_id = r.id::text
        ), (row_number() over (order by r.id))::int),
        null::uuid
      from public.recall_questions_bank r
      where r.is_active
        and (
          r.unit_id = any(v_units)
          or exists (
            select 1 from public.learning_content_links l
            where l.curriculum_unit_id = any(v_units)
              and l.content_type = 'recall_question'
              and l.content_id = r.id::text
          )
        )
      order by 2, 1;
  end if;
end;
$function$;

-- The resolver runs with elevated privileges to read across the linked tables.
-- It is a backend-only helper, not a public Data API endpoint.
revoke all on function public.resolve_activity_items(text, text, uuid, uuid)
  from public, anon, authenticated;
grant execute on function public.resolve_activity_items(text, text, uuid, uuid)
  to service_role;

commit;
