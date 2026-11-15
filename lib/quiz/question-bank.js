import { supabase } from '../core.js';
import { requireAuth, SecurityError } from '../security-middleware.js';
import { getUserCurriculumScope } from '../curriculum.js';

const QUESTION_FIELDS = 'id,question_text,option_a,option_b,option_c,option_d,difficulty,question_type,question_data,explanation,image_url,image_alt_text,concept_id,concept_name,subtopic,learning_objective,unit_id,created_at';

async function getQuestionScope(userId) {
  const scope = await getUserCurriculumScope(userId);
  if (!scope?.active_group_id) throw new SecurityError('Your curriculum context is not set.', 403);
  return scope;
}

export async function searchQuestionBank(req, res, ctx) {
  requireAuth(ctx);
  const scope = await getQuestionScope(ctx.userId);
  const search = String(req.query.search || '').trim().slice(0, 160);
  const difficulty = String(req.query.difficulty || '').trim();
  const questionType = String(req.query.question_type || '').trim();
  const unitId = String(req.query.unit_id || '').trim();
  const concept = String(req.query.concept || '').trim().slice(0, 100);
  const page = Math.max(0, Number.parseInt(req.query.page, 10) || 0);
  const limit = Math.min(40, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));

  if (difficulty && !['easy', 'medium', 'hard'].includes(difficulty)) {
    throw new SecurityError('Invalid difficulty filter.', 400);
  }

  let query = supabase
    .from('quiz_questions')
    .select(QUESTION_FIELDS, { count: 'exact' })
    .eq('status', 'published')
    .eq('is_active', true)
    .eq('is_note_practice', false)
    .in('unit_id', await getActiveGroupLessonIds(scope.active_group_id));

  if (search) query = query.textSearch('search_vector', search, { type: 'websearch', config: 'english' });
  if (difficulty) query = query.eq('difficulty', difficulty);
  if (questionType) query = query.eq('question_type', questionType);
  if (unitId) query = query.eq('unit_id', unitId);
  if (concept) query = query.ilike('concept_name', '%' + concept.replace(/[%_]/g, '') + '%');

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(page * limit, page * limit + limit - 1);

  if (error) {
    console.error('[QUESTION_BANK_SEARCH_ERROR]', { user_id: ctx.userId, message: error.message });
    throw new SecurityError('Unable to search the question bank.', 500);
  }

  const unitIds = [...new Set((data || []).map((row) => row.unit_id).filter(Boolean))];
  const { data: units, error: unitError } = unitIds.length
    ? await supabase.from('curriculum_units').select('id,name,node_type').in('id', unitIds)
    : { data: [], error: null };
  if (unitError) throw new SecurityError('Unable to load question topics.', 500);
  const unitMap = new Map((units || []).map((unit) => [String(unit.id), unit]));

  return res.status(200).json({
    questions: (data || []).map((question) => ({
      ...question,
      curriculum_unit: unitMap.get(String(question.unit_id)) || null
    })),
    total: count || 0,
    page,
    limit,
    has_more: (page + 1) * limit < (count || 0)
  });
}

async function getActiveGroupLessonIds(groupId) {
  const { data, error } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('group_id', groupId)
    .eq('is_active', true)
    .eq('node_type', 'lesson');
  if (error) throw new SecurityError('Unable to resolve your curriculum questions.', 500);
  return (data || []).map((row) => row.id);
}

export async function getTestBlueprints(req, res, ctx) {
  requireAuth(ctx);
  const { data, error } = await supabase
    .from('learning_test_blueprints')
    .select('id,title,description,filters,question_count,is_archived,created_at,updated_at')
    .eq('user_id', ctx.userId)
    .eq('is_archived', false)
    .order('updated_at', { ascending: false });
  if (error) throw new SecurityError('Unable to load saved tests.', 500);

  const ids = (data || []).map((item) => item.id);
  const { data: items, error: itemError } = ids.length
    ? await supabase.from('learning_test_blueprint_items')
        .select('blueprint_id,question_id,position')
        .in('blueprint_id', ids)
        .order('position', { ascending: true })
    : { data: [], error: null };
  if (itemError) throw new SecurityError('Unable to load saved test questions.', 500);

  const questionIds = [...new Set((items || []).map((item) => item.question_id))];
  const { data: questions, error: questionError } = questionIds.length
    ? await supabase.from('quiz_questions')
        .select('id,question_text,difficulty,question_type,concept_name,unit_id')
        .in('id', questionIds)
    : { data: [], error: null };
  if (questionError) throw new SecurityError('Unable to load saved test previews.', 500);

  const questionMap = new Map((questions || []).map((item) => [String(item.id), item]));
  const itemsByBlueprint = new Map();
  for (const item of items || []) {
    if (!itemsByBlueprint.has(item.blueprint_id)) itemsByBlueprint.set(item.blueprint_id, []);
    const question = questionMap.get(String(item.question_id));
    if (question) itemsByBlueprint.get(item.blueprint_id).push({ ...item, question });
  }

  return res.status(200).json({
    blueprints: (data || []).map((item) => ({
      ...item,
      items: itemsByBlueprint.get(item.id) || []
    }))
  });
}

export async function saveTestBlueprint(body, res, ctx) {
  requireAuth(ctx);
  const scope = await getQuestionScope(ctx.userId);
  const title = String(body.title || '').trim().slice(0, 120);
  const description = String(body.description || '').trim().slice(0, 500);
  const questionIds = [...new Set((Array.isArray(body.question_ids) ? body.question_ids : [])
    .map((id) => Number(id))
    .filter((id) => Number.isSafeInteger(id) && id > 0))];

  if (!title) throw new SecurityError('Give your custom test a title.', 400);
  if (questionIds.length < 2 || questionIds.length > 100) {
    throw new SecurityError('Select between 2 and 100 questions.', 400);
  }

  const { data: validQuestions, error: questionError } = await supabase
    .from('quiz_questions')
    .select('id,unit_id')
    .in('id', questionIds)
    .eq('status', 'published')
    .eq('is_active', true)
    .eq('is_note_practice', false);
  if (questionError) throw new SecurityError('Unable to validate selected questions.', 500);
  if ((validQuestions || []).length !== questionIds.length) {
    throw new SecurityError('Some selected questions are no longer available.', 409);
  }

  const unitIds = [...new Set((validQuestions || []).map((item) => item.unit_id).filter(Boolean))];
  const { data: units, error: unitError } = await supabase
    .from('curriculum_units')
    .select('id,group_id')
    .in('id', unitIds)
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true)
    .eq('node_type', 'lesson');
  if (unitError) throw new SecurityError('Unable to validate question curriculum access.', 500);
  if ((units || []).length !== unitIds.length) {
    throw new SecurityError('Selected questions must belong to your active curriculum.', 403);
  }

  const filters = body.filters && typeof body.filters === 'object' && !Array.isArray(body.filters)
    ? body.filters : {};
  let blueprintId = body.blueprint_id || null;

  if (blueprintId) {
    const { data: owned, error: ownerError } = await supabase
      .from('learning_test_blueprints')
      .select('id')
      .eq('id', blueprintId)
      .eq('user_id', ctx.userId)
      .eq('is_archived', false)
      .maybeSingle();
    if (ownerError || !owned) throw new SecurityError('Saved test not found.', 404);

    const { error: updateError } = await supabase
      .from('learning_test_blueprints')
      .update({ title, description: description || null, filters, updated_at: new Date().toISOString() })
      .eq('id', blueprintId)
      .eq('user_id', ctx.userId);
    if (updateError) throw new SecurityError('Unable to update the saved test.', 500);

    const { error: deleteError } = await supabase
      .from('learning_test_blueprint_items')
      .delete()
      .eq('blueprint_id', blueprintId);
    if (deleteError) throw new SecurityError('Unable to replace saved test questions.', 500);
  } else {
    const { data: inserted, error: insertError } = await supabase
      .from('learning_test_blueprints')
      .insert({
        user_id: ctx.userId,
        title,
        description: description || null,
        filters,
        question_count: 0
      })
      .select('id')
      .single();
    if (insertError || !inserted) throw new SecurityError('Unable to create the saved test.', 500);
    blueprintId = inserted.id;
  }

  const rows = questionIds.map((question_id, index) => ({
    blueprint_id: blueprintId,
    question_id,
    position: index + 1
  }));
  const { error: itemsError } = await supabase
    .from('learning_test_blueprint_items')
    .insert(rows);
  if (itemsError) throw new SecurityError('Unable to save the selected test questions.', 500);

  return res.status(200).json({
    success: true,
    blueprint_id: blueprintId,
    question_count: questionIds.length
  });
}

export async function archiveTestBlueprint(body, res, ctx) {
  requireAuth(ctx);
  if (!body.blueprint_id) throw new SecurityError('blueprint_id required.', 400);
  const { data, error } = await supabase
    .from('learning_test_blueprints')
    .update({ is_archived: true, updated_at: new Date().toISOString() })
    .eq('id', body.blueprint_id)
    .eq('user_id', ctx.userId)
    .select('id')
    .maybeSingle();
  if (error || !data) throw new SecurityError('Saved test not found.', 404);
  return res.status(200).json({ success: true });
}
