/* components/Flashcardprogress.jsx */
import Icon from './Icon/Icon';
import Button from './Button/Button';
import { useNavigate } from 'react-router-dom';

export default function FlashcardProgress({ result, onRestart, onHome }) {
  const navigate = useNavigate();
  const { total = 0, correct = 0, incorrect = 0, score = 0, activity_outcome = 'unscored', deck_complete = false, recommendation = null } = result || {};

  function scoreClass() {
    if (activity_outcome === 'mastered') return 'is-high';
    if (activity_outcome === 'low') return 'is-low';
    return '';
  }

  function message() {
    if (!deck_complete || activity_outcome === 'incomplete') return 'You ended this session before reviewing the full deck. Continue when you are ready.';
    if (activity_outcome === 'mastered') return 'You met the configured mastery threshold.';
    if (activity_outcome === 'low') return 'Your result suggests reviewing the learning material before another attempt.';
    if (activity_outcome === 'developing') return 'You are making progress. A short review and another practice attempt can help.';
    return 'Session saved. Continue with another learning activity.';
  }

  return (
    <div className="flashcard-progress">
      <div className="section fcd-empty">
        <div className="card card-amber card-surface-solid card-tone-warning card-elevation-raised fcp-card">
          <Icon name="trophy" className="fcp-trophy" />
          <h2>Session Complete</h2>
          <p className="fcp-message">{message()}</p>

          {recommendation && (
            <div className="fcp-recommendation" aria-live="polite">
              <h3>{recommendation.title}</h3>
              <p>{recommendation.message}</p>
              <Button variant="secondary" onClick={() => navigate(recommendation.route || '/resources')}>
                {recommendation.label || 'Continue learning'}
              </Button>
            </div>
          )}

          <div className="fcp-stats-row">
            <div>
              <div className={`fcp-stat-value is-score ${scoreClass()}`}>{score}%</div>
              <div className="fcp-stat-label">Score</div>
            </div>
            <div>
              <div className="fcp-stat-value is-correct">{correct}</div>
              <div className="fcp-stat-label">Correct</div>
            </div>
            <div>
              <div className="fcp-stat-value is-missed">{incorrect}</div>
              <div className="fcp-stat-label">Missed</div>
            </div>
          </div>

          <div className="fcp-actions-row">
            <Button onClick={onRestart} icon="rotate-right">Study Again</Button>
            <Button variant="secondary" onClick={onHome} icon="home">Home</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
