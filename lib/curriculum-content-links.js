import { supabase } from './core.js';

const LINKED_RESOURCE_TABLES = {
  note: 'notes',
  flashcard_deck: 'flashcard_decks',
  quiz_question: 'quiz_questions',
  recall_question: 'recall_questions_bank',
  pdf_resource: 'pdf_resources',
  past_paper: 'past_papers'
};

/**
 * Return active canonical resource IDs linked to a curriculum node, restricted
 * to resources stored inside the same active curriculum group. Callers must
 * validate the requested unit against the authenticated user's scope first.
 */
export async function getCurriculumLinkedContentIds(unitId, contentType) {
  const table = LINKED_RESOURCE_TABLES[contentType];
  if (!unitId || !table) return [];

  const { data: unit, error: unitError } = await supabase
    .from('curriculum_units')
    .select('id, group_id, node_type')
    .eq('id', unitId)
    .eq('is_active', true)
    .maybeSingle();

  if (unitError) throw unitError;
  if (!unit?.group_id) return [];

  const { data: groupUnits, error: groupUnitsError } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('group_id', unit.group_id)
    .eq('is_active', true);

  if (groupUnitsError) throw groupUnitsError;

  const allowedUnitIds = (groupUnits || []).map((row) => row.id);
  if (!allowedUnitIds.length) return [];

  let linkUnitIds = [unitId];
  if (unit.node_type === 'theme' || unit.node_type === 'subtopic') {
    const { data: descendants, error: descendantsError } = await supabase
      .rpc('get_curriculum_descendant_ids', { p_unit_id: unitId });

    if (descendantsError) throw descendantsError;
    linkUnitIds = [...new Set((descendants || [])
      .map((row) => row.unit_id)
      .filter((id) => allowedUnitIds.includes(id)))];
    if (!linkUnitIds.includes(unitId)) linkUnitIds.unshift(unitId);
  }

  const { data: links, error: linksError } = await supabase
    .from('learning_content_links')
    .select('content_id')
    .in('curriculum_unit_id', linkUnitIds)
    .eq('content_type', contentType);

  if (linksError) throw linksError;

  const linkedIds = [...new Set((links || [])
    .map((row) => row.content_id)
    .filter((id) => id !== null && id !== undefined)
    .map(String))];

  // Include both legacy unit_id assignments anywhere inside the selected
  // theme subtree and canonical links attached to the selected node/subtree.
  // Canonical links may intentionally point to shared resources whose unit_id
  // is null, but any non-null unit assignment must remain in the active group.
  const [linkedResourcesResult, unitResourcesResult] = await Promise.all([
    linkedIds.length
      ? supabase.from(table).select('id, unit_id').in('id', linkedIds).eq('is_active', true)
      : Promise.resolve({ data: [], error: null }),
    supabase.from(table).select('id').in('unit_id', linkUnitIds).eq('is_active', true)
  ]);

  if (linkedResourcesResult.error) throw linkedResourcesResult.error;
  if (unitResourcesResult.error) throw unitResourcesResult.error;

  const validLinkedIds = (linkedResourcesResult.data || [])
    .filter((row) => !row.unit_id || allowedUnitIds.includes(row.unit_id))
    .map((row) => String(row.id));
  const unitResourceIds = (unitResourcesResult.data || []).map((row) => String(row.id));

  return [...new Set([...validLinkedIds, ...unitResourceIds])];
}

/**
 * Filter a resource query by its stored unit OR by canonical links to the
 * selected unit. IDs passed here have already been scoped to the same group.
 */
export function filterQueryByCurriculumUnit(query, unitId, linkedIds) {
  if (!unitId) return query;
  if (!Array.isArray(linkedIds) || linkedIds.length === 0) {
    return query.eq('unit_id', unitId);
  }

  return query.or(`unit_id.eq.${unitId},id.in.(${linkedIds.join(',')})`);
}
