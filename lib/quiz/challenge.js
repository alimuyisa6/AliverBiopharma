import { supabase } from '../core.js';
import { requireAuth, SecurityError } from '../security-middleware.js';

function rpcError(error, fallback = 'Quiz challenge request failed') {
  if (!error) return null;
  const message = error.message || '';
  const known = [
    'QUIZ_CHALLENGE_NOT_FOUND',
    'QUIZ_CHALLENGE_NOT_CURRENT',
    'QUIZ_CHALLENGE_ALREADY_COMPLETED',
    'QUIZ_CHALLENGE_EXPIRED',
    'QUIZ_CHALLENGE_CONTENT_INSUFFICIENT',
    'QUIZ_CHALLENGE_SESSION_NOT_FOUND',
    'QUIZ_CHALLENGE_SESSION_NOT_ACTIVE',
    'QUIZ_CHALLENGE_SESSION_EXPIRED',
    'QUIZ_CHALLENGE_QUESTION_NOT_IN_SESSION',
    'QUIZ_CHALLENGE_QUESTION_ALREADY_ANSWERED',
    'QUIZ_CHALLENGE_OPTION_INVALID',
    'QUIZ_CHALLENGE_INCOMPLETE',
    'QUIZ_CHALLENGE_TYPE_MISMATCH'
  ];

  const code = known.find((item) => message.includes(item));
  if (code) return new SecurityError(code, 400);
  return new SecurityError(fallback, 500);
}

export async function startQuizChallenge(body, res, ctx) {
  requireAuth(ctx);

  const { challenge_id, idempotency_key } = body || {};
  if (!challenge_id || !idempotency_key) {
    throw new SecurityError('challenge_id and idempotency_key required', 400);
  }

  const { data, error } = await supabase.rpc('atomic_start_quiz_challenge', {
    p_user_id: ctx.userId,
    p_challenge_id: challenge_id,
    p_idempotency_key: idempotency_key
  });

  if (error) throw rpcError(error);
  return res.status(200).json(data || {});
}

export async function getQuizChallengeSession(req, res, ctx) {
  requireAuth(ctx);

  const sessionId = req.query?.session_id;
  if (!sessionId) throw new SecurityError('session_id required', 400);

  const { data, error } = await supabase.rpc('get_quiz_challenge_session', {
    p_user_id: ctx.userId,
    p_session_id: sessionId
  });

  if (error) throw rpcError(error);
  return res.status(200).json(data || {});
}

export async function submitQuizChallengeAnswer(body, res, ctx) {
  requireAuth(ctx);

  const {
    session_id,
    question_id,
    selected_option,
    idempotency_key
  } = body || {};

  if (!session_id || !question_id || !selected_option || !idempotency_key) {
    throw new SecurityError(
      'session_id, question_id, selected_option and idempotency_key required',
      400
    );
  }

  const { data, error } = await supabase.rpc('submit_quiz_challenge_answer', {
    p_user_id: ctx.userId,
    p_session_id: session_id,
    p_question_id: question_id,
    p_selected_option: selected_option,
    p_idempotency_key: idempotency_key
  });

  if (error) throw rpcError(error);
  return res.status(200).json(data || {});
}

export async function completeQuizChallenge(body, res, ctx) {
  requireAuth(ctx);

  const { session_id, idempotency_key } = body || {};
  if (!session_id || !idempotency_key) {
    throw new SecurityError('session_id and idempotency_key required', 400);
  }

  const { data, error } = await supabase.rpc('atomic_complete_quiz_challenge', {
    p_user_id: ctx.userId,
    p_session_id: session_id,
    p_idempotency_key: idempotency_key
  });

  if (error) throw rpcError(error);
  return res.status(200).json(data || {});
}
