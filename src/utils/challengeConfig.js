export const challengeMeta = {
  recall: { label: 'Recall practice', route: '/challenges/recall', icon: 'brain', accent: 'cyan', animation: 'recall' },
  flashcards: { label: 'Flashcard practice', route: '/challenges/flashcards', icon: 'layers', accent: 'mint', animation: 'flashcards' },
  quiz: { label: 'Quiz practice', route: '/challenges/quiz', icon: 'clipboard-check', accent: 'blue', animation: 'quiz' }
};

export function getChallengeMeta(type) {
  return challengeMeta[type] || challengeMeta.quiz;
}

export function getChallengeProgress(challenge) {
  const targetCount = Number(challenge.target_count ?? challenge.target ?? 0);
  return targetCount ? Math.min(100, (challenge.progress / targetCount) * 100) : 0;
}

export function isChallengeCompleted(challenge) {
  return challenge.passed === true || challenge.status === 'completed';
}
