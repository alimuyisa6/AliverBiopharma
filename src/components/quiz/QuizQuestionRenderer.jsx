import { useEffect, useState } from 'react';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';

export default function QuizQuestionRenderer({ question, answer, disabled, marked, onToggleMark, onSubmit }) {
  const type = question.question_type || 'single_choice';
  const options = Array.isArray(question.question_data?.options) ? question.question_data.options : [];
  const [draft, setDraft] = useState(type === 'multiple_select' ? [] : '');

  useEffect(() => {
    setDraft(answer?.selected ?? (type === 'multiple_select' ? [] : ''));
  }, [question.id, answer?.selected, type]);

  const submit = () => {
    if (type === 'true_false') {
      if (typeof draft !== 'boolean') return;
    } else if (Array.isArray(draft) ? !draft.length : !String(draft).trim()) {
      return;
    }
    onSubmit(draft);
  };

  const wordCount = String(draft || '').trim() ? String(draft).trim().split(/\\s+/).length : 0;
  const minWords = Math.max(0, Number(question.question_data?.min_words) || 0);
  const maxWords = Math.max(0, Number(question.question_data?.max_words) || 0);

  const optionRows = options.map((option) => ({
    id: String(typeof option === 'object' ? option.id : option),
    label: typeof option === 'object' ? option.label : option
  }));

  return (
    <div className="w-full rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
      <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-border pb-4 text-sm font-semibold text-slate-600">
        <span><Icon name="file-lines" /> Question</span>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-800">{type.replaceAll('_', ' ')}</span>
        <button type="button" className={`ml-auto inline-flex min-h-9 items-center gap-2 rounded-lg border px-3 py-2 text-xs font-bold ${marked ? "border-secondary-300 bg-secondary-50 text-secondary-900" : "border-border bg-white text-slate-700 hover:bg-background"}`} onClick={onToggleMark} aria-pressed={Boolean(marked)}><Icon name="flag" /> {marked ? 'Marked for review' : 'Mark for review'}</button>
      </div>
      <h3 className="mb-6 text-xl font-bold leading-relaxed text-primary-950 sm:text-2xl">{question.question_text}</h3>

      {type === 'essay' && (
        <div className="space-y-4">
          {question.question_data?.instructions && (
            <p className="rounded-xl bg-primary-50 p-4 text-sm leading-6 text-primary-900">{question.question_data.instructions}</p>
          )}
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span><Icon name="clipboard-check" /> {Number(question.question_data?.max_marks) || 10} marks</span>
            {minWords > 0 && <span>Minimum {minWords} words</span>}
            {maxWords > 0 && <span>Maximum {maxWords} words</span>}
          </div>
          <label htmlFor={`quiz-essay-${question.id}`}>Your written response</label>
          <textarea
            id={`quiz-essay-${question.id}`}
            value={draft}
            disabled={disabled || Boolean(answer)}
            onChange={(event) => setDraft(event.target.value)}
            rows={9}
            maxLength={20000}
            placeholder="Write your answer clearly, explaining the key points..."
          />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
            <span>{wordCount} words</span>
            {!answer && (
              <Button
                variant="primary"
                onClick={submit}
                disabled={disabled || !String(draft).trim() || (minWords > 0 && wordCount < minWords) || (maxWords > 0 && wordCount > maxWords)}
              >
                <Icon name="paper-plane" /> Submit response
              </Button>
            )}
          </div>
          {answer && (
            <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-900">
              <Icon name="clock" /> Submitted for teacher marking. Your result will be available after review.
            </div>
          )}
        </div>
      )}

      {type === 'multiple_select' && (
        <div className="grid gap-3" role="group" aria-label="Choose all correct answers">
          {optionRows.map((option) => (
            <label key={option.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-4 text-left text-sm font-semibold transition ${draft.includes(option.id) ? "border-primary-500 bg-primary-50 text-primary-950" : "border-border bg-white text-slate-800 hover:border-primary-300 hover:bg-background"}`}>
              <input type="checkbox" checked={draft.includes(option.id)} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft((current) => event.target.checked ? [...current, option.id] : current.filter((item) => item !== option.id))} />
              <span className="min-w-0 flex-1 leading-6">{option.label}</span>
            </label>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !draft.length}>Check answer</Button>}
        </div>
      )}

      {type === 'true_false' && (
        <div className="quiz-options-list">
          {[true, false].map((choice) => (
            <button key={String(choice)} type="button" className={`flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left font-semibold transition ${draft === choice ? "border-primary-500 bg-primary-50 text-primary-950" : "border-border bg-white text-slate-800 hover:border-primary-300"}`} disabled={disabled || Boolean(answer)} onClick={() => setDraft(choice)}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-extrabold text-primary-800">{choice ? 'T' : 'F'}</span>
              <span className="quiz-option-text">{choice ? 'True' : 'False'}</span>
            </button>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || typeof draft !== 'boolean'}>Check answer</Button>}
        </div>
      )}

      {['short_answer', 'fill_blank', 'numerical'].includes(type) && (
        <div className="grid max-w-2xl gap-3">
          <label htmlFor={`quiz-answer-${question.id}`}>{type === 'numerical' ? 'Enter your numerical answer' : 'Enter your answer'}</label>
          <input id={`quiz-answer-${question.id}`} type={type === 'numerical' ? 'number' : 'text'} inputMode={type === 'numerical' ? 'decimal' : 'text'} value={draft} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft(event.target.value)} placeholder={type === 'numerical' ? 'Your answer' : 'Type your answer here'} />
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !String(draft).trim()}>Check answer</Button>}
        </div>
      )}

      {type === 'dropdown' && (
        <div className="quiz-typed-answer">
          <label htmlFor={`quiz-answer-${question.id}`}>Choose the best answer</label>
          <select id={`quiz-answer-${question.id}`} value={draft} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft(event.target.value)}>
            <option value="">Select an answer</option>
            {optionRows.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !draft}>Check answer</Button>}
        </div>
      )}

      {['single_choice', ''].includes(type) && (
        <div className="quiz-options-list">
          {['A', 'B', 'C', 'D'].map((option) => {
            const selected = answer?.selected;
            const correctOption = answer?.correct_option;
            const stateClass = answer ? option === correctOption ? 'correct' : option === selected ? 'incorrect' : '' : '';
            return (
              <button key={option} type="button" className={`flex min-h-14 items-center gap-3 rounded-xl border p-4 text-left font-semibold transition disabled:cursor-not-allowed ${stateClass === "correct" ? "border-green-300 bg-green-50 text-green-950" : stateClass === "incorrect" ? "border-red-300 bg-red-50 text-red-950" : "border-border bg-white text-slate-800 hover:border-primary-300"}`} onClick={() => onSubmit(option)} disabled={disabled || Boolean(answer)}>
                <span className="quiz-option-letter">{option}</span>
                <span className="quiz-option-text">{question[`option_${option.toLowerCase()}`]}</span>
              </button>
            );
          })}
        </div>
      )}

      {answer && answer.user_answer_text && type !== 'essay' && (
        <div className={`quiz-answer-feedback ${answer.correct ? 'is-correct' : 'is-incorrect'}`}>
          <Icon name={answer.correct ? 'circle-check' : 'circle-xmark'} />
          <span>{answer.correct ? 'Correct' : 'Answer recorded'}{answer.user_answer_text ? ` · ${answer.user_answer_text}` : ''}</span>
        </div>
      )}
    </div>
  );
}
