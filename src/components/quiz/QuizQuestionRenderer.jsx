import { useState } from 'react';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';

export default function QuizQuestionRenderer({ question, answer, disabled, onSubmit }) {
  const type = question.question_type || 'single_choice';
  const options = Array.isArray(question.question_data?.options) ? question.question_data.options : [];
  const [draft, setDraft] = useState(type === 'multiple_select' ? [] : '');

  const submit = () => {
    if (type === 'true_false') {
      if (typeof draft !== 'boolean') return;
    } else if (Array.isArray(draft) ? !draft.length : !String(draft).trim()) {
      return;
    }
    onSubmit(draft);
  };

  const optionRows = options.map((option) => ({
    id: String(typeof option === 'object' ? option.id : option),
    label: typeof option === 'object' ? option.label : option
  }));

  return (
    <div className="quiz-question-content">
      <div className="quiz-question-kicker">
        <span><Icon name="file-lines" plain /> Question</span>
        <span className="quiz-question-type">{type.replaceAll('_', ' ')}</span>
      </div>
      <h3 className="quiz-question-heading">{question.question_text}</h3>

      {type === 'multiple_select' && (
        <div className="quiz-options-list" role="group" aria-label="Choose all correct answers">
          {optionRows.map((option) => (
            <label key={option.id} className={`quiz-option-btn quiz-option-selectable${draft.includes(option.id) ? ' selected' : ''}`}>
              <input type="checkbox" checked={draft.includes(option.id)} disabled={disabled || Boolean(answer)} onChange={(event) => setDraft((current) => event.target.checked ? [...current, option.id] : current.filter((item) => item !== option.id))} />
              <span className="quiz-option-text">{option.label}</span>
            </label>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || !draft.length}>Check answer</Button>}
        </div>
      )}

      {type === 'true_false' && (
        <div className="quiz-options-list">
          {[true, false].map((choice) => (
            <button key={String(choice)} type="button" className={`quiz-option-btn${draft === choice ? ' selected' : ''}`} disabled={disabled || Boolean(answer)} onClick={() => setDraft(choice)}>
              <span className="quiz-option-letter">{choice ? 'T' : 'F'}</span>
              <span className="quiz-option-text">{choice ? 'True' : 'False'}</span>
            </button>
          ))}
          {!answer && <Button variant="primary" onClick={submit} disabled={disabled || typeof draft !== 'boolean'}>Check answer</Button>}
        </div>
      )}

      {['short_answer', 'fill_blank', 'numerical'].includes(type) && (
        <div className="quiz-typed-answer">
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
              <button key={option} type="button" className={`quiz-option-btn ${stateClass}`} onClick={() => onSubmit(option)} disabled={disabled || Boolean(answer)}>
                <span className="quiz-option-letter">{option}</span>
                <span className="quiz-option-text">{question[`option_${option.toLowerCase()}`]}</span>
              </button>
            );
          })}
        </div>
      )}

      {answer && answer.user_answer_text && (
        <div className={`quiz-answer-feedback ${answer.correct ? 'is-correct' : 'is-incorrect'}`}>
          <Icon name={answer.correct ? 'circle-check' : 'circle-xmark'} plain />
          <span>{answer.correct ? 'Correct' : 'Answer recorded'}{answer.user_answer_text ? ` · ${answer.user_answer_text}` : ''}</span>
        </div>
      )}
    </div>
  );
}
