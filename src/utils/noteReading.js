export function normalizeNoteReactions(data) {
  return {
    counts: data?.counts || {},
    user: Array.isArray(data?.user_reactions) ? data.user_reactions : []
  };
}

export function calculateReadingPercentage(scrollTop, documentHeight) {
  return documentHeight > 0
    ? Math.round((scrollTop / documentHeight) * 100)
    : 0;
}

export function isReadingProgressComplete(progress) {
  return progress?.completed === true
    && Number(progress.scroll_percentage) >= 90
    && Number(progress.time_spent) >= 30;
}
