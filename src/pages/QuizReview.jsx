import { useCallback, useEffect, useMemo, useState } from 'react';
import { getQuizReviewQueue, gradeQuizSubmission } from '../api/client';
import Button from '../components/Button/Button';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

export default function QuizReview() {
  const addToast = useToast();
  const [submissions, setSubmissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [marks, setMarks] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const selected = useMemo(
    () => submissions.find((item) => item.id === selectedId) || submissions[0] || null,
    [submissions, selectedId]
  );

  const loadQueue = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getQuizReviewQueue();
      const rows = data?.submissions || [];
      setSubmissions(rows);
      setSelectedId((current) => rows.some((row) => row.id === current) ? current : rows[0]?.id || null);
    } catch (err) {
      setError(err.message || 'You do not have permission to review these submissions.');
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    if (!selected) {
      setMarks('');
      setFeedback('');
      return;
    }
    setMarks('');
    setFeedback('');
  }, [selected?.id]);

  const submitGrade = async (event) => {
    event.preventDefault();
    if (!selected || saving) return;

    const value = Number(marks);
    const maximum = Number(selected.max_marks) || 10;
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      addToast(`Enter a mark between 0 and ${maximum}.`, 'error');
      return;
    }

    setSaving(true);
    try {
      const result = await gradeQuizSubmission(selected.id, value, feedback);
      addToast(
        result?.attempt?.pending_review
          ? 'Mark saved. Other essay responses in this assessment are still awaiting review.'
          : 'Essay marked and the learner’s final assessment result is ready.',
        'success'
      );
      setSubmissions((current) => current.filter((item) => item.id !== selected.id));
      setSelectedId((current) => current === selected.id
        ? (submissions.find((item) => item.id !== current)?.id || null)
        : current);
    } catch (err) {
      addToast(err.message || 'Unable to save this mark.', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <main className="min-h-screen w-full bg-background text-foreground"><div className={`${UI.container} py-8`}><PageSkeleton /></div></main>;

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className={`${UI.container} py-8 lg:px-8`}>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
          <PageHeader title="Essay marking" subtitle="Review written responses, award marks and provide useful feedback to learners." className="mb-0" />
          <div className="mb-8 inline-flex items-center gap-3 rounded-xl bg-secondary-50 px-4 py-3 text-secondary-900">
            <strong className="text-2xl font-extrabold">{submissions.length}</strong>
            <span className="text-sm font-semibold">Awaiting review</span>
          </div>
        </div>

        {error ? (
          <EmptyState icon="lock" title="Reviewer access required" description={error} />
        ) : !submissions.length ? (
          <EmptyState
            icon="circle-check"
            title="All caught up"
            description="There are no essay responses waiting for your review."
            action={<Button variant="secondary" onClick={loadQueue}>Refresh queue</Button>}
          />
        ) : (
          <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.5fr)]">
            <aside className={`${UI.card} h-fit`} aria-labelledby="quiz-review-queue-title">
              <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
                <h2 id="quiz-review-queue-title" className="text-lg font-bold text-primary-950">Submission queue</h2>
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">{submissions.length}</span>
              </div>
              <div className="grid gap-2">
                {submissions.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className={`flex min-w-0 items-start gap-3 rounded-xl border p-3 text-left transition ${selected?.id === item.id ? 'border-primary-300 bg-primary-50' : 'border-border bg-white hover:bg-slate-50'}`}
                    onClick={() => setSelectedId(item.id)}
                    aria-pressed={selected?.id === item.id}
                  >
                    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700"><Icon name="file-lines" /></span>
                    <span className="min-w-0 flex-1">
                      <strong className="block break-words text-sm font-bold text-primary-950">{item.learner_name}</strong>
                      <small className="mt-1 block break-words text-xs leading-5 text-muted">{item.unit_name}</small>
                      <small className="block text-xs leading-5 text-muted">Essay response · {item.max_marks} marks</small>
                    </span>
                    <Icon name="chevron-right" className="mt-1 h-4 w-4 shrink-0 text-muted" />
                  </button>
                ))}
              </div>
            </aside>

            {selected && (
              <section className="grid min-w-0 gap-5" aria-label="Selected essay submission">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800"><Icon name="graduation-cap" /> {selected.learner_name}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary-50 px-3 py-1.5 text-xs font-semibold text-primary-800"><Icon name="book-open" /> {selected.unit_name}</span>
                  <span className="inline-flex items-center gap-2 rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-semibold text-secondary-900"><Icon name="list-check" /> Assessment {Number(selected.attempt?.block_number || 0) + 1}</span>
                </div>

                <article className={UI.card}>
                  <span className={UI.quizKicker}>Question</span>
                  <h2 className="mt-2 text-xl font-bold leading-8 text-primary-950">{selected.question_snapshot?.question_text || 'Essay question'}</h2>
                  {selected.question_snapshot?.question_data?.instructions && (
                    <p className="mt-4 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm leading-6 text-primary-950">{selected.question_snapshot.question_data.instructions}</p>
                  )}
                  {selected.rubric && (
                    <div className="mt-5 border-t border-border pt-4">
                      <span className={UI.quizKicker}>Marking guidance</span>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{selected.rubric}</p>
                    </div>
                  )}
                  {Array.isArray(selected.grading_criteria) && selected.grading_criteria.length > 0 && (
                    <div className="mt-5 border-t border-border pt-4">
                      <span className={UI.quizKicker}>Assessment criteria</span>
                      <div className="mt-3 grid gap-2">
                        {selected.grading_criteria.map((criterion, index) => (
                          <div key={index} className="flex items-start justify-between gap-4 rounded-lg bg-slate-50 p-3 text-sm">
                            <span className="text-slate-700">{criterion.criterion}</span>
                            <strong className="shrink-0 text-primary-900">{criterion.marks} marks</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="mt-5 border-t border-border pt-4">
                    <span className={UI.quizKicker}>Learner response</span>
                    <div className="mt-2 whitespace-pre-wrap break-words rounded-xl bg-slate-50 p-4 text-sm leading-7 text-slate-800">
                      {typeof selected.selected_answer === 'string'
                        ? selected.selected_answer
                        : JSON.stringify(selected.selected_answer ?? 'No response')}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-xs font-semibold text-muted">
                      <span>{String(selected.selected_answer || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                      <span>Maximum {selected.max_marks} marks</span>
                    </div>
                  </div>
                </article>

                <form className="grid gap-4 border-t border-border pt-6" onSubmit={submitGrade}>
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <span className={UI.quizKicker}>Your assessment</span>
                      <h2 className="mt-1 text-xl font-bold text-primary-950">Mark this response</h2>
                    </div>
                    <strong className="text-2xl font-extrabold text-primary-900">/ {selected.max_marks}</strong>
                  </div>
                  <div className="grid max-w-2xl gap-2">
                    <label className={UI.fieldLabel} htmlFor="quiz-review-marks">Marks awarded</label>
                    <input
                      id="quiz-review-marks"
                      type="number"
                      min="0"
                      max={selected.max_marks}
                      step="0.5"
                      value={marks}
                      onChange={(event) => setMarks(event.target.value)}
                      className={`${UI.inputBase} leading-6`}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <label className={UI.fieldLabel} htmlFor="quiz-review-feedback">Feedback for the learner</label>
                    <textarea
                      id="quiz-review-feedback"
                      value={feedback}
                      onChange={(event) => setFeedback(event.target.value)}
                      className={`${UI.inputBase} min-h-32 resize-y text-sm leading-6`}
                      rows={5}
                      maxLength={5000}
                      placeholder="Explain what was done well and what could be improved..."
                    />
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
                    <span className="text-xs font-semibold text-muted">{feedback.length}/5000 characters</span>
                    <Button type="submit" variant="primary" disabled={saving || marks === ''}>
                      <Icon name={saving ? 'spinner' : 'check'} />
                      {saving ? 'Saving mark…' : 'Save mark'}
                    </Button>
                  </div>
                </form>
              </section>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
