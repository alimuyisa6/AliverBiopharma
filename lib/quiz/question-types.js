const normalizeText = (value, caseSensitive = false) => {
  const text = String(value ?? '').trim().replace(/\s+/g, ' ');
  return caseSensitive ? text : text.toLocaleLowerCase();
};

const normalizeSet = (value) => {
  const values = Array.isArray(value) ? value : [value];
  return [...new Set(values.map((item) => String(item ?? '').trim()).filter(Boolean))].sort();
};

export function gradeQuestionAnswer(question, submittedValue) {
  const type = question?.question_type || 'single_choice';
  const key = question?.answer_key && typeof question.answer_key === 'object'
    ? question.answer_key
    : {};

  if (type === 'essay') {
    const response = String(submittedValue ?? '').trim();
    return {
      correct: null,
      selected: response,
      correctOption: null,
      userAnswerText: response || 'No response',
      correctAnswerText: null
    };
  }

  if (type === 'single_choice') {
    const selected = String(
      submittedValue && typeof submittedValue === 'object'
        ? submittedValue.option ?? submittedValue.selected ?? ''
        : submittedValue ?? ''
    ).trim().toUpperCase();
    const correctOption = String(question?.correct_option || key.correct_option || '').trim().toUpperCase();
    const correctKey = `option_${correctOption.toLowerCase()}`;
    return {
      correct: ['A', 'B', 'C', 'D'].includes(correctOption) && selected === correctOption,
      selected,
      correctOption,
      userAnswerText: question?.[`option_${selected.toLowerCase()}`] || selected || 'No answer',
      correctAnswerText: question?.[correctKey] || correctOption || 'Not configured'
    };
  }

  if (type === 'multiple_select') {
    const selected = normalizeSet(submittedValue);
    const correct = normalizeSet(key.correct_answers || []);
    const isCorrect = correct.length > 0 && selected.length === correct.length && selected.every((value, index) => value === correct[index]);
    const labels = question?.question_data?.options || [];
    const labelFor = (id) => labels.find((option) => String(option.id) === id)?.label || id;
    return {
      correct: isCorrect,
      selected,
      correctOption: null,
      userAnswerText: selected.length ? selected.map(labelFor).join(', ') : 'No answer',
      correctAnswerText: correct.map(labelFor).join(', ') || 'Not configured'
    };
  }

  if (type === 'true_false') {
    const selected = String(submittedValue).toLowerCase() === 'true';
    const correct = key.correct_answer === true || String(key.correct_answer).toLowerCase() === 'true';
    return {
      correct: selected === correct,
      selected,
      correctOption: null,
      userAnswerText: submittedValue === undefined || submittedValue === null ? 'No answer' : selected ? 'True' : 'False',
      correctAnswerText: correct ? 'True' : 'False'
    };
  }

  if (type === 'short_answer' || type === 'fill_blank' || type === 'dropdown') {
    const selected = String(submittedValue ?? '').trim();
    const accepted = Array.isArray(key.accepted_answers)
      ? key.accepted_answers
      : [key.correct_answer ?? ''];
    const caseSensitive = key.case_sensitive === true;
    const normalized = normalizeText(selected, caseSensitive);
    const correct = accepted.some((answer) => normalizeText(answer, caseSensitive) === normalized);
    return {
      correct: Boolean(selected) && correct,
      selected,
      correctOption: null,
      userAnswerText: selected || 'No answer',
      correctAnswerText: accepted.filter(Boolean).join(' / ') || 'Not configured'
    };
  }

  if (type === 'numerical') {
    const selected = Number(submittedValue);
    const correct = Number(key.correct_answer);
    const tolerance = Math.max(0, Number(key.tolerance) || 0);
    const valid = String(submittedValue ?? '').trim() !== '' && Number.isFinite(selected) && Number.isFinite(correct);
    return {
      correct: valid && Math.abs(selected - correct) <= tolerance,
      selected: submittedValue,
      correctOption: null,
      userAnswerText: String(submittedValue ?? '').trim() || 'No answer',
      correctAnswerText: Number.isFinite(correct) ? String(correct) : 'Not configured'
    };
  }

  return {
    correct: false,
    selected: submittedValue ?? null,
    correctOption: null,
    userAnswerText: String(submittedValue ?? '').trim() || 'No answer',
    correctAnswerText: 'Question type is not supported'
  };
}
