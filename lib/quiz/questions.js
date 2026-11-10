/* lib/quiz/questions.js */
import { supabase } from '../core.js';
import {
  requireAdmin,
  SecurityError
} from '../security-middleware.js';
import crypto from 'crypto';

export async function addQuestionsBatch(body, res, ctx) {
  requireAdmin(ctx);

  const { unit_id, questions } = body;

  if (!unit_id || !Array.isArray(questions) || !questions.length) {
    throw new SecurityError('unit_id and questions array required', 400);
  }

  const { data: unit } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('id', unit_id)
    .maybeSingle();

  if (!unit) throw new SecurityError('Curriculum unit not found', 404);

  const prepared = [];

  for (const question of questions) {
    const normalized = normalizeQuestionPayload(question);

    if (normalized.error) {
      throw new SecurityError(normalized.error, 400);
    }

    const duplicateWarning = await detectDuplicateQuestion(unit_id, normalized.payload);

    prepared.push({
      ...normalized.payload,
      duplicate_warning: duplicateWarning
    });
  }

  const rows = prepared.map((item) => ({
    unit_id,
    question_text: item.question_text,
    option_a: item.option_a || '',
    option_b: item.option_b || '',
    option_c: item.option_c || '',
    option_d: item.option_d || '',
    correct_option: item.correct_option || 'A',
    question_type: item.question_type,
    question_data: item.question_data,
    answer_key: item.answer_key,
    explanation: item.explanation || '',
    difficulty: item.difficulty || 'medium',
    image_url: item.image_url || null,
    image_alt_text: item.image_alt_text || null,
    concept_id: item.concept_id || null,
    concept_name: item.concept_name || null,
    subtopic: item.subtopic || null,
    learning_objective: item.learning_objective || null,
    status: 'draft',
    version: 1,
    content_hash: item.content_hash
  }));

  const { data: inserted, error } = await supabase
    .from('quiz_questions')
    .insert(rows)
    .select('id, status, version, content_hash');

  if (error) throw new SecurityError('Failed to add questions', 500);

  return res.status(200).json({
    success: true,
    inserted: inserted || [],
    duplicate_warnings: prepared.map((item) => item.duplicate_warning).filter(Boolean)
  });
}

export async function createQuestionRevision(questionId, updatedQuestion) {
  const normalized = normalizeQuestionPayload(updatedQuestion);

  if (normalized.error) {
    throw new SecurityError(normalized.error, 400);
  }

  const { data: current } = await supabase
    .from('quiz_questions')
    .select('version, content_hash')
    .eq('id', questionId)
    .maybeSingle();

  if (!current) throw new SecurityError('Question not found', 404);

  const nextVersion = Number(current.version || 1) + 1;
  const contentHash = hashQuestionPayload(normalized.payload);

  await supabase.from('quiz_question_revisions').insert({
    question_id: questionId,
    version: nextVersion,
    question_text: normalized.payload.question_text,
    option_a: normalized.payload.option_a || '',
    option_b: normalized.payload.option_b || '',
    option_c: normalized.payload.option_c || '',
    option_d: normalized.payload.option_d || '',
    correct_option: normalized.payload.correct_option || 'A',
    question_type: normalized.payload.question_type,
    question_data: normalized.payload.question_data,
    answer_key: normalized.payload.answer_key,
    explanation: normalized.payload.explanation || null,
    difficulty: normalized.payload.difficulty || 'medium',
    image_url: normalized.payload.image_url || null,
    content_hash: contentHash
  });

  return { version: nextVersion, content_hash: contentHash };
}

function normalizeQuestionPayload(question) {
  if (!question?.question_text?.trim()) return { error: 'question_text is required' };

  const questionType = question.question_type || 'single_choice';
  const supportedTypes = ['single_choice', 'multiple_select', 'true_false', 'short_answer', 'fill_blank', 'dropdown', 'numerical'];
  if (!supportedTypes.includes(questionType)) return { error: 'Unsupported question_type' };

  const difficulty = question.difficulty || 'medium';
  if (!['easy', 'medium', 'hard'].includes(difficulty)) return { error: 'difficulty must be easy, medium, or hard' };

  const questionData = question.question_data && typeof question.question_data === 'object' && !Array.isArray(question.question_data) ? question.question_data : {};
  const answerKey = question.answer_key && typeof question.answer_key === 'object' && !Array.isArray(question.answer_key) ? question.answer_key : {};
  const optionValues = ['A', 'B', 'C', 'D'].map((letter) => String(question[`option_${letter.toLowerCase()}`] || '').trim());
  let correctOption = String(question.correct_option || '').trim().toUpperCase();
  let normalizedData = { ...questionData };
  let normalizedKey = { ...answerKey };

  if (questionType === 'single_choice') {
    if (optionValues.some((option) => !option)) return { error: 'All four options are required for single-choice questions' };
    if (!['A', 'B', 'C', 'D'].includes(correctOption)) return { error: 'correct_option must be A, B, C, or D' };
  } else if (questionType === 'multiple_select') {
    const options = Array.isArray(questionData.options) ? questionData.options : [];
    const correct = Array.isArray(answerKey.correct_answers) ? answerKey.correct_answers.map(String) : [];
    const ids = options.map((option) => String(typeof option === 'object' ? option.id : option));
    if (options.length < 2 || ids.some((id) => !id || id === 'undefined')) return { error: 'multiple_select requires at least two options with IDs and labels' };
    if (!correct.length || correct.some((id) => !ids.includes(id))) return { error: 'answer_key.correct_answers must contain valid option IDs' };
    normalizedData = { ...questionData, options: options.map((option) => typeof option === 'object' ? { id: String(option.id), label: String(option.label || '').trim() } : { id: String(option), label: String(option) }) };
    normalizedKey = { ...answerKey, correct_answers: [...new Set(correct)] };
  } else if (questionType === 'true_false') {
    if (typeof answerKey.correct_answer !== 'boolean') return { error: 'true_false requires answer_key.correct_answer as a boolean' };
  } else if (questionType === 'short_answer' || questionType === 'fill_blank') {
    const accepted = Array.isArray(answerKey.accepted_answers) ? answerKey.accepted_answers : [answerKey.correct_answer].filter((value) => value !== undefined);
    if (!accepted.length || accepted.some((value) => !String(value).trim())) return { error: 'Provide answer_key.correct_answer or accepted_answers' };
    normalizedKey = { ...answerKey, accepted_answers: accepted.map((value) => String(value).trim()) };
  } else if (questionType === 'dropdown') {
    const options = Array.isArray(questionData.options) ? questionData.options : [];
    const ids = options.map((option) => String(typeof option === 'object' ? option.id : option));
    const correct = String(answerKey.correct_answer || '');
    if (options.length < 2 || !ids.includes(correct)) return { error: 'dropdown requires at least two options and a valid answer_key.correct_answer' };
    normalizedData = { ...questionData, options: options.map((option) => typeof option === 'object' ? { id: String(option.id), label: String(option.label || '').trim() } : { id: String(option), label: String(option) }) };
  } else if (questionType === 'numerical') {
    if (answerKey.correct_answer === undefined || !Number.isFinite(Number(answerKey.correct_answer))) return { error: 'numerical requires a numeric answer_key.correct_answer' };
    if (answerKey.tolerance !== undefined && (!Number.isFinite(Number(answerKey.tolerance)) || Number(answerKey.tolerance) < 0)) return { error: 'numerical tolerance must be a non-negative number' };
    normalizedKey = { ...answerKey, correct_answer: Number(answerKey.correct_answer), tolerance: Math.max(0, Number(answerKey.tolerance) || 0) };
  }

  const payload = {
    question_text: question.question_text.trim(),
    option_a: optionValues[0],
    option_b: optionValues[1],
    option_c: optionValues[2],
    option_d: optionValues[3],
    correct_option: correctOption || 'A',
    question_type: questionType,
    question_data: normalizedData,
    answer_key: normalizedKey,
    explanation: question.explanation?.trim() || null,
    difficulty,
    image_url: question.image_url || null,
    image_alt_text: question.image_alt_text || null,
    concept_id: question.concept_id || null,
    concept_name: question.concept_name || null,
    subtopic: question.subtopic || null,
    learning_objective: question.learning_objective || null,
    content_hash: hashQuestionPayload({ ...question, question_type: questionType, question_data: normalizedData, answer_key: normalizedKey })
  };

  return { payload };
}

function hashQuestionPayload(question) {
  const content = [
    question.question_text,
    question.option_a,
    question.option_b,
    question.option_c,
    question.option_d,
    question.correct_option,
    question.question_type || 'single_choice',
    JSON.stringify(question.question_data || {}),
    JSON.stringify(question.answer_key || {})
  ]
    .map((item) => String(item || '').trim().toLowerCase())
    .join('|');

  return crypto.createHash('sha256').update(content).digest('hex');
}

async function detectDuplicateQuestion(unitId, question) {
  const { data } = await supabase
    .from('quiz_questions')
    .select('id, content_hash')
    .eq('unit_id', unitId)
    .eq('content_hash', question.content_hash)
    .maybeSingle();

  return data?.id || null;
}
