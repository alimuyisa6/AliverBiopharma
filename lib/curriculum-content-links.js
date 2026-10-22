import { supabase } from './core.js';

/**
 * Return canonical resource IDs linked to a curriculum node.
 * Call only after validating that the requested curriculum unit is in the
 * caller's authorised scope. The database remains the source of truth for
 * resource-to-topic relationships.
 */
export async function getCurriculumLinkedContentIds(unitId, contentType) {
  if (!unitId || !contentType) return [];

  const { data, error } = await supabase
    .from('learning_content_links')
    .select('content_id')
    .eq('curriculum_unit_id', unitId)
    .eq('content_type', contentType);

  if (error) throw error;

  return [...new Set((data || [])
    .map((row) => row.content_id)
    .filter((id) => id !== null && id !== undefined)
    .map(String))];
}

/**
 * Filter a resource query by its stored unit OR by canonical links to the
 * selected unit. IDs come from the database, not from user input.
 */
export function filterQueryByCurriculumUnit(query, unitId, linkedIds) {
  if (!unitId) return query;
  if (!Array.isArray(linkedIds) || linkedIds.length === 0) {
    return query.eq('unit_id', unitId);
  }

  return query.or(`unit_id.eq.${unitId},id.in.(${linkedIds.join(',')})`);
}
