import { supabase } from './core.js';

/**
 * Classify an activity using the centralized threshold table. The SQL function
 * is the source of truth; the fallback reads the same rows for resilience.
 */
export async function classifyActivityOutcome(activityType, isComplete, outcomePercent) {
  const { data, error } = await supabase.rpc('classify_activity_outcome', {
    p_activity_type: activityType,
    p_is_complete: Boolean(isComplete),
    p_outcome_percent: outcomePercent === null || outcomePercent === undefined
      ? null
      : Number(outcomePercent)
  });

  if (!error && data) return data;

  const { data: rows, error: thresholdError } = await supabase
    .from('learning_thresholds')
    .select('threshold_key, threshold_value')
    .eq('activity_type', activityType);

  if (thresholdError) {
    console.error('[ACTIVITY_OUTCOME_CLASSIFICATION_ERROR]', JSON.stringify({
      activity_type: activityType,
      rpc_error: error?.message || null,
      threshold_error: thresholdError.message
    }));
    throw new Error('Unable to classify learning activity outcome');
  }

  const thresholds = new Map((rows || []).map((row) => [row.threshold_key, Number(row.threshold_value)]));
  if (!isComplete) return 'incomplete';
  if (outcomePercent === null || outcomePercent === undefined || !Number.isFinite(Number(outcomePercent))) return 'unscored';

  const score = Number(outcomePercent);
  const masteryKey = activityType === 'quiz' ? 'pass_percent' : 'mastery_percent';
  const masteryThreshold = thresholds.get(masteryKey);
  const lowThreshold = thresholds.get('low_percent');
  if (masteryThreshold === undefined || lowThreshold === undefined) {
    throw new Error(`Missing ${activityType} recommendation thresholds`);
  }
  if (score >= masteryThreshold) return activityType === 'quiz' ? 'passed' : 'mastered';
  if (score < lowThreshold) return 'low';
  return 'developing';
}

export function buildActivityRecommendation({
  activityType,
  outcome,
  sourceNoteId = null
}) {
  const noteRoute = sourceNoteId
    ? `/notes/read?note_id=${encodeURIComponent(sourceNoteId)}`
    : null;

  if (outcome === 'low') {
    return {
      type: 'review_note',
      title: 'Review before trying again',
      message: 'Your result suggests revisiting the learning material before another attempt.',
      label: noteRoute ? 'Review this note' : 'Browse learning resources',
      route: noteRoute || '/resources',
      source_note_id: sourceNoteId
    };
  }

  if (outcome === 'passed' || outcome === 'mastered') {
    return {
      type: 'continue_learning',
      title: 'Keep building on this progress',
      message: activityType === 'quiz'
        ? 'You met the configured pass threshold. Continue with related reading or another activity.'
        : 'You met the configured mastery threshold. Continue with related reading or another activity.',
      label: noteRoute ? 'Continue from this note' : 'Explore learning resources',
      route: noteRoute || '/resources',
      source_note_id: sourceNoteId
    };
  }

  if (outcome === 'incomplete' || outcome === 'unscored') {
    return {
      type: 'continue_learning',
      title: 'Continue your revision',
      message: 'This session did not produce a complete scored result. Continue practising when ready.',
      label: noteRoute ? 'Return to this note' : 'Browse learning resources',
      route: noteRoute || '/resources',
      source_note_id: sourceNoteId
    };
  }

  return {
    type: 'targeted_practice',
    title: 'Strengthen your understanding',
    message: 'You are making progress. A short review followed by another practice attempt can help.',
    label: noteRoute ? 'Review this note' : 'Browse learning resources',
    route: noteRoute || '/resources',
    source_note_id: sourceNoteId
  };
}
