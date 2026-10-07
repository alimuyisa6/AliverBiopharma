import { supabase, addXp, recordPlatformActivity } from './core.js';
import { getUserCurriculumScope } from './curriculum.js';

const APP_TIME_ZONE = 'Africa/Kampala';

function getChallengeDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: APP_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date());
}

function rewardForType(type) {
  if (type === 'quiz') return 5;
  if (type === 'flashcards') return 4;
  return 3;
}

function titleForType(type, unitName) {
  if (type === 'quiz') return unitName ? `Quiz Challenge: ${unitName}` : 'Daily Quiz Challenge';
  if (type === 'flashcards') return unitName ? `Flashcard Challenge: ${unitName}` : 'Daily Flashcard Challenge';
  return unitName ? `Recall Challenge: ${unitName}` : 'Daily Recall Challenge';
}

function descriptionForType(type) {
  if (type === 'quiz') return 'Test your understanding with a focused quiz.';
  if (type === 'flashcards') return 'Strengthen recall with a focused flashcard session.';
  return 'Strengthen your memory with a focused recall session.';
}


const QUIZ_CHALLENGE_QUESTION_COUNT = 5;

async function getLatestFailedQuizContext(userId, groupId) {
  const { data, error } = await supabase
    .from('quiz_attempts')
    .select('id, unit_id, group_id, level_id, block_number, submitted_at, percentage')
    .eq('user_id', userId)
    .eq('group_id', groupId)
    .eq('passed', false)
    .not('submitted_at', 'is', null)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
}

async function buildQuizChallengeContent(userId, scope, failedAttempt) {
  const targetCount = QUIZ_CHALLENGE_QUESTION_COUNT;

  const { data: units, error: unitsError } = await supabase
    .from('curriculum_units')
    .select('id, name, group_id, display_order, is_hard_topic')
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (unitsError) throw unitsError;
  if (!units?.length) return null;

  const failedQuestionIds = new Set();
  let failedQuestionRows = [];

  if (failedAttempt?.id) {
    const { data: answers, error: answersError } = await supabase
      .from('quiz_attempt_answers')
      .select('question_id, correct')
      .eq('attempt_id', failedAttempt.id);

    if (answersError) throw answersError;

    for (const answer of answers || []) {
      failedQuestionIds.add(Number(answer.question_id));
    }

    const incorrectIds = (answers || [])
      .filter((answer) => answer.correct === false)
      .map((answer) => Number(answer.question_id))
      .filter(Number.isInteger);

    if (incorrectIds.length) {
      const { data: incorrectQuestions, error: incorrectError } = await supabase
        .from('quiz_questions')
        .select('id, unit_id, concept_id, concept_name, subtopic')
        .in('id', incorrectIds);

      if (incorrectError) throw incorrectError;
      failedQuestionRows = incorrectQuestions || [];
    }
  }

  const failedUnitId = failedAttempt?.unit_id || null;

  // Prefer the failed unit, but only when it has enough unused challenge content.
  // This guarantees the challenge is related without replaying the failed block.
  const candidateUnits = [
    ...units.filter((unit) => unit.id === failedUnitId),
    ...units.filter((unit) => unit.id !== failedUnitId)
  ];

  const conceptIds = new Set(
    failedQuestionRows
      .map((row) => row.concept_id)
      .filter(Boolean)
      .map(String)
  );

  const conceptNames = new Set(
    failedQuestionRows
      .map((row) => row.concept_name)
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
  );

  const subtopics = new Set(
    failedQuestionRows
      .map((row) => row.subtopic)
      .filter(Boolean)
      .map((value) => String(value).trim().toLowerCase())
  );

  for (const unit of candidateUnits) {
    const { data: questions, error: questionError } = await supabase
      .from('quiz_questions')
      .select('id, concept_id, concept_name, subtopic')
      .eq('unit_id', unit.id)
      .eq('status', 'published')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (questionError) throw questionError;

    const available = (questions || []).filter(
      (question) => !failedQuestionIds.has(Number(question.id))
    );

    if (available.length < targetCount) continue;

    const ranked = available
      .map((question) => {
        let priority = 0;

        if (conceptIds.has(String(question.concept_id))) priority += 100;
        if (
          question.concept_name &&
          conceptNames.has(String(question.concept_name).trim().toLowerCase())
        ) {
          priority += 60;
        }
        if (
          question.subtopic &&
          subtopics.has(String(question.subtopic).trim().toLowerCase())
        ) {
          priority += 30;
        }

        return { question, priority };
      })
      .sort((a, b) => b.priority - a.priority || Number(a.question.id) - Number(b.question.id));

    const selected = ranked
      .slice(0, targetCount)
      .map(({ question }) => Number(question.id));

    if (selected.length === targetCount) {
      return {
        unit,
        questionIds: selected,
        sourceAttemptId: failedAttempt?.id || null,
        sourceUnitId: failedAttempt?.unit_id || null,
        sourceBlockNumber: Number.isInteger(Number(failedAttempt?.block_number))
          ? Number(failedAttempt.block_number)
          : null,
        selectionRule:
          unit.id === failedUnitId
            ? 'same_unit_related_content_excluding_failed_attempt'
            : 'related_unit_fallback_excluding_failed_attempt'
      };
    }
  }

  return null;
}

async function refreshExistingQuizChallenge(userId, scope, challenge) {
  if (!challenge || challenge.challenge_type !== 'quiz') return challenge;
  if (challenge.status !== 'available' || challenge.started_at) return challenge;

  const failedAttempt = await getLatestFailedQuizContext(userId, scope.active_group_id);
  if (!failedAttempt) return challenge;

  const createdAt = challenge.created_at ? new Date(challenge.created_at).getTime() : 0;
  const failedAt = failedAttempt.submitted_at ? new Date(failedAttempt.submitted_at).getTime() : 0;

  if (createdAt && failedAt && failedAt <= createdAt) {
    return challenge;
  }

  const content = await buildQuizChallengeContent(userId, scope, failedAttempt);
  if (!content) return challenge;

  const now = new Date().toISOString();
  const nextConfig = {
    ...(challenge.content_config && typeof challenge.content_config === 'object'
      ? challenge.content_config
      : {}),
    personalization: 'failure_remediation',
    content_source: 'quiz_questions',
    question_ids: content.questionIds,
    source_attempt_id: content.sourceAttemptId,
    source_unit_id: content.sourceUnitId,
    source_block_number: content.sourceBlockNumber,
    selection_rule: content.selectionRule
  };

  const { data, error } = await supabase
    .from('user_daily_challenges')
    .update({
      unit_id: content.unit.id,
      title: titleForType('quiz', content.unit.name),
      description: 'Strengthen the area you just found difficult with different questions.',
      content_config: nextConfig,
      updated_at: now
    })
    .eq('id', challenge.id)
    .eq('user_id', userId)
    .eq('status', 'available')
    .is('started_at', null)
    .select('*')
    .maybeSingle();

  if (error) throw error;
  return data || challenge;
}

function chooseChallengeType(performanceRows) {
  const totals = { recall: 0, flashcards: 0, quiz: 0 };

  for (const row of performanceRows || []) {
    if (totals[row.challenge_type] !== undefined) {
      totals[row.challenge_type] += Number(row.attempts || 0);
    }
  }

  const ordered = ['recall', 'flashcards', 'quiz'];
  ordered.sort((a, b) => totals[a] - totals[b]);

  return ordered[0];
}

async function chooseUnit(userId, scope) {
  const { data: units, error: unitsError } = await supabase
    .from('curriculum_units')
    .select('id, name, group_id, display_order, is_hard_topic')
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (unitsError) throw unitsError;
  if (!units?.length) return null;

  const unitIds = units.map((unit) => unit.id);

  const [{ data: weak }, { data: performance }, { data: recentQuiz }] = await Promise.all([
    supabase
      .from('user_weak_concepts_v2')
      .select('unit_id, incorrect_attempts, last_incorrect_at, updated_at')
      .eq('user_id', userId)
      .eq('group_id', scope.active_group_id)
      .eq('resolved', false)
      .in('unit_id', unitIds)
      .order('incorrect_attempts', { ascending: false })
      .order('last_incorrect_at', { ascending: false })
      .limit(20),
    supabase
      .from('user_challenge_performance')
      .select('unit_id, challenge_type, attempts, passes, failures, last_score, updated_at')
      .eq('user_id', userId)
      .eq('group_id', scope.active_group_id)
      .in('unit_id', unitIds)
      .order('updated_at', { ascending: false })
      .limit(50),
    supabase
      .from('quiz_attempts')
      .select('unit_id, percentage, passed, submitted_at')
      .eq('user_id', userId)
      .eq('group_id', scope.active_group_id)
      .in('unit_id', unitIds)
      .order('submitted_at', { ascending: false })
      .limit(30)
  ]);

  const weakByUnit = new Map();
  for (const row of weak || []) {
    const current = weakByUnit.get(row.unit_id) || 0;
    weakByUnit.set(row.unit_id, current + Number(row.incorrect_attempts || 0));
  }

  const failureByUnit = new Map();
  for (const row of recentQuiz || []) {
    if (row.passed === false) {
      failureByUnit.set(row.unit_id, (failureByUnit.get(row.unit_id) || 0) + 1);
    }
  }

  const performanceByUnit = new Map();
  for (const row of performance || []) {
    const score = Number(row.last_score ?? 100);
    const failures = Number(row.failures || 0);
    const current = performanceByUnit.get(row.unit_id) || 0;
    performanceByUnit.set(row.unit_id, current + failures * 3 + Math.max(0, 70 - score));
  }

  const ranked = units
    .map((unit) => ({
      unit,
      priority:
        (weakByUnit.get(unit.id) || 0) * 10 +
        (failureByUnit.get(unit.id) || 0) * 6 +
        (performanceByUnit.get(unit.id) || 0) +
        (unit.is_hard_topic ? 1 : 0)
    }))
    .sort((a, b) => b.priority - a.priority);

  return ranked[0]?.unit || units[0];
}

async function createDailyChallenge(userId, scope, challengeDate) {
  if (!scope?.active_level_id || !scope?.active_group_id) return null;

  const [{ data: existing }, { data: performance }] = await Promise.all([
    supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_date', challengeDate)
      .maybeSingle(),
    supabase
      .from('user_challenge_performance')
      .select('challenge_type, attempts')
      .eq('user_id', userId)
      .eq('group_id', scope.active_group_id)
  ]);

  if (existing) {
    return refreshExistingQuizChallenge(userId, scope, existing);
  }

  const unit = await chooseUnit(userId, scope);
  if (!unit) return null;

  const type = chooseChallengeType(performance || []);
  const targetCount = type === 'quiz' ? QUIZ_CHALLENGE_QUESTION_COUNT : type === 'flashcards' ? 5 : 3;
  const passingScore = type === 'quiz' ? 70 : type === 'flashcards' ? 60 : 60;

  let contentConfig = {
    personalization: 'weakness_first',
    active_level_id: scope.active_level_id,
    active_group_id: scope.active_group_id,
    unit_id: unit.id
  };

  let challengeUnit = unit;

  if (type === 'quiz') {
    const failedAttempt = await getLatestFailedQuizContext(userId, scope.active_group_id);
    const content = await buildQuizChallengeContent(userId, scope, failedAttempt);

    if (content) {
      challengeUnit = content.unit;
      contentConfig = {
        ...contentConfig,
        personalization: failedAttempt
          ? 'failure_remediation'
          : 'weakness_first',
        content_source: 'quiz_questions',
        question_ids: content.questionIds,
        source_attempt_id: content.sourceAttemptId,
        source_unit_id: content.sourceUnitId,
        source_block_number: content.sourceBlockNumber,
        selection_rule: content.selectionRule
      };
    }
  }

  const payload = {
    user_id: userId,
    challenge_date: challengeDate,
    challenge_type: type,
    level_id: scope.active_level_id,
    group_id: scope.active_group_id,
    unit_id: challengeUnit.id,
    title: titleForType(type, challengeUnit.name),
    description: type === 'quiz' && contentConfig.personalization === 'failure_remediation'
      ? 'Strengthen the area you just found difficult with different questions.'
      : descriptionForType(type),
    source: 'personalized',
    target_count: targetCount,
    passing_score: passingScore,
    reward_xp: rewardForType(type),
    content_config: {
      ...contentConfig,
      unit_id: challengeUnit.id
    }
  };

  const { data, error } = await supabase
    .from('user_daily_challenges')
    .insert(payload)
    .select('*')
    .single();

  if (!error) return data;

  if (error.code === '23505') {
    const { data: concurrent } = await supabase
      .from('user_daily_challenges')
      .select('*')
      .eq('user_id', userId)
      .eq('challenge_date', challengeDate)
      .maybeSingle();
    return concurrent || null;
  }

  throw error;
}

export async function getOrCreateDailyChallenge(userId) {
  const scope = await getUserCurriculumScope(userId);
  if (!scope?.active_level_id || !scope?.active_group_id) {
    return {
      challenge: null,
      scope
    };
  }

  const challengeDate = getChallengeDate();
  const challenge = await createDailyChallenge(userId, scope, challengeDate);

  return {
    challenge,
    scope,
    challenge_date: challengeDate
  };
}


async function getChallengeForUser(userId, challengeId) {
  const { data, error } = await supabase
    .from('user_daily_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

async function verifySourceResult(userId, challenge, sourceId) {
  if (!sourceId) throw new Error('A source session or attempt is required');

  if (challenge.challenge_type === 'quiz') {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('id, user_id, unit_id, group_id, level_id, session_id, percentage, passed, total_questions, submitted_at')
      .eq('id', sourceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.unit_id !== challenge.unit_id || data.group_id !== challenge.group_id || data.level_id !== challenge.level_id) {
      throw new Error('Quiz attempt does not belong to this challenge');
    }
    if (!data.submitted_at) throw new Error('Quiz attempt is not complete');

    const { data: quizSession, error: quizSessionError } = await supabase
      .from('user_quiz_sessions')
      .select('id, user_id, state')
      .eq('id', data.session_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (quizSessionError) throw quizSessionError;
    if (!quizSession || quizSession.state?.challenge_id !== challenge.id) {
      throw new Error('Quiz attempt was not created for this challenge');
    }

    return {
      sourceId: data.id,
      score: Number(data.percentage || 0),
      progress: Number(data.total_questions || 0),
      passed: Number(data.percentage || 0) >= Number(challenge.passing_score || 0),
      performanceData: {
        source: 'quiz_attempt',
        percentage: Number(data.percentage || 0),
        total_questions: Number(data.total_questions || 0)
      }
    };
  }

  if (challenge.challenge_type === 'recall') {
    const { data, error } = await supabase
      .from('recall_sessions')
      .select('session_id, user_id, unit_id, group_id, level, is_active, completed_at, all_question_ids, user_answers, challenge_id')
      .eq('session_id', sourceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data || data.unit_id !== challenge.unit_id || data.group_id !== challenge.group_id || data.level !== challenge.level_id) {
      throw new Error('Recall session does not belong to this challenge');
    }
    if (data.is_active || !data.completed_at) throw new Error('Recall session is not complete');
    if (data.challenge_id !== challenge.id) throw new Error('Recall session was not created for this challenge');

    const answers = Array.isArray(data.user_answers) ? data.user_answers : [];
    const total = Array.isArray(data.all_question_ids) ? data.all_question_ids.length : answers.length;
    const correct = answers.filter((item) => item?.strength === 'excellent' || item?.strength === 'strong').length;
    const score = total ? Math.round((correct / total) * 100) : 0;

    return {
      sourceId: data.session_id,
      score,
      progress: answers.length,
      passed: score >= Number(challenge.passing_score || 0),
      performanceData: {
        source: 'recall_session',
        total_questions: total,
        answered_questions: answers.length,
        correct_questions: correct
      }
    };
  }

  if (challenge.challenge_type === 'flashcards') {
    const { data, error } = await supabase
      .from('user_flashcard_sessions')
      .select('id, user_id, deck_id, cards_seen, cards_correct, cards_incorrect, is_complete, completed_at, challenge_id')
      .eq('id', sourceId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    if (!data || !data.is_complete || !data.completed_at) {
      throw new Error('Flashcard session is not complete');
    }

    if (data.challenge_id !== challenge.id) throw new Error('Flashcard session was not created for this challenge');

    const { data: deck, error: deckError } = await supabase
      .from('flashcard_decks')
      .select('id, unit_id')
      .eq('id', data.deck_id)
      .maybeSingle();

    if (deckError) throw deckError;
    if (!deck || deck.unit_id !== challenge.unit_id) {
      throw new Error('Flashcard deck does not belong to this challenge');
    }

    const seen = Array.isArray(data.cards_seen) ? data.cards_seen : [];
    const correct = Array.isArray(data.cards_correct) ? data.cards_correct : [];
    const score = seen.length ? Math.round((correct.length / seen.length) * 100) : 0;

    return {
      sourceId: data.id,
      score,
      progress: seen.length,
      passed: seen.length >= Number(challenge.target_count || 0) && score >= Number(challenge.passing_score || 0),
      performanceData: {
        source: 'flashcard_session',
        cards_seen: seen.length,
        cards_correct: correct.length,
        cards_incorrect: Array.isArray(data.cards_incorrect) ? data.cards_incorrect.length : 0
      }
    };
  }

  throw new Error('Unsupported challenge type');
}

export async function completeDailyChallenge(userId, challengeId, sourceId) {
  const challenge = await getChallengeForUser(userId, challengeId);

  if (!challenge) throw new Error('Challenge not found');

  const today = getChallengeDate();
  if (challenge.challenge_date !== today) {
    if (challenge.status !== 'completed') {
      await supabase
        .from('user_daily_challenges')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', challenge.id)
        .eq('user_id', userId);
    }
    throw new Error('Challenge has expired');
  }

  if (challenge.status === 'expired') throw new Error('Challenge has expired');
  if (challenge.passed === true && challenge.xp_awarded_at) {
    return { challenge, already_completed: true, xp_awarded: false };
  }

  const result = await verifySourceResult(userId, challenge, sourceId);

  const { data: existingAttempt } = await supabase
    .from('user_daily_challenge_attempts')
    .select('id')
    .eq('daily_challenge_id', challenge.id)
    .eq('source_attempt_id', result.sourceId)
    .maybeSingle();

  if (existingAttempt) {
    return { challenge, already_completed: challenge.passed === true, xp_awarded: false };
  }

  const { data: attempts } = await supabase
    .from('user_daily_challenge_attempts')
    .select('attempt_number')
    .eq('daily_challenge_id', challenge.id)
    .order('attempt_number', { ascending: false })
    .limit(1);

  const attemptNumber = Number(attempts?.[0]?.attempt_number || 0) + 1;

  const { error: attemptInsertError } = await supabase
    .from('user_daily_challenge_attempts')
    .insert({
      daily_challenge_id: challenge.id,
      user_id: userId,
      attempt_number: attemptNumber,
      challenge_type: challenge.challenge_type,
      source_session_id: challenge.challenge_type === 'recall' || challenge.challenge_type === 'flashcards' ? result.sourceId : null,
      source_attempt_id: challenge.challenge_type === 'quiz' ? result.sourceId : null,
      score: result.score,
      passed: result.passed,
      progress: result.progress,
      failure_reason: result.passed ? null : 'Passing requirement not met',
      performance_data: result.performanceData,
      completed_at: new Date().toISOString()
    });

  if (attemptInsertError) {
    if (attemptInsertError.code === '23505') {
      return { challenge, already_completed: challenge.passed === true, xp_awarded: false };
    }
    throw attemptInsertError;
  }

  const { data: updatedChallenge, error: updateError } = await supabase
    .from('user_daily_challenges')
    .update({
      status: result.passed ? 'completed' : 'available',
      progress: result.progress,
      score: result.score,
      passed: result.passed,
      completed_at: result.passed ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    })
    .eq('id', challenge.id)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (updateError) throw updateError;

  const { data: previousPerformance } = await supabase
    .from('user_challenge_performance')
    .select('*')
    .eq('user_id', userId)
    .eq('challenge_type', challenge.challenge_type)
    .eq('level_id', challenge.level_id)
    .eq('group_id', challenge.group_id)
    .eq('unit_id', challenge.unit_id)
    .maybeSingle();

  const previousAttempts = Number(previousPerformance?.attempts || 0);
  const previousPasses = Number(previousPerformance?.passes || 0);
  const previousFailures = Number(previousPerformance?.failures || 0);
  const previousTotalScore = Number(previousPerformance?.total_score || 0);
  const previousBestScore = Number(previousPerformance?.best_score || 0);
  const previousCurrentStreak = Number(previousPerformance?.current_streak || 0);
  const previousBestStreak = Number(previousPerformance?.best_streak || 0);
  const currentStreak = result.passed ? previousCurrentStreak + 1 : 0;

  const { error: performanceError } = await supabase.from('user_challenge_performance').upsert({
    user_id: userId,
    challenge_type: challenge.challenge_type,
    level_id: challenge.level_id,
    group_id: challenge.group_id,
    unit_id: challenge.unit_id,
    attempts: previousAttempts + 1,
    passes: previousPasses + (result.passed ? 1 : 0),
    failures: previousFailures + (result.passed ? 0 : 1),
    total_score: previousTotalScore + result.score,
    best_score: Math.max(previousBestScore, result.score),
    last_score: result.score,
    current_streak: currentStreak,
    best_streak: Math.max(previousBestStreak, currentStreak),
    last_attempt_at: new Date().toISOString(),
    last_passed_at: result.passed ? new Date().toISOString() : previousPerformance?.last_passed_at || null,
    last_failed_at: result.passed ? previousPerformance?.last_failed_at || null : new Date().toISOString(),
    updated_at: new Date().toISOString()
  }, { onConflict: 'user_id,challenge_type,level_id,group_id,unit_id' });

  if (performanceError) throw performanceError;

  if (!result.passed) {
    return {
      challenge: updatedChallenge,
      passed: false,
      score: result.score,
      xp_awarded: 0
    };
  }

  const { data: claim, error: claimError } = await supabase
    .from('user_daily_challenges')
    .update({ xp_awarded_at: new Date().toISOString() })
    .eq('id', challenge.id)
    .eq('user_id', userId)
    .is('xp_awarded_at', null)
    .select('id')
    .maybeSingle();

  if (claimError) throw claimError;

  if (!claim) {
    return {
      challenge: updatedChallenge,
      passed: true,
      score: result.score,
      xp_awarded: 0
    };
  }

  await supabase.from('user_daily_challenge_completions').upsert({
    user_id: userId,
    completed_date: challenge.challenge_date,
    completed_at: new Date().toISOString()
  }, { onConflict: 'user_id,completed_date' });

  await addXp(
    userId,
    challenge.reward_xp,
    'Daily challenge completed',
    'daily_challenge',
    { challenge_id: challenge.id, challenge_type: challenge.challenge_type },
    challenge.unit_id,
    challenge.group_id,
    challenge.level_id
  );

  await recordPlatformActivity(userId);

  return {
    challenge: { ...updatedChallenge, xp_awarded_at: new Date().toISOString() },
    passed: true,
    score: result.score,
    xp_awarded: challenge.reward_xp
  };
}
