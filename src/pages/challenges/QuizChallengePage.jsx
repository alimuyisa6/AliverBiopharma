import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Spinner from '../../components/Spinner/Spinner';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
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
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Spinner context="brand" size="lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Icon name="alert-circle" />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Quiz practice</span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">We couldn’t open your quiz challenge</h1>
          <p className="text-slate-600 dark:text-slate-300">{error}</p>
          <button className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  if (!currentQuestion && !result) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Quiz practice</span>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Your quiz challenge isn’t ready yet</h1>
          <p className="text-slate-600 dark:text-slate-300">This quiz challenge is still being prepared. Return to the challenge centre and try again later.</p>
          <button className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800" onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
        <section className="mx-auto flex max-w-2xl flex-col items-center gap-5 rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1.5 text-sm font-semibold text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
            <Icon name="clipboard-check" /> Quiz Challenge
          </span>
          <Icon
            name={result?.passed ? 'trophy' : 'book-open'}
            className="h-14 w-14 text-blue-600 dark:text-blue-400"
          />
          <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Challenge complete</span>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{result?.passed ? 'Well done!' : 'Challenge completed'}</h1>
          <div className="rounded-2xl bg-blue-50 px-6 py-3 text-4xl font-extrabold text-blue-700 dark:bg-blue-950/50 dark:text-blue-300">
            {Number(result?.score ?? session?.score ?? 0)}%
          </div>
          <p>
            {result?.passed
              ? `You earned +${result?.reward_xp ?? challenge?.reward_xp ?? 0} XP.`
              : 'Keep practising and use your next challenge to strengthen this area.'}
          </p>
          <button className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700" onClick={() => navigate('/challenges')}>
            Back to challenges
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-slate-950 dark:text-slate-100 sm:px-6">
      <section className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
        <Breadcrumb
          className="mb-4"
          items={[
            { label: 'Challenges', href: '/challenges' },
            { label: 'Quiz Challenge' },
          ]}
        />
        <div className="mb-6 flex flex-col justify-between gap-5 sm:flex-row sm:items-start">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Quiz practice</span>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{challenge?.title || 'Quiz practice'}</h1>
            {challenge?.description && <p className="mt-2 max-w-2xl text-slate-600 dark:text-slate-300">{challenge.description}</p>}
          </div>
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            onClick={() => navigate('/challenges')}
          >
            Exit
          </button>
        </div>

        <div className="mb-6 flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300" aria-label={`${answeredCount} of ${questions.length} answered`}>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <span className="block h-full rounded-full bg-primary-700 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>
          <span>{answeredCount} / {questions.length}</span>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800/60 sm:p-7">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-semibold">Question {currentIndex + 1} of {questions.length}</span>
            {currentQuestion.difficulty && <span className="rounded-full bg-slate-100 px-2.5 py-1 capitalize dark:bg-slate-700">{currentQuestion.difficulty}</span>}
          </div>

          <h2 className="text-xl font-semibold leading-relaxed text-slate-900 dark:text-white sm:text-2xl">{currentQuestion.question_text}</h2>

          <div className="mt-6 grid gap-3">
            {['A', 'B', 'C', 'D'].map((option) => {
              const selected = answers[currentQuestion.id] === option;

              return (
                <button
                  key={option}
                  type="button"
                  className={`flex min-h-16 w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-semibold leading-6 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-100 disabled:cursor-not-allowed disabled:opacity-70 ${selected ? 'border-primary-400 bg-primary-50 text-primary-950 ring-1 ring-primary-200' : 'border-slate-200 bg-white text-slate-800 hover:border-primary-300 hover:bg-primary-50/50'}`}
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
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
            type="button"
            disabled={currentIndex === 0 || submitting}
            onClick={() => setCurrentIndex((index) => index - 1)}
          >
            Previous
          </button>
          <span className="text-sm font-semibold text-primary-700">{challenge?.reward_xp ? `+${challenge.reward_xp} XP` : 'Challenge reward'}</span>
          <button
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
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
