import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuizAttempt } from '../api/client';
import Button from '../components/Button/Button';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

export default function QuizAttemptResult() {
  const { attemptId } = useParams();
  const [attempt, setAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAttempt = useCallback(async () => {
    try {
      const data = await getQuizAttempt(attemptId);
      setAttempt(data || null);
      setError('');
    } catch (err) {
      setError(err.message || 'Unable to load this assessment result.');
    } finally {
      setLoading(false);
    }
  }, [attemptId]);

  useEffect(() => {
    loadAttempt();
  }, [loadAttempt]);

  useEffect(() => {
    if (!attempt || attempt.status !== 'pending_review') return undefined;
    const interval = setInterval(loadAttempt, 20000);
    return () => clearInterval(interval);
  }, [attempt?.status, loadAttempt]);

  if (loading) return <PageSkeleton />;

  if (error || !attempt) {
    return (
      <main className="min-h-screen bg-background py-10">
        <div className={UI.container}>
          <EmptyState
            icon="alert-circle"
            title="Assessment unavailable"
            description={error || 'We could not find this assessment.'}
            action={<Link to="/quiz"><Button variant="primary">Back to quizzes</Button></Link>}
          />
        </div>
      </main>
    );
  }

  const pending = attempt.status === 'pending_review';
  const essays = (attempt.answers || []).filter((answer) => answer.question_type === 'essay');
  const maxMarks = Number(attempt.max_marks_total) || (attempt.answers || []).reduce((sum, answer) => sum + (Number(answer.max_marks) || 1), 0);
  const marksAwarded = Number(attempt.marks_awarded_total ?? attempt.score) || 0;

  return (
    <main className="min-h-screen bg-background">
      <div className={`${UI.container} py-8 lg:px-8`}>
        <PageHeader
          title={pending ? 'Your assessment is being marked' : 'Your assessment result'}
          subtitle="Review your submitted answers, awarded marks and teacher feedback."
        />

        <section className={`${UI.card} mb-8 ${pending ? 'border-amber-200 bg-amber-50' : attempt.passed ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}`}>
          {pending ? (
            <div className="flex items-start gap-3">
              <Icon name="clock" className="mt-1 h-6 w-6 shrink-0 text-amber-700" />
              <div>
                <strong className="text-primary-950">Awaiting teacher marking</strong>
                <p className="mt-2 text-sm leading-6 text-muted">{essays.length} written response{essays.length === 1 ? '' : 's'} still require review. This page checks for updates automatically.</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${attempt.passed ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>{attempt.passed ? 'Passed' : 'Assessment complete'}</span>
                <strong className="mt-3 block text-4xl font-extrabold leading-none text-primary-950">{Number(attempt.percentage || 0).toFixed(1)}%</strong>
                <span className="mt-2 block text-sm font-semibold text-muted">{marksAwarded}/{maxMarks} marks awarded</span>
              </div>
              <Icon name={attempt.passed ? 'trophy' : 'book-open'} className="h-12 w-12 text-primary-700" />
            </div>
          )}
        </section>

        <section className="grid gap-5" aria-labelledby="quiz-answer-review-title">
          <h2 id="quiz-answer-review-title" className={UI.sectionHeadingTitle}>Answer review</h2>
          {(attempt.answers || []).map((answer, index) => (
            <article key={answer.question_id || index} className={UI.card}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
                <span className="text-sm font-bold text-muted">Question {index + 1}</span>
                {answer.question_type === 'essay' ? (
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${answer.review_status === 'pending_review' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-900'}`}>
                    {answer.review_status === 'pending_review' ? 'Awaiting marking' : 'Marked'}
                  </span>
                ) : (
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${answer.correct ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                    {answer.correct ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold leading-7 text-primary-950">{answer.question_text || 'Question'}</h3>
              <span className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted">Your answer</span>
              <div className="mt-2 rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-800">{answer.user_answer_text || 'No response'}</div>

              {answer.question_type === 'essay' ? (
                <>
                  {answer.review_status === 'graded' && (
                    <div className="mt-4 flex items-center gap-3">
                      <strong className="text-xl font-extrabold text-primary-900">{answer.marks_awarded}/{answer.max_marks}</strong>
                      <span className="text-sm font-semibold text-muted">Marks awarded</span>
                    </div>
                  )}
                  {answer.teacher_feedback && (
                    <div className="mt-4 rounded-xl border border-secondary-200 bg-secondary-50 p-4">
                      <span className="inline-flex items-center gap-2 text-sm font-bold text-secondary-900"><Icon name="comment" /> Teacher feedback</span>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{answer.teacher_feedback}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {answer.correct_answer_text && (
                    <div className="mt-4">
                      <span className="text-xs font-bold uppercase tracking-wide text-muted">Correct answer</span>
                      <p className="mt-1 text-sm leading-6 text-primary-900">{answer.correct_answer_text}</p>
                    </div>
                  )}
                  {answer.explanation && <p className="mt-4 text-sm leading-6 text-muted">{answer.explanation}</p>}
                </>
              )}
            </article>
          ))}
        </section>

        <div className="mt-8 flex flex-wrap items-center gap-3 border-t border-border pt-6">
          <Link to="/quiz"><Button variant="secondary">Back to quizzes</Button></Link>
          <Button variant="primary" onClick={loadAttempt}><Icon name="clock" /> Refresh result</Button>
        </div>
      </div>
    </main>
  );
}
