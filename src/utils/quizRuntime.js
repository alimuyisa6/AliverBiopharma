// Browser-only helpers used by the quiz experience.
let quizAudioContext = null;

// Prepare audio on the learner's tap to respect mobile autoplay restrictions.
export function prepareQuizAnswerAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!quizAudioContext || quizAudioContext.state === 'closed') {
      quizAudioContext = new AudioContextClass();
    }
    if (quizAudioContext.state === 'suspended') {
      quizAudioContext.resume().catch(() => {});
    }
  } catch {
    // Audio is optional and must never interrupt quiz progress.
  }
}

export function playQuizAnswerSound(isCorrect) {
  try {
    const audio = quizAudioContext;
    if (!audio || audio.state === 'closed') return;

    const play = () => {
      const now = audio.currentTime;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.connect(audio.destination);

      const notes = isCorrect
        ? [{ frequency: 660, start: 0, duration: 0.12 }, { frequency: 880, start: 0.11, duration: 0.17 }]
        : [{ frequency: 300, start: 0, duration: 0.15 }, { frequency: 220, start: 0.13, duration: 0.18 }];

      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = audio.createOscillator();
        const noteStart = now + start;
        oscillator.type = isCorrect ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        oscillator.connect(gain);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(isCorrect ? 0.12 : 0.09, noteStart + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.02);
      });
    };

    if (audio.state === 'suspended') {
      audio.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Audio must never interrupt answer verification or quiz progression.
  }
}

export function formatQuizRetryTime(retryAt) {
  if (!retryAt) return 'Retry later';
  const remaining = new Date(retryAt).getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Retry';
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? 'Retry in ' + hours + 'h ' + minutes + 'm' : 'Retry in ' + minutes + 'm';
}

export function createIdempotencyKey(prefix = 'quiz') {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}
