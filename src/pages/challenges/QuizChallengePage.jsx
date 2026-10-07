import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Spinner from '../../components/Spinner/Spinner';
import {
  getPersonalizedDailyChallenge,
  startQuizChallenge,
  getQuizChallengeSession,
  submitQuizChallengeAnswer,
  completeQuizChallenge
} from '../../api/client';

function createIdempotencyKey(prefix = 'quiz-challenge') {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

export default function QuizChallengePage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedChallengeId = params.get('challenge_id');

  const [challenge, setChallenge] = useState(null);
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function openChallenge() {
      try {
        setLoading(true);
        setError('');

        let challengeId = requestedChallengeId;
        let challengeData = null;

        if (!challengeId) {
          challengeData = await getPersonalizedDailyChallenge();
          challengeId = challengeData?.challenge?.id || null;
        }

        if (!challengeId) {
          throw new Error('No Quiz Challenge is currently available.');
        }

        if (challengeData?.challenge) {
          setChallenge(challengeData.challenge);
        }

        const started = await startQuizChallenge(
          challengeId,
          createIdempotencyKey('start')
        );

        const sessionData = await getQuizChallengeSession(started.session_id);

        if (cancelled) return;

        setSession(sessionData);
        setAnswers(
          Object.fromEntries(
            (sessionData.questions || [])
              .filter((question) => question.answer_state)
              .map((question) => [
                question.id,
                question.answer_state.selected_option
              ])
          )
        );
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || 'Unable to open this Quiz Challenge.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    openChallenge();

    return () => {
      cancelled = true;
    };
  }, [requestedChallengeId]);

  const questions = session?.questions || [];
  const currentQuestion = questions[currentIndex] || null;
  const answeredCount = session?.answered_count ?? Object.keys(answers).length;
  const isComplete = result || session?.status === 'completed';

  const progress = useMemo(() => {
    if (!questions.length) return 0;
    return Math.round((answeredCount / questions.length) * 100);
  }, [answeredCount, questions.length]);

  async function selectAnswer(option) {
    if (!currentQuestion || submitting || answers[currentQuestion.id]) return;

    setSubmitting(true);

    try {
      const response = await submitQuizChallengeAnswer(
        session.session_id,
        currentQuestion.id,
        option,
        createIdempotencyKey('answer')
      );

      setAnswers((previous) => ({
        ...previous,
        [currentQuestion.id]: option
      }));

      setSession((previous) => ({
        ...previous,
        answered_count: response.answered_count
      }));

      if (response.complete) {
        const completion = await completeQuizChallenge(
          session.session_id,
          createIdempotencyKey('complete')
        );

        setResult(completion);
        setSession((previous) => ({
          ...previous,
          status: 'completed',
          score: completion.score,
          answered_count: completion.progress
        }));
      } else {
        setCurrentIndex((index) =>
          Math.min(index + 1, questions.length - 1)
        );
      }
    } catch (err) {
      setError(err?.message || 'Unable to submit that answer.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="quiz-challenge-page">
        <div className="fcd-loading-wrap">
          <Spinner context="brand" size="lg" />
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="quiz-challenge-page">
        <section className="section quiz-challenge-state">
          <Icon name="alert-circle" />
          <span className="eyebrow">Quiz Challenge</span>
          <h1>We could not open this challenge</h1>
          <p>{error}</p>
          <button className="btn btn-secondary" onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </main>
    );
  }

  if (!currentQuestion && !result) {
    return (
      <main className="quiz-challenge-page">
        <section className="section quiz-challenge-state">
          <span className="eyebrow">Quiz Challenge</span>
          <h1>No questions are available</h1>
          <p>This challenge does not currently have enough dedicated challenge content.</p>
          <button className="btn btn-secondary" onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </main>
    );
  }

  if (isComplete) {
    return (
      <main className="quiz-challenge-page">
        <section className="section quiz-challenge-result">
          <span className="challenge-type-badge">
            <Icon name="clipboard-check" /> Quiz Challenge
          </span>
          <Icon
            name={result?.passed ? 'trophy' : 'book-open'}
            className="quiz-challenge-result-icon"
          />
          <span className="eyebrow">Challenge complete</span>
          <h1>{result?.passed ? 'Mission complete!' : 'Challenge completed'}</h1>
          <div className="quiz-challenge-score">
            {Number(result?.score ?? session?.score ?? 0)}%
          </div>
          <p>
            {result?.passed
              ? `You earned +${result?.reward_xp ?? challenge?.reward_xp ?? 0} XP.`
              : 'Keep practising and use your next challenge to strengthen this area.'}
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/challenges')}>
            Back to challenge centre
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="quiz-challenge-page">
      <section className="section quiz-challenge-shell">
        <div className="quiz-challenge-header">
          <div>
            <span className="eyebrow">Dedicated Quiz Challenge</span>
            <h1>{challenge?.title || 'Quiz Challenge'}</h1>
            {challenge?.description && <p>{challenge.description}</p>}
          </div>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate('/challenges')}
          >
            Exit
          </button>
        </div>

        <div className="quiz-challenge-progress" aria-label={`${answeredCount} of ${questions.length} answered`}>
          <div className="quiz-challenge-progress-bar">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span>{answeredCount} / {questions.length}</span>
        </div>

        <article className="quiz-challenge-question">
          <div className="quiz-challenge-question-meta">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            {currentQuestion.difficulty && <span>{currentQuestion.difficulty}</span>}
          </div>

          <h2>{currentQuestion.question_text}</h2>

          <div className="quiz-challenge-options">
            {['A', 'B', 'C', 'D'].map((option) => {
              const selected = answers[currentQuestion.id] === option;

              return (
                <button
                  key={option}
                  type="button"
                  className={`quiz-challenge-option ${selected ? 'is-selected' : ''}`}
                  disabled={submitting || Boolean(answers[currentQuestion.id])}
                  onClick={() => selectAnswer(option)}
                >
                  <span className="quiz-challenge-option-letter">{option}</span>
                  <span>{currentQuestion[`option_${option.toLowerCase()}`]}</span>
                </button>
              );
            })}
          </div>
        </article>

        <div className="quiz-challenge-navigation">
          <button
            className="btn btn-secondary"
            type="button"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            Previous
          </button>
          <span>{challenge?.reward_xp ? `+${challenge.reward_xp} XP` : 'Challenge reward'}</span>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={
              currentIndex >= questions.length - 1 ||
              submitting ||
              !answers[currentQuestion.id]
            }
            onClick={() => setCurrentIndex((index) => index + 1)}
          >
            Next
          </button>
        </div>
      </section>
    </main>
  );
}
