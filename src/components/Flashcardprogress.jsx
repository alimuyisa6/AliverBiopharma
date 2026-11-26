/* components/Flashcardprogress.jsx */
import Icon from './Icon/Icon';
import Button from './Button/Button';
import { useNavigate } from 'react-router-dom';
import { UI } from '../design-system';

export default function FlashcardProgress({ result, onRestart, onHome }) {
  const navigate = useNavigate();
  const { correct = 0, incorrect = 0, score = 0, activity_outcome = 'unscored', deck_complete = false, recommendation = null } = result || {};

  function scoreClass() {
    if (activity_outcome === 'mastered') return 'text-emerald-700';
    if (activity_outcome === 'low') return 'text-amber-700';
    return 'text-primary-800';
  }

  function message() {
    if (!deck_complete || activity_outcome === 'incomplete') return 'You ended this session before reviewing the full deck. Continue when you are ready.';
    if (activity_outcome === 'mastered') return 'You met the configured mastery threshold.';
    if (activity_outcome === 'low') return 'Your result suggests reviewing the learning material before another attempt.';
    if (activity_outcome === 'developing') return 'You are making progress. A short review and another practice attempt can help.';
    return 'Session saved. Continue with another learning activity.';
  }

  return (
    <div className="w-full">
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl items-center justify-center px-4 py-10">
        <div className={`${UI.card} w-full rounded-3xl p-6 text-center shadow-lg sm:p-8`}>
          <Icon name="trophy" className="mx-auto mb-4 h-12 w-12 text-amber-500" />
          <h2 className="text-2xl font-extrabold leading-tight text-primary-950 sm:text-3xl">Session Complete</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-600">{message()}</p>

          {recommendation && (
            <div className="mt-6 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 text-left" aria-live="polite">
              <h3 className="text-lg font-bold leading-7 text-primary-950">{recommendation.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{recommendation.message}</p>
              <Button variant="secondary" onClick={() => navigate(recommendation.route || '/resources')}>
                {recommendation.label || 'Continue learning'}
              </Button>
            </div>
          )}

          <div className="mt-7 grid grid-cols-3 gap-3">
            <div>
              <div className={`text-2xl font-extrabold leading-none sm:text-3xl ${scoreClass()}`}>{score}%</div>
              <div className="mt-2 text-xs font-semibold text-slate-500">Score</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold leading-none text-emerald-700 sm:text-3xl">{correct}</div>
              <div className="mt-2 text-xs font-semibold text-slate-500">Correct</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold leading-none text-amber-700 sm:text-3xl">{incorrect}</div>
              <div className="mt-2 text-xs font-semibold text-slate-500">Missed</div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button onClick={onRestart} icon="rotate-right">Study Again</Button>
            <Button variant="secondary" onClick={onHome} icon="home">Home</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
