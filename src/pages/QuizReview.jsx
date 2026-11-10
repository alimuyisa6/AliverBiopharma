import { useCallback, useEffect, useMemo, useState } from 'react';
import { getQuizReviewQueue, gradeQuizSubmission } from '../api/client';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import '../styles/quiz-review.css';

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

  if (loading) return <PageSkeleton />;

  return (
    <main className="quiz-review-page">
      <section className="quiz-review-shell">
        <header className="quiz-review-hero">
          <div>
            <span className="quiz-review-eyebrow"><Icon name="clipboard-check" /> Assessment review</span>
            <h1>Essay marking</h1>
            <p>Review written responses, award marks and provide useful feedback to learners.</p>
          </div>
          <div className="quiz-review-count">
            <strong>{submissions.length}</strong>
            <span>Awaiting review</span>
          </div>
        </header>

        {error ? (
          <Card className="quiz-review-access-error">
            <EmptyState
              icon="lock"
              title="Reviewer access required"
              description={error}
            />
          </Card>
        ) : !submissions.length ? (
          <Card className="quiz-review-empty">
            <EmptyState
              icon="circle-check"
              title="All caught up"
              description="There are no essay responses waiting for your review."
              action={<Button variant="secondary" onClick={loadQueue}>Refresh queue</Button>}
            />
          </Card>
        ) : (
          <div className="quiz-review-workspace">
            <aside className="quiz-review-inbox">
              <div className="quiz-review-inbox-heading">
                <h2>Submission queue</h2>
                <span>{submissions.length}</span>
              </div>
              {submissions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={`quiz-review-inbox-item ${selected?.id === item.id ? 'is-active' : ''}`}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className="quiz-review-inbox-icon"><Icon name="file-lines" /></span>
                  <span className="quiz-review-inbox-copy">
                    <strong>{item.learner_name}</strong>
                    <small>{item.unit_name}</small>
                    <small>Question {item.question_id} · {item.max_marks} marks</small>
                  </span>
                  <Icon name="chevron-right" />
                </button>
              ))}
            </aside>

            {selected && (
              <section className="quiz-review-detail">
                <div className="quiz-review-detail-meta">
                  <span><Icon name="graduation-cap" /> {selected.learner_name}</span>
                  <span><Icon name="book-open" /> {selected.unit_name}</span>
                  <span><Icon name="list-check" /> Assessment {Number(selected.attempt?.block_number || 0) + 1}</span>
                </div>
                <Card className="quiz-review-question-card">
                  <span className="quiz-review-section-label">Question</span>
                  <h2>{selected.question_snapshot?.question_text || 'Essay question'}</h2>
                  {selected.question_snapshot?.question_data?.instructions && (
                    <p className="quiz-review-instructions">{selected.question_snapshot.question_data.instructions}</p>
                  )}
                  {selected.rubric && (
                    <div className="quiz-review-rubric">
                      <span className="quiz-review-section-label">Marking guidance</span>
                      <p>{selected.rubric}</p>
                    </div>
                  )}
                  {Array.isArray(selected.grading_criteria) && selected.grading_criteria.length > 0 && (
                    <div className="quiz-review-criteria">
                      <span className="quiz-review-section-label">Assessment criteria</span>
                      {selected.grading_criteria.map((criterion, index) => (
                        <div key={index}>
                          <span>{criterion.criterion}</span>
                          <strong>{criterion.marks} marks</strong>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="quiz-review-section-label quiz-review-response-label">Learner response</div>
                  <div className="quiz-review-response">
                    {typeof selected.selected_answer === 'string'
                      ? selected.selected_answer
                      : JSON.stringify(selected.selected_answer ?? 'No response')}
                  </div>
                  <div className="quiz-review-response-meta">
                    <span>{String(selected.selected_answer || '').trim().split(/\s+/).filter(Boolean).length} words</span>
                    <span>Maximum {selected.max_marks} marks</span>
                  </div>
                </Card>

                <form className="quiz-review-marking-form" onSubmit={submitGrade}>
                  <div className="quiz-review-form-heading">
                    <div>
                      <span className="quiz-review-section-label">Your assessment</span>
                      <h2>Mark this response</h2>
                    </div>
                    <div className="quiz-review-mark-total">/ {selected.max_marks}</div>
                  </div>
                  <label htmlFor="quiz-review-marks">Marks awarded</label>
                  <input
                    id="quiz-review-marks"
                    type="number"
                    min="0"
                    max={selected.max_marks}
                    step="0.5"
                    value={marks}
                    onChange={(event) => setMarks(event.target.value)}
                    required
                  />
                  <label htmlFor="quiz-review-feedback">Feedback for the learner</label>
                  <textarea
                    id="quiz-review-feedback"
                    value={feedback}
                    onChange={(event) => setFeedback(event.target.value)}
                    rows={5}
                    maxLength={5000}
                    placeholder="Explain what was done well and what could be improved..."
                  />
                  <div className="quiz-review-form-footer">
                    <span>{feedback.length}/5000 characters</span>
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
      </section>
    </main>
  );
}
