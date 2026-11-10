import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getQuizAttempt } from '../api/client';
import Card from '../components/Card/Card';
import Button from '../components/Button/Button';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import '../styles/quiz-attempt-result.css';

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
      <main className="quiz-attempt-result-page">
        <Card className="quiz-attempt-result-empty">
          <Icon name="circle-exclamation" />
          <h1>Assessment unavailable</h1>
          <p>{error || 'We could not find this assessment.'}</p>
          <Link to="/quiz"><Button variant="primary">Back to quizzes</Button></Link>
        </Card>
      </main>
    );
  }

  const pending = attempt.status === 'pending_review';
  const essays = (attempt.answers || []).filter((answer) => answer.question_type === 'essay');
  const maxMarks = (attempt.answers || []).reduce((sum, answer) => sum + (Number(answer.max_marks) || 1), 0);

  return (
    <main className="quiz-attempt-result-page">
      <div className="quiz-attempt-result-shell">
        <header className="quiz-attempt-result-header">
          <span className="quiz-attempt-result-eyebrow"><Icon name="clipboard-check" /> Assessment report</span>
          <h1>{pending ? 'Your assessment is being marked' : 'Your assessment result'}</h1>
          <p>Review your submitted answers, awarded marks and teacher feedback.</p>
        </header>

        <Card className={`quiz-attempt-result-summary ${pending ? 'is-pending' : attempt.passed ? 'is-passed' : 'is-failed'}`}>
          {pending ? (
            <div className="quiz-attempt-pending">
              <Icon name="clock" />
              <div>
                <strong>Awaiting teacher marking</strong>
                <p>{essays.length} written response{essays.length === 1 ? '' : 's'} still require review. This page checks for updates automatically.</p>
              </div>
            </div>
          ) : (
            <>
              <span className="quiz-attempt-result-status">{attempt.passed ? 'Passed' : 'Assessment complete'}</span>
              <strong className="quiz-attempt-result-percentage">{Number(attempt.percentage || 0).toFixed(1)}%</strong>
              <span>{attempt.score}/{maxMarks} marks awarded</span>
            </>
          )}
        </Card>

        <section className="quiz-attempt-answer-list">
          <h2>Answer review</h2>
          {(attempt.answers || []).map((answer, index) => (
            <Card key={answer.question_id || index} className="quiz-attempt-answer-card">
              <div className="quiz-attempt-answer-topline">
                <span>Question {index + 1}</span>
                {answer.question_type === 'essay' ? (
                  <span className={`quiz-attempt-answer-badge ${answer.review_status === 'pending_review' ? 'is-pending' : 'is-graded'}`}>
                    {answer.review_status === 'pending_review' ? 'Awaiting marking' : 'Marked'}
                  </span>
                ) : (
                  <span className={`quiz-attempt-answer-badge ${answer.correct ? 'is-graded' : 'is-failed'}`}>
                    {answer.correct ? 'Correct' : 'Incorrect'}
                  </span>
                )}
              </div>
              <h3>{answer.question_text || 'Question'}</h3>
              <span className="quiz-attempt-answer-label">Your answer</span>
              <div className="quiz-attempt-answer-text">{answer.user_answer_text || 'No response'}</div>

              {answer.question_type === 'essay' ? (
                <>
                  {answer.review_status === 'graded' && (
                    <div className="quiz-attempt-awarded-marks">
                      <strong>{answer.marks_awarded}/{answer.max_marks}</strong>
                      <span>Marks awarded</span>
                    </div>
                  )}
                  {answer.teacher_feedback && (
                    <div className="quiz-attempt-teacher-feedback">
                      <span className="quiz-attempt-answer-label"><Icon name="comment" /> Teacher feedback</span>
                      <p>{answer.teacher_feedback}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {!answer.correct_answer_text ? null : (
                    <div className="quiz-attempt-correct-answer">
                      <span className="quiz-attempt-answer-label">Correct answer</span>
                      <p>{answer.correct_answer_text}</p>
                    </div>
                  )}
                  {answer.explanation && <p className="quiz-attempt-explanation">{answer.explanation}</p>}
                </>
              )}
            </Card>
          ))}
        </section>

        <div className="quiz-attempt-result-actions">
          <Link to="/quiz"><Button variant="secondary">Back to quizzes</Button></Link>
          <Button variant="primary" onClick={loadAttempt}><Icon name="clock" /> Refresh result</Button>
        </div>
      </div>
    </main>
  );
}
