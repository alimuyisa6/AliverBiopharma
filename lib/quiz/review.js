/* lib/quiz/review.js */
import { supabase, addXp, updateTopicXp, updateUserRecords, recordPlatformActivity, updateDailyChallengeProgress } from '../core.js';
import {
  requireAuth,
  requireAdmin,
  SecurityError,
  rateLimiter
} from '../security-middleware.js';
import { getUserCurriculumScope } from '../curriculum.js';
import { createNotification } from '../notifications.js';
import {
  getStoredIdempotencyResponse,
  createIdempotencyKey
} from './idempotency.js';

export async function getDueReviewQuestions(req, res, ctx) {
  requireAuth(ctx);

  const { limit = 20 } = req.query;

  const { data } = await supabase
    .from('user_spaced_repetition')
    .select('question_id, level, topic, next_review_date, repetitions')
    .eq('user_id', ctx.userId)
    .lte('next_review_date', new Date().toISOString())
    .order('next_review_date', { ascending: true })
    .limit(Math.min(parseInt(limit, 10) || 20, 50));

  const questionIds = (data || []).map((item) => Number(item.question_id));

  if (!questionIds.length) {
    return res.status(200).json([]);
  }

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('id, question_text, option_a, option_b, option_c, option_d, difficulty, status, version')
    .in('id', questionIds)
    .eq('status', 'published')
    .eq('is_active', true)
    .eq('is_note_practice', false);

  const questionMap = new Map();

  for (const question of questions || []) {
    questionMap.set(Number(question.id), question);
  }

  const due = (data || [])
    .filter((item) => questionMap.has(Number(item.question_id)))
    .map((item) => ({
      ...item,
      question: questionMap.get(Number(item.question_id))
    }));

  return res.status(200).json(due);
}

export async function getBookmarks(req, res, ctx) {
  requireAuth(ctx);

  const { data } = await supabase
    .from('quiz_bookmarks')
    .select('id, question_id, note, created_at, updated_at')
    .eq('user_id', ctx.userId)
    .order('created_at', { ascending: false });

  return res.status(200).json(data || []);
}

export async function bookmarkQuestion(body, res, ctx) {
  requireAuth(ctx);

  const { question_id, note, idempotency_key } = body;

  if (!question_id) throw new SecurityError('question_id required', 400);

  const ip = ctx.clientIp || 'unknown';

  if (!(await rateLimiter.check(ip, ctx.userId, 'quiz_bookmark'))) {
    throw new SecurityError('Too many bookmark requests', 429);
  }

  if (idempotency_key) {
    const stored = await getStoredIdempotencyResponse(ctx.userId, 'bookmark_question', idempotency_key);

    if (stored) return res.status(200).json(stored);
  }

  const { data: existing } = await supabase
    .from('quiz_bookmarks')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('question_id', question_id)
    .maybeSingle();

  if (existing) {
    const response = { success: true, already_bookmarked: true };

    if (idempotency_key) {
      await createIdempotencyKey(ctx.userId, 'bookmark_question', idempotency_key, response, 200);
    }

    return res.status(200).json(response);
  }

  await supabase.from('quiz_bookmarks').insert({
    user_id: ctx.userId,
    question_id: Number(question_id),
    note: note || null
  });

  const response = { success: true, bookmarked: true };

  if (idempotency_key) {
    await createIdempotencyKey(ctx.userId, 'bookmark_question', idempotency_key, response, 200);
  }

  return res.status(200).json(response);
}

export async function removeBookmark(body, res, ctx) {
  requireAuth(ctx);

  const { question_id } = body;

  if (!question_id) throw new SecurityError('question_id required', 400);

  await supabase
    .from('quiz_bookmarks')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('question_id', question_id);

  return res.status(200).json({ success: true });
}

export async function getQuestionNote(req, res, ctx) {
  requireAuth(ctx);

  const { question_id } = req.query;

  if (!question_id) throw new SecurityError('question_id required', 400);

  const { data } = await supabase
    .from('user_question_notes')
    .select('id, question_id, note, created_at, updated_at')
    .eq('user_id', ctx.userId)
    .eq('question_id', question_id)
    .maybeSingle();

  return res.status(200).json(data || null);
}

export async function saveQuestionNote(body, res, ctx) {
  requireAuth(ctx);

  const { question_id, note, idempotency_key } = body;

  if (!question_id || !note?.trim()) {
    throw new SecurityError('question_id and note required', 400);
  }

  const ip = ctx.clientIp || 'unknown';

  if (!(await rateLimiter.check(ip, ctx.userId, 'quiz_question_note'))) {
    throw new SecurityError('Too many note requests', 429);
  }

  if (idempotency_key) {
    const stored = await getStoredIdempotencyResponse(ctx.userId, 'save_question_note', idempotency_key);

    if (stored) return res.status(200).json(stored);
  }

  const { data: noteRow } = await supabase
    .from('user_question_notes')
    .upsert({
      user_id: ctx.userId,
      question_id: Number(question_id),
      note: note.trim(),
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id,question_id' })
    .select()
    .single();

  const response = { success: true, note: noteRow };

  if (idempotency_key) {
    await createIdempotencyKey(ctx.userId, 'save_question_note', idempotency_key, response, 200);
  }

  return res.status(200).json(response);
}

export async function deleteQuestionNote(body, res, ctx) {
  requireAuth(ctx);

  const { question_id } = body;

  if (!question_id) throw new SecurityError('question_id required', 400);

  await supabase
    .from('user_question_notes')
    .delete()
    .eq('user_id', ctx.userId)
    .eq('question_id', question_id);

  return res.status(200).json({ success: true });
}


async function getReviewerScope(ctx) {
  requireAuth(ctx);

  if (ctx.adminIdentity || ctx.adminData) {
    requireAdmin(ctx);
    return { isAdmin: true, allUnits: true, unitIds: null };
  }

  const { data: teacherProfile, error: teacherProfileError } = await supabase
    .from('user_profiles')
    .select('role, is_approved_teacher, approved_track, active_level_id, active_group_id, level_approval_status')
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (teacherProfileError) throw new SecurityError('Unable to verify reviewer profile', 500);

  if (
    teacherProfile?.role === 'teacher' &&
    teacherProfile.is_approved_teacher === true &&
    teacherProfile.level_approval_status === 'approved'
  ) {
    if (teacherProfile.approved_track === 'ALL') {
      return { isAdmin: false, allUnits: true, unitIds: null };
    }

    const curriculumScope = await getUserCurriculumScope(ctx.userId);
    if (curriculumScope?.showAll) {
      return { isAdmin: false, allUnits: true, unitIds: null };
    }

    if (curriculumScope?.active_group_id) {
      const { data: units, error: unitsError } = await supabase
        .from('curriculum_units')
        .select('id')
        .eq('group_id', curriculumScope.active_group_id);

      if (unitsError) throw new SecurityError('Unable to verify approved teaching scope', 500);
      const unitIds = (units || []).map((row) => row.id);
      if (unitIds.length) return { isAdmin: false, allUnits: false, unitIds };
    }

    if (curriculumScope?.active_level_id) {
      const { data: groups, error: groupsError } = await supabase
        .from('curriculum_groups')
        .select('id')
        .eq('level_id', curriculumScope.active_level_id);

      if (groupsError) throw new SecurityError('Unable to verify approved teaching level', 500);
      const groupIds = (groups || []).map((row) => row.id);
      if (groupIds.length) {
        const { data: units, error: unitsError } = await supabase
          .from('curriculum_units')
          .select('id')
          .in('group_id', groupIds);

        if (unitsError) throw new SecurityError('Unable to verify approved teaching level', 500);
        const unitIds = (units || []).map((row) => row.id);
        if (unitIds.length) return { isAdmin: false, allUnits: false, unitIds };
      }
    }
  }

  const { data: profile, error } = await supabase
    .from('tutor_profiles')
    .select('id, verification_status, listing_status, expires_at')
    .eq('user_id', ctx.userId)
    .eq('verification_status', 'verified')
    .eq('listing_status', 'active')
    .maybeSingle();

  if (error || !profile) throw new SecurityError('Approved reviewer access is required', 403);
  if (profile.expires_at && new Date(profile.expires_at).getTime() <= Date.now()) {
    throw new SecurityError('Your reviewer access has expired', 403);
  }

  const { data: assignments, error: assignmentError } = await supabase
    .from('tutor_profile_units')
    .select('unit_id')
    .eq('profile_id', profile.id);

  if (assignmentError) throw new SecurityError('Unable to verify reviewer subjects', 500);
  const unitIds = [...new Set((assignments || []).map((row) => row.unit_id).filter(Boolean))];
  if (!unitIds.length) throw new SecurityError('No curriculum units are assigned to your reviewer profile', 403);

  return { isAdmin: false, allUnits: false, unitIds };
}

export async function getQuizReviewQueue(req, res, ctx) {
  const scope = await getReviewerScope(ctx);
  let query = supabase
    .from('quiz_attempts')
    .select('id, user_id, unit_id, group_id, level_id, block_number, attempt_number, status, started_at, submitted_at')
    .eq('status', 'pending_review')
    .order('submitted_at', { ascending: true })
    .limit(200);

  if (!scope.isAdmin && !scope.allUnits) query = query.in('unit_id', scope.unitIds);
  const { data: attempts, error: attemptsError } = await query;
  if (attemptsError) throw new SecurityError('Unable to load essay submissions', 500);

  const attemptRows = attempts || [];
  if (!attemptRows.length) return res.status(200).json({ submissions: [], count: 0 });

  const attemptIds = attemptRows.map((row) => row.id);
  const userIds = [...new Set(attemptRows.map((row) => row.user_id).filter(Boolean))];
  const unitIds = [...new Set(attemptRows.map((row) => row.unit_id).filter(Boolean))];

  const [answersResult, profilesResult, unitsResult] = await Promise.all([
    supabase.from('quiz_attempt_answers')
      .select('id, attempt_id, question_id, selected_answer, question_type, review_status, marks_awarded, max_marks, question_snapshot, answered_at')
      .in('attempt_id', attemptIds)
      .eq('question_type', 'essay')
      .eq('review_status', 'pending_review')
      .order('answered_at', { ascending: true }),
    supabase.from('user_profiles')
      .select('user_id, display_name, full_name, name')
      .in('user_id', userIds),
    supabase.from('curriculum_units')
      .select('id, name, group_id, curriculum_groups(name, level_id)')
      .in('id', unitIds)
  ]);

  if (answersResult.error || profilesResult.error || unitsResult.error) {
    throw new SecurityError('Unable to load essay review details', 500);
  }

  const questionIds = [...new Set((answersResult.data || []).map((row) => row.question_id))];
  const { data: questionRows, error: questionError } = questionIds.length
    ? await supabase.from('quiz_question_revisions').select('question_id, version, answer_key').in('question_id', questionIds)
    : { data: [], error: null };

  if (questionError) throw new SecurityError('Unable to load essay marking guidance', 500);

  const attemptMap = new Map(attemptRows.map((row) => [row.id, row]));
  const profileMap = new Map((profilesResult.data || []).map((row) => [row.user_id, row]));
  const unitMap = new Map((unitsResult.data || []).map((row) => [row.id, row]));
  const rubricMap = new Map((questionRows || []).map((row) => [`${row.question_id}:${row.version}`, row.answer_key || {}]));

  const submissions = (answersResult.data || []).map((answer) => {
    const attempt = attemptMap.get(answer.attempt_id);
    const profile = attempt ? profileMap.get(attempt.user_id) : null;
    const unit = attempt ? unitMap.get(attempt.unit_id) : null;
    const revisionVersion = Number(answer.question_snapshot?.question_version) || 1;
    const markingGuidance = rubricMap.get(`${answer.question_id}:${revisionVersion}`) || {};
    return {
      ...answer,
      attempt,
      rubric: markingGuidance.rubric || '',
      grading_criteria: markingGuidance.grading_criteria || [],
      learner_name: profile?.display_name || profile?.full_name || profile?.name || 'Learner',
      unit_name: unit?.name || 'Curriculum unit',
      group_name: unit?.curriculum_groups?.name || '',
      level_id: unit?.curriculum_groups?.level_id || attempt?.level_id || null
    };
  });

  return res.status(200).json({ submissions, count: submissions.length });
}

export async function gradeQuizSubmission(body, res, ctx) {
  const scope = await getReviewerScope(ctx);
  const answerId = String(body.answer_id || '').trim();
  const marks = Number(body.marks_awarded);
  const feedback = String(body.teacher_feedback || '').trim();

  if (!/^[0-9a-f-]{36}$/i.test(answerId)) throw new SecurityError('A valid answer_id is required', 400);
  if (!Number.isFinite(marks) || marks < 0) throw new SecurityError('Enter a valid mark of zero or more', 400);
  if (feedback.length > 5000) throw new SecurityError('Feedback must be 5,000 characters or fewer', 400);

  const { data: answer, error: answerError } = await supabase
    .from('quiz_attempt_answers')
    .select('id, attempt_id, question_id, review_status, max_marks, question_type')
    .eq('id', answerId)
    .eq('question_type', 'essay')
    .maybeSingle();

  if (answerError || !answer) throw new SecurityError('Essay submission not found', 404);
  if (answer.review_status !== 'pending_review') throw new SecurityError('This essay has already been graded', 409);

  const { data: attempt, error: attemptError } = await supabase
    .from('quiz_attempts')
    .select('id, user_id, unit_id, group_id, level_id, block_number, status, time_taken')
    .eq('id', answer.attempt_id)
    .maybeSingle();

  if (attemptError || !attempt) throw new SecurityError('Quiz attempt not found', 404);
  if (attempt.status !== 'pending_review') throw new SecurityError('This assessment is no longer awaiting review', 409);
  if (!scope.isAdmin && !scope.allUnits && !scope.unitIds.includes(attempt.unit_id)) {
    throw new SecurityError('You are not assigned to review this curriculum unit', 403);
  }

  const maxMarks = Number(answer.max_marks) || 10;
  if (marks > maxMarks) throw new SecurityError(`Marks cannot exceed ${maxMarks}`, 400);

  const { data: updated, error: updateError } = await supabase
    .from('quiz_attempt_answers')
    .update({
      review_status: 'graded',
      marks_awarded: marks,
      correct: marks >= maxMarks,
      teacher_feedback: feedback || null,
      graded_by: ctx.userId,
      graded_at: new Date().toISOString()
    })
    .eq('id', answer.id)
    .eq('review_status', 'pending_review')
    .select('id')
    .maybeSingle();

  if (updateError) throw new SecurityError('Unable to save essay grade', 500);
  if (!updated) throw new SecurityError('This essay was graded by another reviewer', 409);

  const { data: result, error: recalculateError } = await supabase.rpc(
    'atomic_recalculate_quiz_review_attempt',
    { p_attempt_id: attempt.id, p_user_id: attempt.user_id }
  );

  if (recalculateError) {
    console.error('[QUIZ_REVIEW_RECALCULATION_ERROR]', JSON.stringify({
      attempt_id: attempt.id,
      error: recalculateError.message
    }));
    throw new SecurityError('The mark was saved, but the final result could not be recalculated. Please refresh the review queue.', 500);
  }

  if (result?.finalized_now && ['passed', 'failed'].includes(result.status)) {
    await updateUserRecords(attempt.user_id, {
      score: Number(result.percentage) || 0,
      timeTakenSeconds: attempt.time_taken || 0,
      isPerfect: Number(result.percentage) === 100
    }).catch((error) => console.error('[QUIZ_REVIEW_USER_RECORD_ERROR]', error.message));

    await recordPlatformActivity(attempt.user_id)
      .catch((error) => console.error('[QUIZ_REVIEW_ACTIVITY_ERROR]', error.message));

    await updateDailyChallengeProgress(attempt.user_id, attempt.group_id, 'blocks_completed', 1)
      .catch(() => {});

    const { data: reviewedUnit } = await supabase
      .from('curriculum_units')
      .select('name')
      .eq('id', attempt.unit_id)
      .maybeSingle();

    const xpEarned = result.passed
      ? Math.round(10 + Number(result.percentage || 0) / 10)
      : 5;

    try {
      await addXp(
        attempt.user_id,
        xpEarned,
        'quiz_block',
        'quiz',
        {
          attempt_id: attempt.id,
          unit_id: attempt.unit_id,
          block_number: attempt.block_number,
          manually_graded: true
        },
        attempt.unit_id,
        attempt.group_id,
        attempt.level_id || null
      );
      await updateTopicXp(attempt.user_id, attempt.unit_id, reviewedUnit?.name || 'Quiz assessment', xpEarned);
      await supabase.from('quiz_attempts').update({ xp_earned: xpEarned }).eq('id', attempt.id);
    } catch (error) {
      console.error('[QUIZ_REVIEW_XP_ERROR]', JSON.stringify({ attempt_id: attempt.id, error: error.message }));
    }

    await createNotification(
      attempt.user_id,
      result.status === 'passed' ? 'quiz_passed' : 'quiz_failed',
      {
        topic_name: reviewedUnit?.name || 'your assessment',
        score: result.percentage,
        attempt_id: attempt.id,
        manually_graded: true
      },
      {
        action_url: `/quiz/attempt/${attempt.id}`,
        action_text: 'View results'
      }
    ).catch((error) => console.error('[QUIZ_REVIEW_NOTIFICATION_ERROR]', error.message));
  }

  return res.status(200).json({
    success: true,
    graded_answer_id: answer.id,
    attempt: result || { status: 'pending_review', pending_review: true }
  });
}
