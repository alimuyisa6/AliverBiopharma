import { supabase } from './core.js';
import { parseAndValidateBody, requireAuth, SecurityError } from './security-middleware.js';
import { getUserCurriculumScope } from './curriculum.js';
import { requireActionAccess } from './authorization.js';

const MAX_QUESTION_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 4000;

export async function handler(req, res, path, ctx) {
  requireAuth(ctx);

  if (req.method === 'GET') {
    if (path !== 'thread') throw new SecurityError('Invalid note learning action', 400);
    return getThread(req, res, ctx);
  }

  if (req.method !== 'POST') throw new SecurityError('Method not allowed', 405);

  const body = await parseAndValidateBody(req);
  if (path === 'create_thread') return createThread(body, res, ctx);
  if (path === 'save_exchange') return saveExchange(body, res, ctx);

  throw new SecurityError('Invalid note learning action', 400);
}

async function getAccessibleNote(ctx, noteId) {
  if (!noteId) throw new SecurityError('note_id required', 400);

  const { data: note, error } = await supabase
    .from('notes')
    .select('id, title, unit_id, is_active, is_premium')
    .eq('id', noteId)
    .maybeSingle();

  if (error || !note || !note.is_active) throw new SecurityError('Note not found', 404);

  const scope = await getUserCurriculumScope(ctx.userId);
  if (!scope?.active_group_id) throw new SecurityError('No active curriculum group', 403);

  const { data: units, error: unitsError } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true);

  if (unitsError) throw new SecurityError('Unable to verify curriculum access', 500);
  if (!(units || []).some((unit) => unit.id === note.unit_id)) {
    throw new SecurityError('Note not available in your curriculum', 403);
  }

  await requireActionAccess(ctx, {
    actionKey: 'note_view',
    contentType: 'note',
    contentId: note.id,
    requiresPremium: note.is_premium === true,
    restrictionType: 'view'
  });

  return note;
}

async function createThread(body, res, ctx) {
  const noteId = String(body?.note_id || '').trim();
  const question = String(body?.question || '').trim();

  if (question.length < 3 || question.length > MAX_QUESTION_LENGTH) {
    throw new SecurityError('Enter a question between 3 and 4000 characters', 400);
  }

  const note = await getAccessibleNote(ctx, noteId);
  const { data: progress, error: progressError } = await supabase
    .from('reading_progress')
    .select('completed, scroll_percentage, time_spent_seconds')
    .eq('user_id', ctx.userId)
    .eq('note_id', noteId)
    .maybeSingle();

  if (progressError) throw new SecurityError('Unable to verify note completion', 500);
  if (
    progress?.completed !== true
    || Number(progress.scroll_percentage) < 90
    || Number(progress.time_spent_seconds) < 30
  ) {
    throw new SecurityError('Finish reading this note before opening an explanation thread', 409);
  }

  const { data, error } = await supabase
    .from('note_learning_threads')
    .insert({
      user_id: ctx.userId,
      note_id: note.id,
      learner_question: question,
      messages: [{ role: 'user', content: question }],
      status: 'open'
    })
    .select('id, note_id, learner_question, explanation, messages, status, created_at, updated_at')
    .single();

  if (error || !data) {
    console.error('[NOTE_LEARNING][CREATE_FAILED]', { code: error?.code || 'unknown' });
    throw new SecurityError('Could not save your question. Please try again.', 500);
  }

  return res.status(201).json({ thread: data, note_title: note.title });
}

async function getThread(req, res, ctx) {
  const threadId = String(req.query?.id || '').trim();
  if (!threadId) throw new SecurityError('id required', 400);

  const { data: thread, error } = await supabase
    .from('note_learning_threads')
    .select('id, user_id, note_id, learner_question, explanation, messages, status, created_at, updated_at')
    .eq('id', threadId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (error || !thread) throw new SecurityError('Learning explanation not found', 404);

  const note = await getAccessibleNote(ctx, thread.note_id);
  return res.status(200).json({
    thread: {
      id: thread.id,
      note_id: thread.note_id,
      learner_question: thread.learner_question,
      explanation: thread.explanation,
      messages: Array.isArray(thread.messages) ? thread.messages : [],
      status: thread.status,
      created_at: thread.created_at,
      updated_at: thread.updated_at
    },
    note_title: note.title
  });
}

async function saveExchange(body, res, ctx) {
  const threadId = String(body?.thread_id || '').trim();
  const incoming = Array.isArray(body?.messages) ? body.messages : [];

  if (!threadId) throw new SecurityError('thread_id required', 400);
  if (!incoming.length || incoming.length > MAX_HISTORY_MESSAGES) {
    throw new SecurityError('Invalid learning conversation history', 400);
  }

  const messages = incoming.map((item) => ({
    role: item?.role === 'assistant' ? 'assistant' : item?.role === 'user' ? 'user' : '',
    content: String(item?.content || '').trim()
  }));

  if (messages.some((item) => !item.role || !item.content || item.content.length > MAX_MESSAGE_LENGTH)) {
    throw new SecurityError('Invalid learning conversation message', 400);
  }
  if (messages[messages.length - 1].role !== 'assistant') {
    throw new SecurityError('An assistant explanation is required before saving', 400);
  }

  const { data: existing, error: lookupError } = await supabase
    .from('note_learning_threads')
    .select('id, note_id')
    .eq('id', threadId)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (lookupError || !existing) throw new SecurityError('Learning explanation not found', 404);
  await getAccessibleNote(ctx, existing.note_id);

  const explanation = messages.filter((item) => item.role === 'assistant').at(-1)?.content || null;
  const { data, error } = await supabase
    .from('note_learning_threads')
    .update({
      messages,
      explanation,
      status: 'answered',
      updated_at: new Date().toISOString()
    })
    .eq('id', threadId)
    .eq('user_id', ctx.userId)
    .select('id, note_id, learner_question, explanation, messages, status, created_at, updated_at')
    .single();

  if (error || !data) {
    console.error('[NOTE_LEARNING][SAVE_FAILED]', { code: error?.code || 'unknown' });
    throw new SecurityError('Could not save the explanation. Please try again.', 500);
  }

  return res.status(200).json({ thread: data });
}
