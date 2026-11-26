import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Spinner from '../../components/Spinner/Spinner';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import { UI } from '../../design-system';
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
          throw new Error('No quiz challenge is available right now. Please return to the challenges page and try again.');
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
          setError(err?.message || "We couldn't open this quiz challenge. Please try again.");
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
      setError(err?.message || "We couldn't submit your answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={UI.quizPage}>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner context="brand" size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={UI.quizPage}>
        <section className={UI.quizPanel}>
          <Icon name="alert-circle" />
          <span className={UI.quizKicker}>Quiz practice</span>
          <h1 className={UI.pageTitleHeading}>We couldn’t open your quiz challenge</h1>
          <p className="text-muted">{error}</p>
          <button className={UI.secondaryButton} onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  if (!currentQuestion && !result) {
    return (
      <div className={UI.quizPage}>
        <section className={UI.quizPanel}>
          <span className={UI.quizKicker}>Quiz practice</span>
          <h1 className={UI.pageTitleHeading}>Your quiz challenge isn’t ready yet</h1>
          <p className="text-muted">This quiz challenge is still being prepared. Return to the challenge centre and try again later.</p>
          <button className={UI.secondaryButton} onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className={UI.quizPage}>
        <section className={UI.quizCompletionPanel}>
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-sm font-semibold text-primary-800">
            <Icon name="clipboard-check" /> Quiz Challenge
          </span>
          <Icon
            name={result?.passed ? 'trophy' : 'book-open'}
            className="h-14 w-14 text-primary-700"
          />
          <span className={UI.quizKicker}>Challenge complete</span>
          <h1 className={UI.pageTitleHeading}>{result?.passed ? 'Well done!' : 'Challenge completed'}</h1>
          <div className={UI.quizScore}>
            {Number(result?.score ?? session?.score ?? 0)}%
          </div>
          <p>
            {result?.passed
              ? `You earned +${result?.reward_xp ?? challenge?.reward_xp ?? 0} XP.`
              : 'Keep practising and use your next challenge to strengthen this area.'}
          </p>
          <button className={UI.primaryButton} onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className={UI.quizPage}>
      <section className={UI.quizMainPanel}>
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Challenges', href: '/challenges' },
            { label: 'Quiz Challenge' },
          ]}
        />
        <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <span className={UI.quizKicker}>Quiz practice</span>
            <h1 className={UI.pageTitleHeading}>{challenge?.title || 'Quiz practice'}</h1>
            {challenge?.description && <p className={UI.quizDescription}>{challenge.description}</p>}
          </div>
          <button
            className={UI.secondaryButton}
            type="button"
            onClick={() => navigate('/challenges')}
          >
            Exit
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 text-sm font-medium text-muted" aria-label={`${answeredCount} of ${questions.length} answered`}>
          <div className={UI.quizProgressTrack}>
            <span className={UI.quizProgressFill} style={{ width: `${progress}%` }} />
          </div>
          <span>{answeredCount} / {questions.length}</span>
        </div>

        <article className={UI.quizQuestionPanel}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
            <span className="font-semibold">Question {currentIndex + 1} of {questions.length}</span>
            {currentQuestion.difficulty && <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize text-slate-700">{currentQuestion.difficulty}</span>}
          </div>

          <h2 className="text-xl font-semibold leading-relaxed text-primary-950 sm:text-2xl">{currentQuestion.question_text}</h2>

          <div className="mt-6 grid gap-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const selected = answers[currentQuestion.id] === option;

              return (
                <button
                  key={option}
                  type="button"
                  className={`${UI.quizOption} ${selected ? UI.quizOptionSelected : UI.quizOptionInactive}`}
                  disabled={submitting || Boolean(answers[currentQuestion.id])}
                  onClick={() => selectAnswer(option)}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-bold ${selected ? "bg-primary-100 text-primary-800" : "bg-slate-100 text-slate-600"}`}>{option}</span>
                  <span className="min-w-0 flex-1 leading-6">{currentQuestion[`option_${option.toLowerCase()}`]}</span>
                </button>
              );
            })}
          </div>
        </article>

        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            className={UI.secondaryButton}
            type="button"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-primary-800">{challenge?.reward_xp ? `+${challenge.reward_xp} XP` : 'Challenge reward'}</span>
          <button
            className={UI.secondaryButton}
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
    </div>
  );
}
