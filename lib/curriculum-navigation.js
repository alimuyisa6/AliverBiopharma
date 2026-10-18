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

  const requestedAction = String(path || '').trim().toLowerCase();
  const query = req.query || {};
  const action = requestedAction || (
    query.unit_id ? 'node' :
    query.group_id && (query.node_path || query.path) ? 'node_by_path' :
    query.group_id ? 'tree' :
    ''
  );

  switch (action) {
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
  const { group_id } = req.query;
  const nodePath = req.query.node_path || req.query.path;

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

  const { data: links, error: linksError } = await supabase
    .from('learning_content_links')
    .select('id, curriculum_unit_id, content_type, content_id, relationship_type, is_primary, link_origin')
    .eq('curriculum_unit_id', unitId)
    .order('content_type', { ascending: true })
    .order('content_id', { ascending: true });

  if (linksError) throw linksError;

  const linksByType = {};
  for (const link of links || []) {
    if (!linksByType[link.content_type]) linksByType[link.content_type] = [];
    linksByType[link.content_type].push(link.content_id);
  }

  const tableConfig = {
    note: { table: 'notes', id: 'id', title: 'title', slug: 'slug' },
    article: { table: 'articles', id: 'id', title: 'title', slug: 'slug' },
    video: { table: 'videos', id: 'id', title: 'title', slug: 'slug' },
    flashcard_deck: { table: 'flashcard_decks', id: 'id', title: 'title' },
    quiz_question: { table: 'quiz_questions', id: 'id', title: 'question_text' },
    recall_question: { table: 'recall_questions_bank', id: 'id', title: 'question_text' },
    past_paper: { table: 'past_papers', id: 'id', title: 'title' },
    pdf_resource: { table: 'pdf_resources', id: 'id', title: 'title' },
    curriculum_unit_block: { table: 'curriculum_unit_blocks', id: 'id', title: 'title' }
  };

  const detailResults = await Promise.all(
    Object.entries(linksByType).map(async ([type, ids]) => {
      const config = tableConfig[type];
      if (!config) return [type, []];

      const { data: items, error: itemError } = await supabase
        .from(config.table)
        .select([config.id, config.title, ...(config.slug ? [config.slug] : [])].join(', '))
        .in(config.id, ids);

      if (itemError) throw itemError;
      return [type, items || []];
    })
  );

  const itemMap = new Map();
  for (const [type, items] of detailResults) {
    for (const item of items) itemMap.set(`${type}:${item.id}`, item);
  }

  const linkedContent = (links || []).map((link) => {
    const item = itemMap.get(`${link.content_type}:${link.content_id}`) || null;
    return {
      ...link,
      title: item?.title || item?.question_text || (item ? 'Untitled resource' : 'Resource details unavailable'),
      slug: item?.slug || null
    };
  });

  const { data: curriculumGroup, error: groupError } = await supabase
    .from('curriculum_groups')
    .select('id, level_id, name')
    .eq('id', node.group_id)
    .maybeSingle();

  if (groupError) throw groupError;

  return {
    ...data,
    curriculum_group: curriculumGroup || null,
    blocks: blocks || [],
    linked_content: linkedContent
  };
}
