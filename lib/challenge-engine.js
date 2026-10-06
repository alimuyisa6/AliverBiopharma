import { supabase } from './core.js';
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

  if (existing) return existing;

  const unit = await chooseUnit(userId, scope);
  if (!unit) return null;

  const type = chooseChallengeType(performance || []);
  const targetCount = type === 'quiz' ? 5 : type === 'flashcards' ? 5 : 3;
  const passingScore = type === 'quiz' ? 70 : type === 'flashcards' ? 60 : 60;

  const payload = {
    user_id: userId,
    challenge_date: challengeDate,
    challenge_type: type,
    level_id: scope.active_level_id,
    group_id: scope.active_group_id,
    unit_id: unit.id,
    title: titleForType(type, unit.name),
    description: descriptionForType(type),
    source: 'personalized',
    target_count: targetCount,
    passing_score: passingScore,
    reward_xp: rewardForType(type),
    content_config: {
      personalization: 'weakness_first',
      active_level_id: scope.active_level_id,
      active_group_id: scope.active_group_id,
      unit_id: unit.id
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
