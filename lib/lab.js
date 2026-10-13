 import { supabase, isAdmin } from './core.js';

export async function handler(req, res, path, ctx) {
  // Get user's access info
  let userLevel = null;
  let showAllContent = false;
  let isAdminUser = false;

  if (ctx.authenticated && ctx.userId) {
    const adminData = await isAdmin(ctx.userId, 'unknown');
    isAdminUser = !!(adminData && adminData.admin_role);

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('track, role, is_approved_teacher, approved_track')
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (profile) {
      if (profile.role === 'student') {
        userLevel = profile.track;
      } else if (profile.role === 'teacher' && profile.is_approved_teacher) {
        if (profile.approved_track === 'ALL') {
          showAllContent = true;
        } else {
          userLevel = profile.approved_track || profile.track;
        }
      }
    }
  }

  const hasLabAccess = isAdminUser || showAllContent || userLevel === 'Pharmacy';

  if (req.method === 'GET') {
    if (path === 'tools') {
      if (!hasLabAccess) return res.status(200).json({ data: [] });
      const data = await getLabTools();
      return res.status(200).json({ data });
    }

    if (path === 'drugs') {
      if (!hasLabAccess) return res.status(200).json({ data: [] });
      const level = req.query.level || null;
      const effectiveLevel = showAllContent ? level : (level || userLevel);
      const data = await getLabDrugs(effectiveLevel);
      return res.status(200).json({ data });
    }

    if (path === 'interactions') {
      const { drug_a_id, drug_b_id } = req.query;
      if (!drug_a_id || !drug_b_id) {
        return res.status(400).json({ error: 'drug_a_id and drug_b_id required' });
      }
      const data = await getLabInteraction(drug_a_id, drug_b_id);
      return res.status(200).json({ data });
    }

    if (path === 'pathways') {
      if (!hasLabAccess) return res.status(200).json({ data: [] });
      const level = req.query.level || null;
      const effectiveLevel = showAllContent ? level : (level || userLevel);
      const data = await getLabPathways(effectiveLevel);
      return res.status(200).json({ data });
    }

    if (path === 'pathway_by_slug') {
      const slug = req.query.slug;
      if (!slug) return res.status(400).json({ error: 'slug required' });
      const data = await getLabPathwayBySlug(slug);
      return res.status(200).json({ data });
    }

    if (path === 'cases') {
      if (!hasLabAccess) return res.status(200).json({ data: [] });
      const { level, difficulty } = req.query;
      const effectiveLevel = showAllContent ? level : (level || userLevel);
      const data = await getLabCases(effectiveLevel, difficulty || null);
      return res.status(200).json({ data });
    }

    if (path === 'case_by_id') {
      if (!hasLabAccess) return res.status(403).json({ error: 'Lab access is restricted to Pharmacy learners and authorized staff' });
      const id = req.query.id;
      if (!id) return res.status(400).json({ error: 'id required' });
      const allowedLevel = (isAdminUser || showAllContent) ? null : userLevel;
      const data = await getLabCaseById(id, allowedLevel);
      return res.status(200).json({ data });
    }

    if (path === 'formulas') {
      if (!hasLabAccess) return res.status(200).json({ data: [] });
      const { level, drug } = req.query;
      const effectiveLevel = showAllContent ? level : (level || userLevel);
      const data = await getLabFormulas(effectiveLevel, drug || null);
      return res.status(200).json({ data });
    }

    return res.status(404).json({ error: 'Lab endpoint not found' });
  }

  if (req.method === 'POST' && path === 'submit_score') {
    if (!ctx.authenticated) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (!hasLabAccess) {
      return res.status(403).json({ error: 'Lab access is restricted to Pharmacy learners and authorized staff' });
    }
    const body = req.body || {};
    const { case_id, score, max_score } = body;
    if (!case_id || score === undefined || max_score === undefined) {
      return res.status(400).json({ error: 'case_id, score, and max_score required' });
    }

    const numericScore = Number(score);
    const numericMaxScore = Number(max_score);
    if (
      !Number.isFinite(numericScore) ||
      !Number.isFinite(numericMaxScore) ||
      numericMaxScore <= 0 ||
      numericScore < 0 ||
      numericScore > numericMaxScore
    ) {
      return res.status(400).json({ error: 'score must be between 0 and a positive max_score' });
    }

    const allowedLevel = (isAdminUser || showAllContent) ? null : userLevel;
    const caseData = await getLabCaseById(case_id, allowedLevel);
    if (!caseData) return res.status(404).json({ error: 'Active case not found' });

    const data = await submitCaseScore(ctx.userId, case_id, numericScore, numericMaxScore);
    return res.status(200).json({ data });
  }

  return res.status(404).json({ error: 'Lab endpoint not found' });
}

// ─── Helper functions (no auth checks, just data) ────────────────────

async function getLabTools() {
  const { data, error } = await supabase
    .from('lab_tools')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getLabDrugs(level) {
  let query = supabase.from('lab_drugs').select('*').eq('is_active', true);
  if (level) query = query.eq('level', level);
  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getLabInteraction(drugAId, drugBId) {
  const { data, error } = await supabase
    .from('lab_interactions')
    .select('*, drug_a:lab_drugs!lab_interactions_drug_a_id_fkey(name, drug_class), drug_b:lab_drugs!lab_interactions_drug_b_id_fkey(name, drug_class)')
    .or(`and(drug_a_id.eq.${drugAId},drug_b_id.eq.${drugBId}),and(drug_a_id.eq.${drugBId},drug_b_id.eq.${drugAId})`)
    .maybeSingle();
  if (error) throw error;
  return data || null;
}

async function getLabPathways(level) {
  let query = supabase.from('lab_pathways').select('*').eq('is_active', true);
  if (level) query = query.eq('level', level);
  const { data, error } = await query.order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getLabPathwayBySlug(slug) {
  const { data: pathway, error: pathwayError } = await supabase
    .from('lab_pathways')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single();
  if (pathwayError) throw pathwayError;

  const { data: steps, error: stepsError } = await supabase
    .from('lab_pathway_steps')
    .select('*')
    .eq('pathway_id', pathway.id)
    .order('step_order', { ascending: true });
  if (stepsError) throw stepsError;

  return { ...pathway, steps: steps || [] };
}

async function getLabCases(level, difficulty) {
  let query = supabase.from('lab_cases').select('*').eq('is_active', true);
  if (level) query = query.eq('level', level);
  if (difficulty) query = query.eq('difficulty', difficulty);
  const { data, error } = await query.order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}

async function getLabCaseById(id, allowedLevel = null) {
  let caseQuery = supabase
    .from('lab_cases')
    .select('*')
    .eq('id', id)
    .eq('is_active', true);

  if (allowedLevel) caseQuery = caseQuery.eq('level', allowedLevel);

  const { data: caseData, error: caseError } = await caseQuery.maybeSingle();
  if (caseError) throw caseError;
  if (!caseData) return null;

  const { data: stages, error: stagesError } = await supabase
    .from('lab_case_stages')
    .select('*')
    .eq('case_id', id)
    .order('stage_order', { ascending: true });
  if (stagesError) throw stagesError;

  return { ...caseData, stages: stages || [] };
}

async function submitCaseScore(userId, caseId, score, maxScore) {
  const { data, error } = await supabase
    .from('lab_case_scores')
    .insert({
      user_id: userId,
      case_id: caseId,
      score,
      max_score: maxScore,
      completed_at: new Date().toISOString()
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

async function getLabFormulas(level, drug) {
  let query = supabase.from('lab_drug_formulas').select('*').eq('is_active', true);
  if (level) query = query.eq('level', level);
  if (drug) query = query.ilike('drug_name', `%${drug}%`);
  const { data, error } = await query.order('drug_name', { ascending: true });
  if (error) throw error;
  return data || [];
}
