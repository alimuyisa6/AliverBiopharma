import { supabase, createRealtimeAccessToken } from './core.js';
import crypto from 'crypto';
import {
  parseAndValidateBody,
  requireAuth,
  requireAdmin,
  isFullyAuthorizedAdmin,
  SecurityError
} from './security-middleware.js';
import { createNotification } from './notifications.js';
import { getUserCurriculumScope } from './curriculum.js';
import { isMinorSafetyBlocked, areMutuallyUnblocked } from './trust-safety.js';

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET') {
    return handleGet(path, req, res, ctx);
  }

  if (req.method === 'POST') {
    requireAuth(ctx);

    const body = await parseAndValidateBody(req);
    return handlePost(path, body, req, res, ctx);
  }

  throw new SecurityError('Method not allowed', 405);
}

async function handleGet(path, req, res, ctx) {
  switch (path) {
    case 'levels':
      return getLevels(req, res);
    case 'topics':
      return getTopics(req, res);
    case 'list':
      return listClassrooms(req, res, ctx);
    case 'live_feed':
      return getLiveFeed(req, res, ctx);
    case 'room':
      return getRoom(req, res, ctx);
    case 'messages':
      return getMessages(req, res);
    case 'participants':
      return getParticipants(req, res);
    case 'whiteboard_config':
      requireAuth(ctx);
      return getWhiteboardConfig(req, res, ctx);
    case 'whiteboard_snapshot':
      requireAuth(ctx);
      return getWhiteboardSnapshot(req, res, ctx);
    case 'whiteboard_history':
      requireAuth(ctx);
      return getWhiteboardHistory(req, res, ctx);
    case 'whiteboard_archives':
      requireAuth(ctx);
      return getWhiteboardArchives(req, res, ctx);
    case 'tutor_status':
      requireAuth(ctx);
      return getTutorStatus(req, res, ctx);
    case 'tutor_rooms':
      requireAuth(ctx);
      return getTutorRooms(req, res, ctx);
    case 'admin_list_rooms':
      requireAdmin(ctx);
      return adminListRooms(req, res);
    case 'admin_list_applications':
      requireAdmin(ctx);
      return adminListApplications(req, res);
    case 'admin_list_complaints':
      requireAdmin(ctx);
      return adminListComplaints(req, res);
    default:
      throw new SecurityError('Invalid action', 400);
  }
}

async function handlePost(path, body, req, res, ctx) {
  switch (path) {
    case 'create':
      return createRoom(body, res, ctx);
    case 'join':
      return joinClassroom(body, res, ctx);
    case 'leave':
      return leaveClassroom(body, res, ctx);
    case 'send_message':
      return sendMessage(body, res, ctx);
    case 'raise_hand':
      return raiseHand(body, res, ctx);
    case 'tutor_apply':
      return applyAsTutor(body, res, ctx);
    case 'tutor_review':
      requireAdmin(ctx);
      return reviewTutorApplication(body, res, ctx);
    case 'toggle_mute':
      return toggleMute(body, res, ctx);
    case 'end_room':
      return endRoom(body, res, ctx);
    case 'share_resource':
      return shareResource(body, res, ctx);
    case 'file_complaint':
      return fileComplaint(body, res, ctx);
    case 'whiteboard_operation':
      return applyWhiteboardOperation(body, res, ctx);
    case 'whiteboard_archive':
      return createWhiteboardArchive(body, res, ctx);
    case 'admin_resolve_complaint':
      requireAdmin(ctx);
      return adminResolveComplaint(body, res, ctx);
    default:
      throw new SecurityError('Invalid action', 400);
  }
}

async function fetchUserNames(userIds) {
  if (!userIds.length) return {};

  const results = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const { data } = await supabase.auth.admin.getUserById(userId);

        return {
          userId,
          name: data?.user?.user_metadata?.full_name || 'User'
        };
      } catch {
        return { userId, name: 'User' };
      }
    })
  );

  const map = {};

  for (const result of results) {
    map[result.userId] = result.name;
  }

  return map;
}

async function fetchTutorAvatars(userIds) {
  if (!userIds.length) return {};

  const { data: tutors } = await supabase
    .from('tutor_profiles')
    .select('user_id, avatar_url')
    .in('user_id', userIds);

  const tutorMap = {};
  for (const tutor of tutors || []) {
    tutorMap[tutor.user_id] = tutor.avatar_url || null;
  }

  const missing = userIds.filter(id => !tutorMap[id]);
  const avatarMap = { ...tutorMap };

  if (missing.length) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, profile_picture_url')
      .in('user_id', missing);

    for (const profile of profiles || []) {
      avatarMap[profile.user_id] = profile.profile_picture_url || null;
    }
  }

  return avatarMap;
}

async function enrichRoomsWithTopicAndClass(rooms) {
  const unitIds = [...new Set(rooms.map((room) => room.unit_id).filter(Boolean))];

  if (!unitIds.length) return rooms;

  const { data: units } = await supabase
    .from('curriculum_units')
    .select('id, name, group_id, topic_image_url')
    .in('id', unitIds);

  const unitMap = {};

  for (const unit of units || []) {
    unitMap[unit.id] = unit;
  }

  const groupIds = [...new Set((units || []).map((unit) => unit.group_id).filter(Boolean))];
  const groupMap = {};

  if (groupIds.length) {
    const { data: groups } = await supabase
      .from('curriculum_groups')
      .select('id, name, level_id')
      .in('id', groupIds);

    const levelIds = [...new Set((groups || []).map((group) => group.level_id).filter(Boolean))];
    const levelMap = {};

    if (levelIds.length) {
      const { data: levels } = await supabase
        .from('curriculum_levels')
        .select('id, display_name, kind, group_label, unit_label')
        .in('id', levelIds);

      for (const level of levels || []) levelMap[level.id] = level;
    }

    for (const group of groups || []) {
      const level = levelMap[group.level_id] || {};
      const isPharmacy = /pharmacy/i.test(`${level.kind || ''} ${level.display_name || ''}`);
      groupMap[group.id] = {
        name: group.name,
        level_name: level.display_name || null,
        level_kind: level.kind || null,
        group_label: isPharmacy ? 'Program' : (level.group_label || 'Class'),
        unit_label: isPharmacy ? 'Course Unit' : (level.unit_label || 'Topic')
      };
    }
  }

  return rooms.map((room) => {
    const unit = unitMap[room.unit_id];
    const group = unit ? groupMap[unit.group_id] || {} : {};

    return {
      ...room,
      level_name: group.level_name || null,
      level_kind: group.level_kind || null,
      group_name: group.name || null,
      group_label: group.group_label || 'Class',
      unit_name: unit?.name || null,
      unit_label: group.unit_label || 'Topic',
      topic_name: unit?.name || null,
      class_name: group.name || null,
      image_url: unit?.topic_image_url || null
    };
  });
}

function deriveStatus(room) {
  const now = new Date();

  if (room.status === 'ended' || room.status === 'offline') {
    return {
      status: room.status,
      started_at: room.started_at
    };
  }

  if (room.room_type === 'free') {
    return {
      status: 'open_floor',
      started_at: room.started_at || room.created_at
    };
  }

  if (!room.scheduled_at) {
    return {
      status: 'live',
      started_at: room.started_at || room.created_at
    };
  }

  const scheduled = new Date(room.scheduled_at);

  return scheduled > now
    ? { status: 'upcoming', started_at: null }
    : { status: 'live', started_at: room.started_at || room.scheduled_at };
}

function withDuration(room) {
  const enriched = { ...room };

  if (enriched.status === 'live' || enriched.status === 'open_floor') {
    if (enriched.started_at) {
      enriched.live_duration_seconds = Math.max(
        0,
        Math.floor((Date.now() - new Date(enriched.started_at).getTime()) / 1000)
      );
    }
  } else if (enriched.status === 'upcoming' && enriched.scheduled_at) {
    enriched.starts_in_seconds = Math.max(
      0,
      Math.floor((new Date(enriched.scheduled_at).getTime() - Date.now()) / 1000)
    );
  }

  return enriched;
}

async function getLevels(req, res) {
  const [{ data: levels, error: levelsError }, { data: groups, error: groupsError }] = await Promise.all([
    supabase
      .from('curriculum_levels')
      .select('id, display_name, kind, group_label, unit_label, icon, color')
      .order('display_order'),
    supabase
      .from('curriculum_groups')
      .select('id, level_id, name, description, icon')
      .eq('is_active', true)
      .order('sequence_order')
  ]);

  if (levelsError || groupsError) {
    throw new SecurityError('Unable to load curriculum levels', 500);
  }

  const groupsByLevel = new Map();
  for (const group of groups || []) {
    const levelGroups = groupsByLevel.get(group.level_id) || [];
    levelGroups.push(group);
    groupsByLevel.set(group.level_id, levelGroups);
  }

  const result = (levels || []).map((level) => {
    const isPharmacy = /pharmacy/i.test(`${level.kind || ''} ${level.display_name || ''}`);

    return {
      key: level.id,
      display_name: level.display_name,
      kind: level.kind,
      group_label: isPharmacy ? 'Program' : (level.group_label || 'Class'),
      unit_label: isPharmacy ? 'Course Unit' : (level.unit_label || 'Topic'),
      icon: level.icon,
      classes: (groupsByLevel.get(level.id) || []).map((group) => ({
        id: group.id,
        name: group.name,
        description: group.description,
        icon: group.icon
      }))
    };
  });

  return res.status(200).json(result);
}

async function getTopics(req, res) {
  const { group_id, level: levelId } = req.query;

  if (!group_id && !levelId) {
    throw new SecurityError('group_id or level required', 400);
  }

  let groupIds = [];

  if (group_id) {
    groupIds = [group_id];
  } else {
    const { data: groups } = await supabase
      .from('curriculum_groups')
      .select('id')
      .eq('level_id', levelId)
      .eq('is_active', true);

    groupIds = (groups || []).map((group) => group.id);

    if (!groupIds.length) return res.status(200).json([]);
  }

  const [{ data }, { data: group }] = await Promise.all([
    supabase
      .from('curriculum_units')
      .select('id, name, code, icon, is_hard_topic, display_order')
      .in('group_id', groupIds)
      .eq('is_active', true)
      .order('display_order'),
    supabase
      .from('curriculum_groups')
      .select('level_id')
      .eq('id', groupIds[0])
      .maybeSingle()
  ]);

  let level = null;
  if (group?.level_id) {
    const { data: levelData } = await supabase
      .from('curriculum_levels')
      .select('display_name, kind, group_label, unit_label')
      .eq('id', group.level_id)
      .maybeSingle();
    level = levelData;
  }

  const isPharmacy = /pharmacy/i.test(`${level?.kind || ''} ${level?.display_name || ''}`);
  const unitLabel = isPharmacy ? 'Course Unit' : (level?.unit_label || 'Topic');

  return res.status(200).json(
    (data || []).map((unit) => ({
      id: unit.id,
      name: unit.name,
      unit_name: unit.name,
      topic_name: unit.name,
      unit_label: unitLabel,
      unit_code: unit.code,
      icon: unit.icon,
      is_hard_topic: unit.is_hard_topic
    }))
  );
}

async function getLearnerAllowedUnitIds(ctx) {
  const scope = await getUserCurriculumScope(ctx.userId);
  if (!scope?.active_group_id) return [];

  const { data: units, error } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true);

  if (error) throw new SecurityError('Unable to resolve your classroom curriculum', 500);
  return (units || []).map((unit) => unit.id);
}

async function assertRoomInLearnerScope(room, ctx) {
  if (ctx.adminData) return;

  const allowedUnitIds = await getLearnerAllowedUnitIds(ctx);
  if (!room?.unit_id || !allowedUnitIds.includes(room.unit_id)) {
    throw new SecurityError('Classroom not available in your curriculum', 403);
  }
}

async function listClassrooms(req, res, ctx) {
  const { unit_id, group_id } = req.query;

  if (!unit_id && !group_id) {
    throw new SecurityError('unit_id or group_id required', 400);
  }

  let unitIds = [];
  const allowedUnitIds = ctx.adminData ? null : await getLearnerAllowedUnitIds(ctx);

  if (!allowedUnitIds?.length && !ctx.adminData) return res.status(200).json([]);

  if (group_id) {
    if (!ctx.adminData) {
      const scope = await getUserCurriculumScope(ctx.userId);
      if (!scope?.active_group_id || scope.active_group_id !== group_id) {
        return res.status(200).json([]);
      }
    }

    const { data: units } = await supabase
      .from('curriculum_units')
      .select('id')
      .eq('group_id', group_id)
      .eq('is_active', true);

    unitIds = (units || []).map((unit) => unit.id);
    if (!ctx.adminData) unitIds = unitIds.filter((id) => allowedUnitIds.includes(id));
    if (!unitIds.length) return res.status(200).json([]);
  } else if (unit_id) {
    if (!ctx.adminData && !allowedUnitIds.includes(unit_id)) return res.status(200).json([]);
    unitIds = [unit_id];
  }

  const { data } = await supabase
    .from('classrooms')
    .select('*')
    .in('unit_id', unitIds)
    .not('status', 'in', '("ended","offline")')
    .order('created_at', { ascending: false });

  const reconciled = [];

  for (const room of data || []) {
    if (room.tutor_id) {
      const { data: application } = await supabase
        .from('tutor_applications')
        .select('status')
        .eq('user_id', room.tutor_id)
        .eq('status', 'approved')
        .maybeSingle();

      if (!application) continue;
    }

    const derived = deriveStatus(room);

    if (derived.status !== room.status) {
      await supabase.from('classrooms').update(derived).eq('id', room.id);
      room.status = derived.status;
      room.started_at = derived.started_at;
    }

    reconciled.push(withDuration(room));
  }

  const tutorIds = [...new Set(reconciled.map((room) => room.tutor_id).filter(Boolean))];
  const tutorNames = {};

  if (tutorIds.length) {
    const { data: applications } = await supabase
      .from('tutor_applications')
      .select('user_id, display_name')
      .in('user_id', tutorIds)
      .eq('status', 'approved');

    for (const application of applications || []) {
      tutorNames[application.user_id] = application.display_name || null;
    }
  }

  const enriched = await enrichRoomsWithTopicAndClass(reconciled);

  const avatarMap = await fetchTutorAvatars(tutorIds);

  return res.status(200).json(
    enriched.map((room) => ({
      ...room,
      tutor_name: tutorNames[room.tutor_id] || null,
      tutor_avatar_url: avatarMap[room.tutor_id] || null
    }))
  );
}

async function getLiveFeed(req, res, ctx) {
  let unitIds = [];

  if (ctx.authenticated) {
    const scope = await getUserCurriculumScope(ctx.userId);
    if (!scope?.active_group_id) return res.status(200).json([]);

    const { data: units, error } = await supabase
      .from('curriculum_units')
      .select('id')
      .eq('group_id', scope.active_group_id)
      .eq('is_active', true);

    if (error) throw new SecurityError('Unable to resolve your classroom curriculum', 500);
    unitIds = (units || []).map((unit) => unit.id);
    if (!unitIds.length) return res.status(200).json([]);
  }

  let query = supabase
    .from('classrooms')
    .select('*')
    .in('status', ['live', 'open_floor', 'upcoming'])
    .order('created_at', { ascending: false })
    .limit(12);

  if (unitIds.length) {
    query = query.in('unit_id', unitIds);
  }

  const { data } = await query;

  const reconciled = [];

  for (const room of data || []) {
    const derived = deriveStatus(room);

    if (derived.status !== room.status) {
      await supabase.from('classrooms').update(derived).eq('id', room.id);
      room.status = derived.status;
      room.started_at = derived.started_at;
    }

    reconciled.push(withDuration(room));
  }

  const enriched = await enrichRoomsWithTopicAndClass(reconciled);

  const tutorIds = [...new Set(enriched.map((room) => room.tutor_id).filter(Boolean))];
  const avatarMap = await fetchTutorAvatars(tutorIds);

  return res.status(200).json(
    enriched.map((room) => ({
      ...room,
      tutor_avatar_url: avatarMap[room.tutor_id] || null
    }))
  );
}

async function getRoom(req, res, ctx) {
  const { room_id } = req.query;

  if (!room_id) throw new SecurityError('room_id required', 400);

  const { data: room } = await supabase
    .from('classrooms')
    .select('*')
    .eq('id', room_id)
    .maybeSingle();

  if (!room) throw new SecurityError('Room not found', 404);

  await assertRoomInLearnerScope(room, ctx);

  const derived = deriveStatus(room);

  if (derived.status !== room.status) {
    await supabase.from('classrooms').update(derived).eq('id', room.id);
    room.status = derived.status;
    room.started_at = derived.started_at;
  }

  const [enriched] = await enrichRoomsWithTopicAndClass([withDuration(room)]);

  let tutor_avatar_url = null;
  if (enriched.tutor_id) {
    const avatarMap = await fetchTutorAvatars([enriched.tutor_id]);
    tutor_avatar_url = avatarMap[enriched.tutor_id] || null;
  }

  return res.status(200).json({
    ...enriched,
    tutor_avatar_url
  });
}

async function getMessages(req, res, ctx) {
  const { room_id } = req.query;

  if (!room_id) throw new SecurityError('room_id required', 400);

  const { data: room } = await supabase
    .from('classrooms')
    .select('unit_id')
    .eq('id', room_id)
    .maybeSingle();
  if (!room) throw new SecurityError('Room not found', 404);
  await assertRoomInLearnerScope(room, ctx);

  const { data } = await supabase
    .from('classroom_messages')
    .select('*')
    .eq('room_id', room_id)
    .order('created_at', { ascending: true })
    .limit(100);

  const userIds = [...new Set((data || []).map((message) => message.user_id))];
  const nameMap = await fetchUserNames(userIds);

  return res.status(200).json(
    (data || []).map((message) => ({
      ...message,
      sender_name: nameMap[message.user_id] || 'User'
    }))
  );
}

async function getParticipants(req, res, ctx) {
  const { room_id } = req.query;

  if (!room_id) throw new SecurityError('room_id required', 400);

  const { data: room } = await supabase
    .from('classrooms')
    .select('unit_id')
    .eq('id', room_id)
    .maybeSingle();
  if (!room) throw new SecurityError('Room not found', 404);
  await assertRoomInLearnerScope(room, ctx);

  const { data } = await supabase
    .from('classroom_participants')
    .select('*')
    .eq('room_id', room_id)
    .is('left_at', null);

  return res.status(200).json(data || []);
}

const WHITEBOARD_MAX_STROKES = 500;
const WHITEBOARD_MAX_POINTS = 250;

async function getWhiteboardParticipant(roomId, ctx) {
  if (!roomId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(roomId)) {
    throw new SecurityError('A valid classroom is required', 400);
  }

  const [{ data: room }, { data: participant }] = await Promise.all([
    supabase.from('classrooms').select('id, unit_id, status, tutor_id').eq('id', roomId).maybeSingle(),
    supabase.from('classroom_participants')
      .select('id, role')
      .eq('room_id', roomId)
      .eq('user_id', ctx.userId)
      .is('left_at', null)
      .maybeSingle()
  ]);

  if (!room || !participant || !['live', 'open_floor', 'upcoming'].includes(room.status)) {
    throw new SecurityError('You must be an active participant to access this whiteboard', 403);
  }

  const isRoomTutor = room.tutor_id === ctx.userId && participant.role === 'tutor';
  if (!isRoomTutor && !isFullyAuthorizedAdmin(ctx)) {
    if (participant.role === 'tutor') throw new SecurityError('Tutor access is not valid for this classroom', 403);
    await assertRoomInLearnerScope(room, ctx);
  }

  return { room, participant };
}

function normalizeWhiteboardStroke(input, userId) {
  const allowedTools = new Set(['pen', 'highlighter', 'eraser', 'line', 'rectangle', 'ellipse']);
  if (!input || typeof input !== 'object' || !allowedTools.has(input.tool)) {
    throw new SecurityError('Invalid whiteboard drawing operation', 400);
  }
  if (!Array.isArray(input.points) || input.points.length < 2 || input.points.length > WHITEBOARD_MAX_POINTS) {
    throw new SecurityError('A stroke must contain between 2 and 250 points', 400);
  }

  const points = input.points.map((point) => {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 1000 || y < 0 || y > 600) {
      throw new SecurityError('Invalid whiteboard coordinates', 400);
    }
    return { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 };
  });
  const color = input.tool === 'eraser' ? '#ffffff' : String(input.color || '#163b68');
  if (!/^#[0-9a-f]{6}$/i.test(color)) throw new SecurityError('Invalid whiteboard color', 400);

  return {
    id: crypto.randomUUID(),
    user_id: userId,
    tool: input.tool,
    color,
    width: Math.max(1, Math.min(28, Number(input.width) || 3)),
    points,
    created_at: new Date().toISOString()
  };
}

async function readWhiteboardSnapshot(roomId) {
  const { data, error } = await supabase
    .from('classroom_whiteboard_snapshots')
    .select('room_id, revision, document, updated_at, updated_by')
    .eq('room_id', roomId)
    .maybeSingle();
  if (error) throw new SecurityError('Unable to load the classroom whiteboard', 500);
  return data || { room_id: roomId, revision: 0, document: { strokes: [] }, updated_at: null, updated_by: null };
}

async function getWhiteboardConfig(req, res, ctx) {
  const roomId = req.query.room_id;
  await getWhiteboardParticipant(roomId, ctx);
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_JWT_SECRET) {
    throw new SecurityError('Collaborative whiteboard authentication is not configured', 503);
  }

  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.status(200).json({
    url: process.env.SUPABASE_URL,
    publishable_key: process.env.SUPABASE_ANON_KEY,
    access_token: createRealtimeAccessToken(ctx.userId, 240, roomId),
    token_expires_in: 240,
    topic: `classroom:whiteboard:${roomId}`
  });
}

async function getWhiteboardSnapshot(req, res, ctx) {
  const roomId = req.query.room_id;
  await getWhiteboardParticipant(roomId, ctx);
  const snapshot = await readWhiteboardSnapshot(roomId);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  return res.status(200).json({ room_id: snapshot.room_id, revision: snapshot.revision, document: snapshot.document, updated_at: snapshot.updated_at });
}

async function getWhiteboardHistory(req, res, ctx) {
  const roomId = req.query.room_id;
  await getWhiteboardParticipant(roomId, ctx);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const { data, error } = await supabase
    .from('classroom_whiteboard_events')
    .select('revision, actor_id, operation, created_at')
    .eq('room_id', roomId)
    .order('revision', { ascending: false })
    .limit(25);
  if (error) throw new SecurityError('Unable to load whiteboard activity', 500);
  const names = await fetchUserNames([...new Set((data || []).map((event) => event.actor_id).filter(Boolean))]);
  return res.status(200).json((data || []).map((event) => ({
    revision: event.revision,
    actor_name: names[event.actor_id] || 'Participant',
    created_at: event.created_at,
    operation: {
      type: event.operation?.type || 'update',
      stroke: event.operation?.stroke ? { tool: event.operation.stroke.tool } : undefined
    }
  })));
}

async function getWhiteboardArchives(req, res, ctx) {
  const roomId = req.query.room_id;
  await getWhiteboardParticipant(roomId, ctx);
  res.setHeader('Cache-Control', 'private, no-store, max-age=0');
  const { data, error } = await supabase
    .from('classroom_whiteboard_archives')
    .select('id, title, revision, created_by, created_at')
    .eq('room_id', roomId)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new SecurityError('Unable to load saved board snapshots', 500);
  const names = await fetchUserNames([...new Set((data || []).map((archive) => archive.created_by).filter(Boolean))]);
  return res.status(200).json((data || []).map((archive) => ({
    id: archive.id,
    title: archive.title,
    revision: archive.revision,
    created_at: archive.created_at,
    created_by_name: names[archive.created_by] || 'Tutor'
  })));
}

async function createWhiteboardArchive(body, res, ctx) {
  const { room_id, title } = body;
  const { room, participant } = await getWhiteboardParticipant(room_id, ctx);
  if (participant.role !== 'tutor' && room.tutor_id !== ctx.userId && !isFullyAuthorizedAdmin(ctx)) {
    throw new SecurityError('Only the tutor can save a named whiteboard snapshot', 403);
  }

  const cleanTitle = String(title || '').trim().slice(0, 80);
  if (!cleanTitle) throw new SecurityError('Enter a name for this snapshot', 400);
  const current = await readWhiteboardSnapshot(room_id);
  const { data, error } = await supabase
    .from('classroom_whiteboard_archives')
    .insert({
      room_id,
      title: cleanTitle,
      revision: current.revision,
      document: current.document,
      created_by: ctx.userId
    })
    .select('id, title, revision, created_by, created_at')
    .single();
  if (error) throw new SecurityError('Unable to save this whiteboard snapshot', 500);

  await supabase.from('classroom_whiteboard_archives')
    .delete()
    .eq('room_id', room_id)
    .lt('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString());

  return res.status(200).json(data);
}

async function applyWhiteboardOperation(body, res, ctx) {
  const { room_id, operation } = body;
  const { room, participant } = await getWhiteboardParticipant(room_id, ctx);
  if (!operation || !['add', 'undo', 'clear', 'restore'].includes(operation.type)) {
    throw new SecurityError('Unsupported whiteboard operation', 400);
  }
  const isTutor = participant.role === 'tutor' && room.tutor_id === ctx.userId;
  if (['clear', 'restore'].includes(operation.type) && !isTutor && !isFullyAuthorizedAdmin(ctx)) {
    throw new SecurityError('Only the tutor can perform this whiteboard action', 403);
  }

  const stroke = operation.type === 'add' ? normalizeWhiteboardStroke(operation.stroke, ctx.userId) : null;
  let archivedDocument = null;
  if (operation.type === 'restore') {
    if (!operation.archive_id) throw new SecurityError('Choose a saved snapshot to restore', 400);
    const { data: archive, error } = await supabase
      .from('classroom_whiteboard_archives')
      .select('document')
      .eq('id', operation.archive_id)
      .eq('room_id', room_id)
      .maybeSingle();
    if (error || !archive) throw new SecurityError('Saved snapshot not found', 404);
    archivedDocument = archive.document;
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    const current = await readWhiteboardSnapshot(room_id);
    const strokes = Array.isArray(current.document?.strokes) ? current.document.strokes : [];
    let nextStrokes = strokes;
    let event;
    let persistedEvent;

    if (operation.type === 'add') {
      if (strokes.length >= WHITEBOARD_MAX_STROKES) {
        throw new SecurityError('This board has reached its drawing limit. Clear or undo older work to continue.', 409);
      }
      nextStrokes = [...strokes, stroke];
      event = { type: 'add', stroke };
      persistedEvent = event;
    } else if (operation.type === 'undo') {
      let index = -1;
      for (let i = strokes.length - 1; i >= 0; i -= 1) {
        if (strokes[i]?.user_id === ctx.userId) { index = i; break; }
      }
      if (index === -1) return res.status(200).json({ ...current, operation: null });
      const removed = strokes[index];
      nextStrokes = strokes.filter((_, i) => i !== index);
      event = { type: 'remove', stroke_id: removed.id };
      persistedEvent = { ...event, stroke: removed };
    } else if (operation.type === 'clear') {
      nextStrokes = [];
      event = { type: 'clear' };
      persistedEvent = event;
    } else {
      nextStrokes = Array.isArray(archivedDocument?.strokes) ? archivedDocument.strokes : [];
      if (nextStrokes.length > WHITEBOARD_MAX_STROKES) {
        throw new SecurityError('This saved snapshot exceeds the current board limit', 409);
      }
      event = { type: 'restore', archive_id: operation.archive_id };
      persistedEvent = event;
    }

    const nextDocument = { strokes: nextStrokes };
    if (JSON.stringify(nextDocument).length > 900_000) {
      throw new SecurityError('The board is full. Clear or undo older drawings before adding more.', 409);
    }

    const { data: nextRevision, error } = await supabase.rpc('apply_classroom_whiteboard_revision', {
      p_room_id: room_id,
      p_expected_revision: Number(current.revision || 0),
      p_document: nextDocument,
      p_user_id: ctx.userId,
      p_operation: persistedEvent
    });
    if (error) throw new SecurityError('Unable to save whiteboard changes', 500);
    if (nextRevision === null) continue;

    const saved = await readWhiteboardSnapshot(room_id);
    return res.status(200).json({
      room_id: saved.room_id,
      revision: saved.revision,
      document: saved.document,
      updated_at: saved.updated_at,
      operation: { ...event, revision: nextRevision, actor_id: ctx.userId }
    });
  }

  throw new SecurityError('Another participant is editing the board. Please retry your action.', 409);
}


async function getTutorStatus(req, res, ctx) {
  const { data } = await supabase
    .from('tutor_applications')
    .select('*')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return res.status(200).json({ application: data || null });
}

async function getTutorRooms(req, res, ctx) {
  const { data } = await supabase
    .from('classrooms')
    .select('*')
    .eq('tutor_id', ctx.userId)
    .not('status', 'in', '("ended","offline")')
    .order('created_at', { ascending: false });

  const enriched = await enrichRoomsWithTopicAndClass(data || []);

  return res.status(200).json({ rooms: enriched });
}

async function createRoom(body, res, ctx) {
  const { title, unit_id, room_type, scheduled_at } = body;

  if (!title || !unit_id || !room_type) {
    throw new SecurityError('title, unit_id, room_type required', 400);
  }

  if (!['free', 'hard_topic', 'premium'].includes(room_type)) {
    throw new SecurityError('Invalid room_type', 400);
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('is_approved_teacher, approved_track, track, class_name')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!profile?.is_approved_teacher && !isFullyAuthorizedAdmin(ctx)) {
    throw new SecurityError('Only approved tutors and admins can create rooms', 403);
  }

  const { data: unit, error: unitError } = await supabase
    .from('curriculum_units')
    .select('id, group_id')
    .eq('id', unit_id)
    .eq('is_active', true)
    .maybeSingle();

  if (unitError || !unit) throw new SecurityError('Choose an active curriculum topic or course unit', 400);

  const { data: group, error: groupError } = await supabase
    .from('curriculum_groups')
    .select('id, name, level_id')
    .eq('id', unit.group_id)
    .eq('is_active', true)
    .maybeSingle();

  if (groupError || !group) throw new SecurityError('The selected curriculum group is unavailable', 400);

  const { data: curriculumLevel, error: levelError } = await supabase
    .from('curriculum_levels')
    .select('id, display_name')
    .eq('id', group.level_id)
    .maybeSingle();

  if (levelError || !curriculumLevel) throw new SecurityError('The selected learning level is unavailable', 400);

  if (!isFullyAuthorizedAdmin(ctx)) {
    const normalizeScope = (value) => String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const approvedLevel = profile.approved_track || profile.track;

    if (normalizeScope(approvedLevel) !== 'all' &&
        normalizeScope(approvedLevel) !== normalizeScope(curriculumLevel.display_name)) {
      throw new SecurityError('This curriculum is outside your approved tutoring level', 403);
    }

    if (profile.class_name && normalizeScope(profile.class_name) !== normalizeScope(group.name)) {
      throw new SecurityError('This class or program is outside your approved tutoring scope', 403);
    }
  }

  const status = room_type === 'free'
    ? 'open_floor'
    : new Date(scheduled_at) > new Date()
      ? 'upcoming'
      : 'live';

  const startedAt = status === 'live' || status === 'open_floor'
    ? new Date().toISOString()
    : null;

  const { data, error } = await supabase
    .from('classrooms')
    .insert({
      title,
      unit_id,
      room_type,
      tutor_id: ctx.userId,
      status,
      scheduled_at: scheduled_at || null,
      started_at: startedAt,
      participant_count: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new SecurityError('Failed to create room', 500);

  await supabase.from('classroom_participants').insert({
    room_id: data.id,
    user_id: ctx.userId,
    role: 'tutor',
    is_muted: false
  });

  const [enriched] = await enrichRoomsWithTopicAndClass([data]);

  return res.status(200).json(enriched);
}

async function joinClassroom(body, res, ctx) {
  const { room_id } = body;

  if (!room_id) throw new SecurityError('room_id required', 400);

  if (await isMinorSafetyBlocked(ctx.userId)) {
    throw new SecurityError('Parental consent is required before joining a live classroom', 403);
  }

  const { data: room } = await supabase
    .from('classrooms')
    .select('id, unit_id, tutor_id, status, participant_count, max_participants')
    .eq('id', room_id)
    .maybeSingle();

  if (!room) throw new SecurityError('Room not found', 404);
  if (room.status === 'ended' || room.status === 'offline') throw new SecurityError('Room not active', 400);
  if (room.participant_count >= room.max_participants) throw new SecurityError('Room full', 400);

  await assertRoomInLearnerScope(room, ctx);

  if (room.tutor_id && room.tutor_id !== ctx.userId) {
    const clear = await areMutuallyUnblocked(ctx.userId, room.tutor_id);

    if (!clear) throw new SecurityError('You cannot join this classroom', 403);
  }

  const { data: existing } = await supabase
    .from('classroom_participants')
    .select('id, left_at')
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (existing && !existing.left_at) {
    return res.status(200).json({ success: true, already_joined: true });
  }

  if (existing) {
    await supabase
      .from('classroom_participants')
      .update({
        left_at: null,
        is_muted: true,
        hand_raised: false
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('classroom_participants').insert({
      room_id,
      user_id: ctx.userId,
      role: 'learner',
      is_muted: true
    });
  }

  await supabase
    .from('classrooms')
    .update({ participant_count: room.participant_count + 1 })
    .eq('id', room_id);

  await supabase.from('classroom_messages').insert({
    room_id,
    user_id: ctx.userId,
    content: 'joined the classroom',
    message_type: 'system'
  });

  return res.status(200).json({ success: true });
}

async function leaveClassroom(body, res, ctx) {
  const { room_id } = body;

  if (!room_id) throw new SecurityError('room_id required', 400);

  const { data: departed, error: leaveError } = await supabase
    .from('classroom_participants')
    .update({
      left_at: new Date().toISOString(),
      hand_raised: false
    })
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .is('left_at', null)
    .select('id');

  if (leaveError) throw new SecurityError('Unable to leave this classroom', 500);
  if (!departed?.length) return res.status(200).json({ success: true, already_left: true });

  const { data: room } = await supabase
    .from('classrooms')
    .select('participant_count')
    .eq('id', room_id)
    .maybeSingle();

  if (room) {
    await supabase
      .from('classrooms')
      .update({
        participant_count: Math.max(0, (room.participant_count || 1) - 1)
      })
      .eq('id', room_id);
  }

  await supabase.from('classroom_messages').insert({
    room_id,
    user_id: ctx.userId,
    content: 'left the classroom',
    message_type: 'system'
  });

  return res.status(200).json({ success: true });
}

const MAX_MESSAGE_LENGTH = 2000;

async function sendMessage(body, res, ctx) {
  const { room_id, message } = body;

  if (!room_id || !message?.trim()) {
    throw new SecurityError('room_id and message required', 400);
  }

  const trimmed = message.trim();

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    throw new SecurityError(`Message too long (max ${MAX_MESSAGE_LENGTH} characters)`, 400);
  }

  const { data: participant } = await supabase
    .from('classroom_participants')
    .select('id')
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .is('left_at', null)
    .maybeSingle();

  if (!participant) throw new SecurityError('You must join the room first', 403);

  await supabase.from('classroom_messages').insert({
    room_id,
    user_id: ctx.userId,
    content: trimmed,
    message_type: 'chat'
  });

  return res.status(200).json({ success: true });
}

async function raiseHand(body, res, ctx) {
  const { room_id, raise } = body;

  if (!room_id) throw new SecurityError('room_id required', 400);

  await supabase
    .from('classroom_participants')
    .update({
      hand_raised: !!raise,
      hand_raised_at: raise ? new Date().toISOString() : null
    })
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .is('left_at', null);

  return res.status(200).json({ success: true });
}

async function toggleMute(body, res, ctx) {
  const { room_id, target_user_id, mute } = body;

  if (!room_id || !target_user_id || typeof mute !== 'boolean') {
    throw new SecurityError('room_id, target_user_id and boolean mute are required', 400);
  }

  if (target_user_id !== ctx.userId) {
    throw new SecurityError('You can only change your own microphone state', 403);
  }

  const { data: participant } = await supabase
    .from('classroom_participants')
    .select('id')
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .is('left_at', null)
    .maybeSingle();

  if (!participant) throw new SecurityError('You must join the room first', 403);

  const { error } = await supabase
    .from('classroom_participants')
    .update({ is_muted: mute })
    .eq('id', participant.id)
    .is('left_at', null);

  if (error) throw new SecurityError('Unable to update microphone status', 500);

  return res.status(200).json({ success: true, is_muted: mute });
}

async function endRoom(body, res, ctx) {
  const { room_id } = body;

  if (!room_id) throw new SecurityError('room_id required', 400);

  const { data: room } = await supabase
    .from('classrooms')
    .select('tutor_id')
    .eq('id', room_id)
    .maybeSingle();

  if (!room) throw new SecurityError('Room not found', 404);
  if (room.tutor_id !== ctx.userId && !isFullyAuthorizedAdmin(ctx)) {
    throw new SecurityError('Only the tutor or admin can end the room', 403);
  }

  await supabase
    .from('classrooms')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString()
    })
    .eq('id', room_id);

  await supabase
    .from('classroom_participants')
    .update({
      left_at: new Date().toISOString(),
      hand_raised: false
    })
    .eq('room_id', room_id)
    .is('left_at', null);

  await supabase.from('classroom_messages').insert({
    room_id,
    user_id: ctx.userId,
    content: 'The session has ended',
    message_type: 'system'
  });

  return res.status(200).json({ success: true });
}

async function shareResource(body, res, ctx) {
  const { room_id, file_id } = body;

  if (!room_id || !file_id) {
    throw new SecurityError('room_id and file_id required', 400);
  }

  const { data: participant } = await supabase
    .from('classroom_participants')
    .select('role')
    .eq('room_id', room_id)
    .eq('user_id', ctx.userId)
    .is('left_at', null)
    .maybeSingle();

  if (!participant || (participant.role !== 'tutor' && participant.role !== 'admin')) {
    throw new SecurityError('Only tutors can share', 403);
  }

  const { data: file } = await supabase
    .from('user_files')
    .select('id, file_url, file_name, file_size')
    .eq('id', file_id)
    .eq('user_id', ctx.userId)
    .eq('is_active', true)
    .maybeSingle();

  if (!file) throw new SecurityError('File not found', 404);

  await supabase.from('classroom_messages').insert({
    room_id,
    user_id: ctx.userId,
    content: `Shared: ${file.file_name}`,
    message_type: 'resource',
    file_url: file.file_url,
    file_name: file.file_name,
    file_size: file.file_size
  });

  return res.status(200).json({ success: true });
}

async function fileComplaint(body, res, ctx) {
  const { room_id, complaint_type, description } = body;

  if (!complaint_type || !description) {
    throw new SecurityError('complaint_type and description required', 400);
  }

  await supabase.from('classroom_complaints').insert({
    user_id: ctx.userId,
    room_id: room_id || null,
    complaint_type,
    description,
    status: 'pending'
  });

  return res.status(200).json({ success: true });
}

async function applyAsTutor(body, res, ctx) {
  const { level, class_name, subjects, qualifications, experience } = body;

  if (!level || !class_name || !subjects?.length) {
    throw new SecurityError('level, class_name, and subjects required', 400);
  }

  const { data: curriculumLevel } = await supabase
    .from('curriculum_levels')
    .select('id, display_name')
    .eq('display_name', level)
    .maybeSingle();

  if (!curriculumLevel) throw new SecurityError('Invalid curriculum level', 400);

  const { data: group } = await supabase
    .from('curriculum_groups')
    .select('id, name')
    .eq('level_id', curriculumLevel.id)
    .eq('name', class_name)
    .eq('is_active', true)
    .maybeSingle();

  if (!group) throw new SecurityError('Invalid class/programme for the selected level', 400);

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('track')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (profile?.track && profile.track !== curriculumLevel.display_name) {
    throw new SecurityError('Submitted level does not match your account level', 400);
  }

  const { data: existing } = await supabase
    .from('tutor_applications')
    .select('id')
    .eq('user_id', ctx.userId)
    .in('status', ['pending', 'scheduled', 'interviewed'])
    .maybeSingle();

  if (existing) throw new SecurityError('You already have a pending application', 400);

  await supabase.from('user_profiles').upsert({
    user_id: ctx.userId,
    role: 'teacher',
    track: curriculumLevel.display_name,
    class_name: group.name,
    is_approved_teacher: false,
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id' });

  await supabase.from('tutor_applications').insert({
    user_id: ctx.userId,
    level: curriculumLevel.display_name,
    class_name: group.name,
    subjects,
    qualifications,
    experience,
    status: 'pending'
  });

  return res.status(200).json({ success: true });
}

async function reviewTutorApplication(body, res, ctx) {
  const { application_id, action, ...extra } = body;

  if (!application_id || !action) {
    throw new SecurityError('application_id and action required', 400);
  }

  const { data: application } = await supabase
    .from('tutor_applications')
    .select('user_id, level')
    .eq('id', application_id)
    .maybeSingle();

  if (!application) throw new SecurityError('Application not found', 404);

  if (action === 'approve') {
    await supabase
      .from('tutor_applications')
      .update({
        status: 'approved',
        is_approved: true,
        approved_by: ctx.userId,
        approved_at: new Date().toISOString(),
        display_name: extra.display_name,
        hourly_rate: extra.hourly_rate
      })
      .eq('id', application_id);

    await supabase
      .from('user_profiles')
      .update({
        is_approved_teacher: true,
        approved_track: extra.approved_track || application.level,
        approved_by: ctx.userId,
        approved_at: new Date().toISOString()
      })
      .eq('user_id', application.user_id);
  } else if (action === 'reject') {
    await supabase
      .from('tutor_applications')
      .update({
        status: 'rejected',
        is_approved: false,
        rejection_reason: extra.rejection_reason
      })
      .eq('id', application_id);

    await supabase
      .from('user_profiles')
      .update({
        is_approved_teacher: false,
        approval_notes: extra.rejection_reason || 'Rejected'
      })
      .eq('user_id', application.user_id);
  } else {
    const updates = {
      admin_id: ctx.userId
    };

    if (action === 'schedule') {
      updates.status = 'scheduled';
      updates.interview_scheduled_at = extra.interview_scheduled_at;
    } else if (action === 'mark_interviewed') {
      updates.status = 'interviewed';
    }

    await supabase
      .from('tutor_applications')
      .update(updates)
      .eq('id', application_id);
  }

  await createNotification(application.user_id, 'tutor_application_update', {
    status: action
  });

  return res.status(200).json({ success: true });
}

async function adminListRooms(req, res) {
  const { status } = req.query;

  let query = supabase
    .from('classrooms')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data } = await query;

  return res.status(200).json(await enrichRoomsWithTopicAndClass(data || []));
}

async function adminListApplications(req, res) {
  const { status } = req.query;

  let query = supabase
    .from('tutor_applications')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data } = await query;

  return res.status(200).json(data || []);
}

async function adminListComplaints(req, res) {
  const { status } = req.query;

  let query = supabase
    .from('classroom_complaints')
    .select('*')
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);

  const { data } = await query;

  return res.status(200).json(data || []);
}

async function adminResolveComplaint(body, res, ctx) {
  const { complaint_id, status, resolution } = body;

  if (!complaint_id || !status) {
    throw new SecurityError('complaint_id and status required', 400);
  }

  await supabase
    .from('classroom_complaints')
    .update({
      status,
      resolution,
      admin_id: ctx.userId,
      resolved_at: new Date().toISOString()
    })
    .eq('id', complaint_id);

  return res.status(200).json({ success: true });
}
