import { supabase } from './core.js';
import { SecurityError } from './security-middleware.js';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function handler(req, res, path) {
  if (req.method !== 'GET') {
    throw new SecurityError('Method not allowed', 405);
  }

  switch (path) {
    case 'node':
      return getNode(req, res);
    case 'node_by_path':
      return getNodeByPath(req, res);
    case 'tree':
      return getTree(req, res);
    default:
      throw new SecurityError('Invalid action', 400);
  }
}

async function getNode(req, res) {
  const { unit_id } = req.query;

  if (!unit_id) throw new SecurityError('unit_id required', 400);

  const { data, error } = await supabase.rpc('get_curriculum_node', {
    p_unit_id: unit_id
  });

  if (error) throw error;
  if (!data) throw new SecurityError('Curriculum node not found', 404);

  return res.status(200).json(await attachBlocks(data));
}

async function getTree(req, res) {
  const { group_id } = req.query;

  if (!group_id) throw new SecurityError('group_id required', 400);

  const { data, error } = await supabase.rpc('get_curriculum_tree', {
    p_group_id: group_id
  });

  if (error) throw error;

  return res.status(200).json(data || []);
}

async function getNodeByPath(req, res) {
  const { group_id, path: nodePath } = req.query;

  if (!group_id || !nodePath) {
    throw new SecurityError('group_id and path required', 400);
  }

  const segments = String(nodePath)
    .split('/')
    .map((segment) => slugify(decodeURIComponent(segment)))
    .filter(Boolean);

  if (!segments.length) throw new SecurityError('path required', 400);

  const { data: units, error } = await supabase
    .from('curriculum_units')
    .select('id, name, slug, parent_id, node_type, display_order, is_active')
    .eq('group_id', group_id)
    .eq('is_active', true)
    .order('display_order', { ascending: true });

  if (error) throw error;

  let parentId = null;
  let current = null;

  for (const segment of segments) {
    const matches = (units || []).filter((unit) => {
      if (unit.parent_id !== parentId) return false;
      return slugify(unit.slug || unit.name) === segment;
    });

    if (matches.length !== 1) {
      throw new SecurityError('Curriculum path not found', 404);
    }

    current = matches[0];
    parentId = current.id;
  }

  const { data: node, error: nodeError } = await supabase.rpc('get_curriculum_node', {
    p_unit_id: current.id
  });

  if (nodeError) throw nodeError;
  if (!node) throw new SecurityError('Curriculum node not found', 404);

  return res.status(200).json(await attachBlocks(node));
}

async function attachBlocks(data) {
  const node = data?.node || data;
  const unitId = node?.id;

  if (!unitId) return data;

  const { data: blocks, error } = await supabase
    .from('curriculum_unit_blocks')
    .select('id, unit_id, block_number, is_premium, title, content_type, content, media_url, created_at, updated_at')
    .eq('unit_id', unitId)
    .order('block_number', { ascending: true });

  if (error) throw error;

  return {
    ...data,
    blocks: blocks || []
  };
}
