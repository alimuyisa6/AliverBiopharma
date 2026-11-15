-- Database contract for resolving reusable activity items by theme, lesson,
-- or note and classifying outcomes using centralized threshold rows.
create or replace function public.classify_activity_outcome(
  p_activity_type text,
  p_is_complete boolean,
  p_outcome_percent numeric
)
returns text
language sql
stable
set search_path to 'public','pg_temp'
as $function$
  select case
    when not coalesce(p_is_complete,false) then 'incomplete'
    when p_outcome_percent is null then 'unscored'
    when p_outcome_percent >= (
      select t.threshold_value from public.learning_thresholds t
      where t.activity_type=p_activity_type
        and t.threshold_key=case when p_activity_type='quiz' then 'pass_percent' else 'mastery_percent' end
    ) then case when p_activity_type='quiz' then 'passed' else 'mastered' end
    when p_outcome_percent < (
      select t.threshold_value from public.learning_thresholds t
      where t.activity_type=p_activity_type and t.threshold_key='low_percent'
    ) then 'low'
    else 'developing'
  end;
$function$;

create or replace function public.resolve_activity_items(
  p_activity_type text,
  p_scope text,
  p_unit_id uuid default null,
  p_note_id uuid default null
)
returns table(r_item_id text,r_display_order integer,r_note_id uuid)
language plpgsql
stable
security definer
set search_path to 'public','pg_temp'
as $function$
declare
  v_node_type text;
  v_group_id text;
  v_units uuid[];
begin
  if p_activity_type not in ('quiz','flashcard','recall') then
    raise exception 'invalid activity_type %',p_activity_type using errcode='22023';
  end if;
  if p_scope not in ('theme','lesson','note') then
    raise exception 'invalid scope %',p_scope using errcode='22023';
  end if;
  if p_scope='note' then
    if p_note_id is null then raise exception 'note scope requires p_note_id' using errcode='22023'; end if;
    if not exists(select 1 from public.notes n where n.id=p_note_id and n.is_active) then
      raise exception 'note % not found or inactive',p_note_id using errcode='23503';
    end if;
    if p_activity_type='quiz' then
      return query select nq.question_id::text,nq.display_order,nq.note_id
        from public.note_quiz_questions nq join public.quiz_questions q on q.id=nq.question_id
        where nq.note_id=p_note_id and q.is_active and q.status='published' and not q.is_note_practice
        order by nq.display_order,nq.question_id;
    elsif p_activity_type='flashcard' then
      return query select nf.deck_id::text,nf.display_order,nf.note_id
        from public.note_flashcard_decks nf join public.flashcard_decks d on d.id=nf.deck_id
        where nf.note_id=p_note_id and d.is_active order by nf.display_order,nf.deck_id;
    else
      return query select nr.question_id::text,nr.display_order,nr.note_id
        from public.note_recall_questions nr join public.recall_questions_bank r on r.id=nr.question_id
        where nr.note_id=p_note_id and r.is_active order by nr.display_order,nr.question_id;
    end if;
    return;
  end if;
  if p_unit_id is null then raise exception '% scope requires p_unit_id',p_scope using errcode='22023'; end if;
  select u.node_type,u.group_id into v_node_type,v_group_id from public.curriculum_units u where u.id=p_unit_id and u.is_active;
  if v_node_type is null or v_group_id is null then raise exception 'unit % not found or inactive',p_unit_id using errcode='23503'; end if;
  if p_scope='lesson' then
    if v_node_type<>'lesson' then raise exception 'lesson scope requires a lesson node, got %',v_node_type using errcode='23514'; end if;
    v_units:=array[p_unit_id];
  else
    if v_node_type not in ('theme','subtopic') then raise exception 'theme scope requires a theme or subtopic node, got %',v_node_type using errcode='23514'; end if;
    select coalesce(array_agg(d.unit_id),array[p_unit_id]) into v_units
      from public.get_curriculum_descendant_ids(p_unit_id) d
      join public.curriculum_units u on u.id=d.unit_id
      where u.group_id=v_group_id and u.is_active;
  end if;
  if p_activity_type='quiz' then
    return query select q.id::text,(row_number() over(order by q.id))::int,null::uuid
      from public.quiz_questions q
      where q.is_active and q.status='published' and not q.is_note_practice
        and (q.unit_id=any(v_units) or exists(select 1 from public.learning_content_links l where l.curriculum_unit_id=any(v_units) and l.content_type='quiz_question' and l.content_id=q.id::text))
      order by 2,1;
  elsif p_activity_type='flashcard' then
    return query select d.id::text,(row_number() over(order by d.title,d.id))::int,null::uuid
      from public.flashcard_decks d
      where d.is_active and (d.unit_id=any(v_units) or exists(select 1 from public.learning_content_links l where l.curriculum_unit_id=any(v_units) and l.content_type='flashcard_deck' and l.content_id=d.id::text))
      order by 2,1;
  else
    return query select r.id::text,(row_number() over(order by r.id))::int,null::uuid
      from public.recall_questions_bank r
      where r.is_active and (r.unit_id=any(v_units) or exists(select 1 from public.learning_content_links l where l.curriculum_unit_id=any(v_units) and l.content_type='recall_question' and l.content_id=r.id::text))
      order by 2,1;
  end if;
end;
$function$;

grant execute on function public.classify_activity_outcome(text,boolean,numeric) to anon,authenticated,service_role;
grant execute on function public.resolve_activity_items(text,text,uuid,uuid) to authenticated,service_role;
