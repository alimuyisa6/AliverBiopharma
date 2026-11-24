-- Private, room-scoped realtime access for the collaborative classroom board.
-- Board documents are accessed only through the authenticated classroom API.
create table if not exists public.classroom_whiteboard_snapshots (
  room_id uuid primary key references public.classrooms(id) on delete cascade,
  revision bigint not null default 0 check (revision >= 0),
  document jsonb not null default '{"strokes":[]}'::jsonb,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint classroom_whiteboard_document_is_object
    check (jsonb_typeof(document) = 'object' and jsonb_typeof(document->'strokes') = 'array')
);

alter table public.classroom_whiteboard_snapshots enable row level security;
revoke all on table public.classroom_whiteboard_snapshots from anon, authenticated;
grant all on table public.classroom_whiteboard_snapshots to service_role;

create table if not exists public.classroom_whiteboard_events (
  room_id uuid not null references public.classrooms(id) on delete cascade,
  revision bigint not null check (revision > 0),
  actor_id uuid references auth.users(id) on delete set null,
  operation jsonb not null check (jsonb_typeof(operation) = 'object'),
  created_at timestamptz not null default now(),
  primary key (room_id, revision)
);

-- The (room_id, revision) primary key also supports newest-first history reads.

create table if not exists public.classroom_whiteboard_archives (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.classrooms(id) on delete cascade,
  title text not null check (length(btrim(title)) between 1 and 80),
  revision bigint not null check (revision >= 0),
  document jsonb not null check (jsonb_typeof(document) = 'object' and jsonb_typeof(document->'strokes') = 'array'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists classroom_whiteboard_archives_recent_idx
  on public.classroom_whiteboard_archives (room_id, created_at desc);

alter table public.classroom_whiteboard_events enable row level security;
alter table public.classroom_whiteboard_archives enable row level security;
revoke all on table public.classroom_whiteboard_events from anon, authenticated;
revoke all on table public.classroom_whiteboard_archives from anon, authenticated;
grant all on table public.classroom_whiteboard_events to service_role;
grant all on table public.classroom_whiteboard_archives to service_role;

-- Compare-and-swap the live document and append its audit event atomically.
-- This is SECURITY INVOKER and executable only by the server's service role.
create or replace function public.apply_classroom_whiteboard_revision(
  p_room_id uuid,
  p_expected_revision bigint,
  p_document jsonb,
  p_user_id uuid,
  p_operation jsonb
)
returns bigint
language plpgsql
security invoker
set search_path = ''
as $$
declare
  next_revision bigint;
begin
  if p_expected_revision = 0 then
    insert into public.classroom_whiteboard_snapshots (
      room_id, revision, document, updated_by, updated_at
    ) values (
      p_room_id, 1, p_document, p_user_id, now()
    )
    on conflict (room_id) do update
      set revision = 1,
          document = excluded.document,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at
      where public.classroom_whiteboard_snapshots.revision = 0
    returning revision into next_revision;
  else
    update public.classroom_whiteboard_snapshots
    set revision = p_expected_revision + 1,
        document = p_document,
        updated_by = p_user_id,
        updated_at = now()
    where room_id = p_room_id
      and revision = p_expected_revision
    returning revision into next_revision;
  end if;

  if next_revision is null then
    return null;
  end if;

  insert into public.classroom_whiteboard_events (
    room_id, revision, actor_id, operation
  ) values (
    p_room_id, next_revision, p_user_id, p_operation
  );

  delete from public.classroom_whiteboard_events
  where room_id = p_room_id
    and revision <= next_revision - 2000;

  return next_revision;
end;
$$;

revoke all on function public.apply_classroom_whiteboard_revision(uuid, bigint, jsonb, uuid, jsonb) from public, anon, authenticated;
grant execute on function public.apply_classroom_whiteboard_revision(uuid, bigint, jsonb, uuid, jsonb) to service_role;

-- A private channel is readable/writable only by a currently joined participant.
-- No global authenticated-user policy is introduced on realtime.messages.
drop policy if exists classroom_whiteboard_room_select on realtime.messages;
create policy classroom_whiteboard_room_select
on realtime.messages
for select
to authenticated
using (
  extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.classrooms c
    join public.classroom_participants p on p.room_id = c.id
    where (select realtime.topic()) = 'classroom:whiteboard:' || c.id::text
      and (select auth.jwt() ->> 'room_id') = c.id::text
      and p.user_id = (select auth.uid())
      and p.left_at is null
      and c.status in ('live', 'open_floor', 'upcoming')
  )
);

drop policy if exists classroom_whiteboard_room_insert on realtime.messages;
create policy classroom_whiteboard_room_insert
on realtime.messages
for insert
to authenticated
with check (
  extension in ('broadcast', 'presence')
  and exists (
    select 1
    from public.classrooms c
    join public.classroom_participants p on p.room_id = c.id
    where (select realtime.topic()) = 'classroom:whiteboard:' || c.id::text
      and (select auth.jwt() ->> 'room_id') = c.id::text
      and p.user_id = (select auth.uid())
      and p.left_at is null
      and c.status in ('live', 'open_floor', 'upcoming')
  )
);

-- Reuse the existing idx_classroom_participants_room_user partial index.
