/* lib/quiz/attempts.js */
import { supabase } from '../core.js';
import {
  requireAuth,
  SecurityError
} from '../security-middleware.js';
import { gradeQuestionAnswer } from './question-types.js';

export async function getQuizAttempts(req, res, ctx) {
  requireAuth(ctx);

  const { unit_id, block_number, limit = 20 } = req.query;

  let query = supabase
    .from('quiz_attempts')
    .select('id, unit_id, block_number, attempt_number, status, score, total_questions, percentage, passed, xp_earned, time_taken, auto_submitted, auto_submit_reason, tab_switches, started_at, submitted_at, created_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false })
    .limit(Math.min(parseInt(limit, 10) || 20, 50));

  if (unit_id) query = query.eq('unit_id', unit_id);
  if (block_number !== undefined) query = query.eq('block_number', Number(block_number));

  const { data, error } = await query;

  if (error) throw new SecurityError('Failed to load quiz attempts', 500);

  const attempts = data || [];

  const bestScore = attempts.length
    ? Math.max(...attempts.map((item) => Number(item.percentage) || 0))
    : 0;

  const latestScore = attempts.length ? Number(attempts[0].percentage) || 0 : 0;
  const averageScore = attempts.length
    ? Math.round(attempts.reduce((sum, item) => sum + (Number(item.percentage) || 0), 0) / attempts.length)
    : 0;

  return res.status(200).json({
    attempts,
    summary: {
      attempt_count: attempts.length,
      best_score: bestScore,
      latest_score: latestScore,
      average_score: averageScore
    }
  });
}

export async function getQuizAttempt(req, res, ctx) {
  requireAuth(ctx);

  const { attempt_id } = req.query;

  if (!attempt_id) throw new SecurityError('attempt_id required', 400);

  const { data: attempt } = await supabase
    .from('quiz_attempts')
    .select('*')
    .eq('id', attempt_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!attempt) throw new SecurityError('Quiz attempt not found', 404);

  const { data: answers } = await supabase
    .from('quiz_attempt_answers')
    .select('question_id, selected_option, selected_answer, question_type, correct, time_taken_seconds, answer_changed, answered_at, review_status, marks_awarded, max_marks, teacher_feedback, graded_at, question_snapshot')
    .eq('attempt_id', attempt.id)
    .order('answered_at', { ascending: true });

  const questionIds = (answers || []).map((item) => item.question_id);

  const { data: questions } = questionIds.length
    ? await supabase
        .from('quiz_question_revisions')
        .select('question_id, version, question_text, option_a, option_b, option_c, option_d, correct_option, explanation, difficulty, image_url, question_type, question_data, answer_key')
        .in('question_id', questionIds)
    : { data: [] };

  const revisionMap = new Map();

  for (const revision of questions || []) {
    const key = String(revision.question_id);
    const current = revisionMap.get(key);

    if (!current || Number(revision.version) > Number(current.version)) {
      revisionMap.set(key, revision);
    }
  }

  const detailedAnswers = (answers || []).map((answer) => {
    const revision = revisionMap.get(String(answer.question_id));
    const snapshot = answer.question_snapshot || {};
    const question = { ...revision, ...snapshot };
    const isEssay = answer.question_type === 'essay' || question.question_type === 'essay';
    const graded = !isEssay && revision
      ? gradeQuestionAnswer(revision, answer.selected_answer ?? answer.selected_option)
      : null;

    return {
      ...answer,
      question_text: question.question_text || null,
      question_type: answer.question_type || question.question_type || 'single_choice',
      question_data: question.question_data || {},
      correct_answer_text: isEssay ? null : (graded?.correctAnswerText || revision?.correct_option || null),
      user_answer_text: isEssay
        ? String(answer.selected_answer ?? answer.selected_option ?? 'No response')
        : (graded?.userAnswerText || answer.selected_option || 'No answer'),
      explanation: question.explanation || null,
      difficulty: question.difficulty || revision?.difficulty || null
    };
  });

  return res.status(200).json({
    ...attempt,
    answers: detailedAnswers
  });
}
