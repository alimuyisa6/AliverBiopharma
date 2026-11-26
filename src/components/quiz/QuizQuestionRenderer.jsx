import { useEffect, useState } from 'react';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';
import { UI } from '../../design-system';

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
    <div className={`${UI.card} w-full overflow-hidden lg:p-8`}>
      <div className="mb-5 flex flex-wrap items-center gap-2 border-b border-border pb-4 sm:mb-7 sm:gap-3">
        <span className={UI.quizMetaBadge}><Icon name="file-lines" /> Question</span>
        <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary-800">{type.replaceAll('_', ' ')}</span>
        <button type="button" className={`${UI.quizMarkButton} ${marked ? UI.quizMarkButtonActive : UI.quizMarkButtonInactive}`} onClick={onToggleMark} aria-pressed={Boolean(marked)}><Icon name="flag" /> {marked ? 'Marked for review' : 'Mark for review'}</button>
      </div>
      <h3 className={UI.quizQuestionTitle}>{question.question_text}</h3>

      {type === 'essay' && (
        <div className="space-y-4">
          {question.question_data?.instructions && (
            <p className="rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm leading-6 text-primary-950 sm:p-5 sm:text-base">{question.question_data.instructions}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className={UI.quizMetaBadge}><Icon name="clipboard-check" /> {Number(question.question_data?.max_marks) || 10} marks</span>
            {minWords > 0 && <span className={UI.quizMetaBadge}>Minimum {minWords} words</span>}
            {maxWords > 0 && <span className={UI.quizMetaBadge}>Maximum {maxWords} words</span>}
          </div>
          <label className={UI.fieldLabel} htmlFor={`quiz-essay-${question.id}`}>Your written response</label>
          <textarea
            id={`quiz-essay-${question.id}`}
            value={draft}
            disabled={disabled || Boolean(answer)}
            onChange={(event) => setDraft(event.target.value)}
            rows={9}
            maxLength={20000}
            placeholder="Write your answer clearly, explaining the key points..."
           className={`${UI.inputBase} min-h-52 resize-y py-3.5 leading-7`} />
          <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm text-slate-500"><strong className="text-slate-700">{wordCount}</strong> words</span>
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
            <div className={`${UI.status.warning} flex items-start gap-3 text-sm leading-6`}>
              <Icon name="clock" /> Submitted for teacher marking. Your result will be available after review.
            </div>
          )}
        </div>
      )}

      {type === 'multiple_select' && (
        <div className="grid gap-3 sm:gap-3.5" role="group" aria-label="Choose all correct answers">
          {optionRows.map((option) => (
            <label key={option.id} className={`${UI.quizOption} cursor-pointer p-4 focus-within:ring-2 focus-within:ring-primary-200 ${draft.includes(option.id) ? UI.quizOptionSelected : UI.quizOptionInactive}`}>
              <input type="checkbox" checked={draft.includes(option.id)} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft((current) => event.target.checked ? [...current, option.id] : current.filter((item) => item !== option.id))}  className="h-4 w-4 shrink-0 accent-primary-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-700" />
              <span className="min-w-0 flex-1 leading-6">{option.label}</span>
            </label>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !draft.length}>Check answer</Button>}
        </div>
      )}

      {type === 'true_false' && (
        <div className="grid gap-3">
          {[true, false].map((choice) => (
            <button key={String(choice)} type="button" className={`${UI.quizOption} p-4 ${draft === choice ? UI.quizOptionSelected : UI.quizOptionInactive}`} disabled={disabled || Boolean(answer)} onClick={() => setDraft(choice)}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-extrabold text-primary-800">{choice ? 'T' : 'F'}</span>
              <span className="min-w-0 flex-1 leading-6">{choice ? 'True' : 'False'}</span>
            </button>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || typeof draft !== 'boolean'}>Check answer</Button>}
        </div>
      )}

      {['short_answer', 'fill_blank', 'numerical'].includes(type) && (
        <div className="grid max-w-2xl gap-3">
          <label className={UI.fieldLabel} htmlFor={`quiz-answer-${question.id}`}>{type === 'numerical' ? 'Enter your numerical answer' : 'Enter your answer'}</label>
          <input id={`quiz-answer-${question.id}`} type={type === 'numerical' ? 'number' : 'text'} inputMode={type === 'numerical' ? 'decimal' : 'text'} value={draft} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft(event.target.value)} placeholder={type === 'numerical' ? 'Your answer' : 'Type your answer here'}  className={`${UI.inputBase} leading-6`} />
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !String(draft).trim()}>Check answer</Button>}
        </div>
      )}

      {type === 'dropdown' && (
        <div className="grid max-w-2xl gap-3">
          <label className={UI.fieldLabel} htmlFor={`quiz-answer-${question.id}`}>Choose the best answer</label>
          <select id={`quiz-answer-${question.id}`} value={draft} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft(event.target.value)} className={UI.selectBase}>
            <option value="">Select an answer</option>
            {optionRows.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
          </select>
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !draft}>Check answer</Button>}
        </div>
      )}

      {['single_choice', ''].includes(type) && (
        <div className="grid gap-3">
          {['A', 'B', 'C', 'D'].map((option) => {
            const selected = answer?.selected;
            const correctOption = answer?.correct_option;
            const stateClass = answer ? option === correctOption ? 'correct' : option === selected ? 'incorrect' : '' : '';
            return (
              <button key={option} type="button" className={`${UI.quizOption} p-4 ${stateClass === 'correct' ? UI.quizOptionCorrect : stateClass === 'incorrect' ? UI.quizOptionIncorrect : UI.quizOptionInactive}`} onClick={() => onSubmit(option)} disabled={disabled || Boolean(answer)}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-sm font-extrabold text-primary-800">{option}</span>
                <span className="min-w-0 flex-1 leading-6">{question[`option_${option.toLowerCase()}`]}</span>
              </button>
            );
          })}
        </div>
      )}

      {answer && answer.user_answer_text && type !== 'essay' && (
        <div className={`${answer.correct ? UI.status.success : UI.status.warning} mt-4 flex items-start gap-3 text-sm leading-6`}>
          <Icon name={answer.correct ? 'circle-check' : 'circle-xmark'} />
          <span>{answer.correct ? 'Correct' : 'Answer recorded'}{answer.user_answer_text ? ` · ${answer.user_answer_text}` : ''}</span>
        </div>
      )}
    </div>
  );
}
