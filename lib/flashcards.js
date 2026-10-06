/* lib/flashcards.js */
import { supabase } from './core.js';
import {
  parseAndValidateBody,
  requireAuth,
  requireAdmin,
  SecurityError,
} from './security-middleware.js';
import { getUserCurriculumScope } from './curriculum.js';
import { requireActionAccess } from './authorization.js';

const VALID_MODES = ['flip', 'typed', 'multiple_choice', 'structure_identification'];

export async function handler(req, res, path, ctx) {
  if (req.method === 'GET') {
    requireAuth(ctx);
    switch (path) {
      case 'list':             return listDecks(req, res, ctx);
      case 'deck':             return getDeck(req, res, ctx);
      case 'decks':            return getDecksSummary(req, res, ctx);
      case 'active_session':   return getActiveSession(req, res, ctx);
      case 'adaptive_decks':   return getAdaptiveDecks(req, res, ctx);
      case 'known':            return getKnownFlashcards(req, res, ctx);
      case 'progress':         return getFlashcardProgress(req, res, ctx);
      default: throw new SecurityError('Invalid action', 400);
    }
  }

  if (req.method === 'POST') {
    const body = await parseAndValidateBody(req);
    switch (path) {
      case 'create_deck':        requireAdmin(ctx); return createDeck(body, res, ctx);
      case 'update_deck':        requireAdmin(ctx); return updateDeck(body, res, ctx);
      case 'delete_deck':        requireAdmin(ctx); return deleteDeck(body, res, ctx);
      case 'seed_degree_samples': requireAdmin(ctx); return seedDegreeSamples(res, ctx);
      case 'add_cards':          requireAdmin(ctx); return addCards(body, res, ctx);
      case 'remove_card':        requireAdmin(ctx); return removeCard(body, res, ctx);
      case 'toggle_known':       requireAuth(ctx); return toggleKnown(body, res, ctx);
      case 'known':              requireAuth(ctx); return toggleKnown(body, res, ctx);
      case 'rate':               requireAuth(ctx); return rateFlashcard(body, res, ctx);
      case 'toggle_bookmark':    requireAuth(ctx); return toggleBookmark(body, res, ctx);
      case 'check_answer':       requireAuth(ctx); return checkAnswer(body, res, ctx);
      case 'start_session':      requireAuth(ctx); return startSession(body, res, ctx);
      case 'update_session':     requireAuth(ctx); return updateSession(body, res, ctx);
      case 'complete_session':   requireAuth(ctx); return completeSession(body, res, ctx);
      default: throw new SecurityError('Invalid action', 400);
    }
  }

  throw new SecurityError('Method not allowed', 405);
}

async function getKnownFlashcards(req, res, ctx) {
  const { data } = await supabase
    .from('content_reactions')
    .select('content_id')
    .eq('user_id', ctx.userId)
    .eq('content_type', 'flashcard_card')
    .eq('reaction_type', 'bookmark');

  return res.status(200).json((data || []).map((item) => item.content_id));
}

async function getFlashcardProgress(req, res, ctx) {
  const { data } = await supabase
    .from('user_flashcard_sessions')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('is_complete', true)
    .order('completed_at', { ascending: false })
    .limit(20);

  return res.status(200).json(data || []);
}

async function rateFlashcard(body, res, ctx) {
  const { flashcard_id, difficulty } = body;

  if (!flashcard_id) throw new SecurityError('flashcard_id required', 400);

  await supabase
    .from('content_reactions')
    .upsert({
      user_id: ctx.userId,
      content_type: 'flashcard_card',
      content_id: flashcard_id,
      reaction_type: 'rating',
      metadata: { difficulty: difficulty || null }
    }, { onConflict: 'user_id,content_type,content_id,reaction_type' });

  return res.status(200).json({ success: true });
}

async function toggleBookmark(body, res, ctx) {
  const { flashcard_id } = body;

  if (!flashcard_id) throw new SecurityError('flashcard_id required', 400);

  const { data: existing } = await supabase
    .from('content_reactions')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('content_type', 'flashcard_card')
    .eq('content_id', flashcard_id)
    .eq('reaction_type', 'bookmark')
    .maybeSingle();

  if (existing) {
    await supabase.from('content_reactions').delete().eq('id', existing.id);
    return res.status(200).json({ bookmarked: false });
  }

  await supabase
    .from('content_reactions')
    .insert({
      user_id: ctx.userId,
      content_type: 'flashcard_card',
      content_id: flashcard_id,
      reaction_type: 'bookmark'
    });

  return res.status(200).json({ bookmarked: true });
}

async function getActiveUnitIds(ctx) {
  if (ctx.adminData) return null;

  const scope = await getUserCurriculumScope(ctx.userId);
  if (!scope || !scope.active_group_id) return [];

  const { data: units } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('group_id', scope.active_group_id)
    .eq('is_active', true);

  return (units || []).map(u => u.id);
}

function validateUnitAccess(allowedUnitIds, unitId) {
  if (allowedUnitIds !== null && !allowedUnitIds.includes(unitId)) {
    throw new SecurityError('Deck not available in your curriculum', 403);
  }
}

async function filterDecksByScope(query, allowedUnitIds) {
  if (allowedUnitIds !== null) {
    return query.in('unit_id', allowedUnitIds);
  }
  return query;
}

async function listDecks(req, res, ctx) {
  const allowedUnitIds = await getActiveUnitIds(ctx);
  if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
    return res.status(200).json([]);
  }

  const { unit_id } = req.query;
  let query = supabase
    .from('flashcard_decks')
    .select('id, title, description, category, unit_id, card_types, difficulty_confidence')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (unit_id) {
    validateUnitAccess(allowedUnitIds, unit_id);
    query = query.eq('unit_id', unit_id);
  } else {
    query = await filterDecksByScope(query, allowedUnitIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[FLASHCARDS_LIST_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      error: error.message
    }));
    throw new SecurityError('Failed to fetch decks', 500);
  }

  return res.status(200).json(data || []);
}

async function getDeck(req, res, ctx) {
  const { deck_id } = req.query;
  if (!deck_id) throw new SecurityError('deck_id required', 400);

  const { data: deck, error: deckError } = await supabase
    .from('flashcard_decks')
    .select('*')
    .eq('id', deck_id)
    .maybeSingle();

  if (deckError) {
    console.error('[FLASHCARDS_GET_DECK_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: deckError.message
    }));
    throw new SecurityError('Failed to fetch deck', 500);
  }

  if (!deck) throw new SecurityError('Deck not found', 404);

  const allowedUnitIds = await getActiveUnitIds(ctx);
  validateUnitAccess(allowedUnitIds, deck.unit_id);

  const { data: cards, error: cardsError } = await supabase
    .from('flashcard_cards')
    .select('*')
    .eq('deck_id', deck_id)
    .order('position', { ascending: true });

  if (cardsError) {
    console.error('[FLASHCARDS_GET_CARDS_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: cardsError.message
    }));
    throw new SecurityError('Failed to fetch cards', 500);
  }

  return res.status(200).json({ ...deck, cards: cards || [] });
}

async function getDecksSummary(req, res, ctx) {
  const allowedUnitIds = await getActiveUnitIds(ctx);
  if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
    return res.status(200).json([]);
  }

  const { unit_id } = req.query;
  let query = supabase
    .from('flashcard_decks')
    .select('id, title, description, category, unit_id, card_types')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (unit_id) {
    validateUnitAccess(allowedUnitIds, unit_id);
    query = query.eq('unit_id', unit_id);
  } else {
    query = await filterDecksByScope(query, allowedUnitIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[FLASHCARDS_DECKS_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      error: error.message
    }));
    throw new SecurityError('Failed to fetch decks', 500);
  }

  return res.status(200).json(data || []);
}

async function getActiveSession(req, res, ctx) {
  const allowedUnitIds = await getActiveUnitIds(ctx);
  if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
    return res.status(200).json(null);
  }

  const { deck_id } = req.query;
  let sessionQuery = supabase
    .from('user_flashcard_sessions')
    .select('*')
    .eq('user_id', ctx.userId)
    .eq('is_complete', false)
    .order('started_at', { ascending: false })
    .limit(1);

  if (deck_id) {
    const { data: deck } = await supabase
      .from('flashcard_decks')
      .select('unit_id')
      .eq('id', deck_id)
      .maybeSingle();
    if (!deck) throw new SecurityError('Deck not found', 404);
    validateUnitAccess(allowedUnitIds, deck.unit_id);
    sessionQuery = sessionQuery.eq('deck_id', deck_id);
  } else {
    const { data: deckIds } = await supabase
      .from('flashcard_decks')
      .select('id')
      .in('unit_id', allowedUnitIds);

    const allowedDeckIds = (deckIds || []).map(d => d.id);
    if (!allowedDeckIds.length) return res.status(200).json(null);
    sessionQuery = sessionQuery.in('deck_id', allowedDeckIds);
  }

  const { data, error } = await sessionQuery;

  if (error) {
    console.error('[FLASHCARDS_SESSION_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      error: error.message
    }));
    throw new SecurityError('Failed to fetch session', 500);
  }

  return res.status(200).json(data?.[0] || null);
}

async function getAdaptiveDecks(req, res, ctx) {
  const allowedUnitIds = await getActiveUnitIds(ctx);
  if (allowedUnitIds !== null && allowedUnitIds.length === 0) {
    return res.status(200).json([]);
  }

  let query = supabase
    .from('flashcard_decks')
    .select('id, title, description, category, unit_id, card_types, difficulty_confidence')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  query = await filterDecksByScope(query, allowedUnitIds);

  const { data, error } = await query;

  if (error) {
    console.error('[FLASHCARDS_ADAPTIVE_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      error: error.message
    }));
    throw new SecurityError('Failed to fetch decks', 500);
  }

  return res.status(200).json(data || []);
}

async function startSession(body, res, ctx) {
  const { deck_id, mode, challenge_id = null } = body;
  if (!deck_id) throw new SecurityError('deck_id required', 400);

  let challenge = null;
  if (challenge_id) {
    const { data: challengeRow, error: challengeError } = await supabase
      .from('user_daily_challenges')
      .select('id, user_id, challenge_type, unit_id, group_id, level_id, status')
      .eq('id', challenge_id)
      .eq('user_id', ctx.userId)
      .maybeSingle();

    if (challengeError) throw new SecurityError('Unable to validate challenge', 500);
    if (!challengeRow) throw new SecurityError('Challenge not found', 404);
    if (challengeRow.challenge_type !== 'flashcards') throw new SecurityError('This challenge is not a flashcard challenge', 400);
    if (!['available', 'in_progress'].includes(challengeRow.status)) throw new SecurityError('Challenge is no longer available', 409);
    challenge = challengeRow;
  }

  const allowedUnitIds = await getActiveUnitIds(ctx);
  const { data: deck } = await supabase
    .from('flashcard_decks')
    .select('unit_id')
    .eq('id', deck_id)
    .maybeSingle();

  if (!deck) throw new SecurityError('Deck not found', 404);
  validateUnitAccess(allowedUnitIds, deck.unit_id);

  // Central authorization is enforced at session creation, preventing a
  // client from starting a deck outside its curriculum scope.
  await requireActionAccess(ctx, {
    actionKey: 'flashcards_start',
    contentType: 'unit',
    contentId: deck.unit_id,
    restrictionType: 'flashcards_start'
  });

  const effectiveMode = VALID_MODES.includes(mode) ? mode : 'flip';

  await supabase
    .from('user_flashcard_sessions')
    .update({ is_complete: true, completed_at: new Date().toISOString() })
    .eq('user_id', ctx.userId)
    .eq('deck_id', deck_id)
    .eq('is_complete', false);

  const { data, error } = await supabase
    .from('user_flashcard_sessions')
    .insert({
      user_id: ctx.userId,
      deck_id,
      mode: effectiveMode,
      cards_seen: [],
      cards_correct: [],
      cards_incorrect: [],
      current_index: 0,
      is_complete: false,
      started_at: new Date().toISOString(),
      challenge_id: challenge?.id || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[FLASHCARDS_START_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: error.message
    }));
    throw new SecurityError('Failed to start session', 500);
  }

  return res.status(200).json({ session_id: data.id });
}

async function updateSession(body, res, ctx) {
  const { session_id, card_id, correct, current_index } = body;
  if (!session_id) throw new SecurityError('session_id required', 400);

  const { data: session } = await supabase
    .from('user_flashcard_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', ctx.userId)
    .eq('is_complete', false)
    .maybeSingle();

  if (!session) throw new SecurityError('Session not found', 404);

  const cardsSeen = [...(session.cards_seen || [])];
  const cardsCorrect = [...(session.cards_correct || [])];
  const cardsIncorrect = [...(session.cards_incorrect || [])];

  if (card_id && !cardsSeen.includes(card_id)) cardsSeen.push(card_id);
  if (card_id && correct === true && !cardsCorrect.includes(card_id)) cardsCorrect.push(card_id);
  if (card_id && correct === false && !cardsIncorrect.includes(card_id)) cardsIncorrect.push(card_id);

  const { error } = await supabase
    .from('user_flashcard_sessions')
    .update({
      cards_seen: cardsSeen,
      cards_correct: cardsCorrect,
      cards_incorrect: cardsIncorrect,
      current_index: current_index ?? session.current_index,
    })
    .eq('id', session_id)
    .eq('user_id', ctx.userId);

  if (error) {
    console.error('[FLASHCARDS_UPDATE_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      session_id,
      error: error.message
    }));
    throw new SecurityError('Failed to update session', 500);
  }

  return res.status(200).json({ success: true });
}

async function completeSession(body, res, ctx) {
  const { session_id } = body;
  if (!session_id) throw new SecurityError('session_id required', 400);

  const { data: session } = await supabase
    .from('user_flashcard_sessions')
    .select('*')
    .eq('id', session_id)
    .eq('user_id', ctx.userId)
    .maybeSingle();

  if (!session) throw new SecurityError('Session not found', 404);

  const { error } = await supabase
    .from('user_flashcard_sessions')
    .update({ is_complete: true, completed_at: new Date().toISOString() })
    .eq('id', session_id);

  if (error) {
    console.error('[FLASHCARDS_COMPLETE_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      session_id,
      error: error.message
    }));
    throw new SecurityError('Failed to complete session', 500);
  }

  const correct = (session.cards_correct || []).length;
  const incorrect = (session.cards_incorrect || []).length;
  const total = (session.cards_seen || []).length;

  return res.status(200).json({
    card_count: total,
    correct,
    incorrect,
    score: total ? Math.round((correct / total) * 100) : 0,
  });
}

async function toggleKnown(body, res, ctx) {
  const { flashcard_id } = body;
  if (!flashcard_id) throw new SecurityError('flashcard_id required', 400);

  const { data: existing } = await supabase
    .from('content_reactions')
    .select('id')
    .eq('user_id', ctx.userId)
    .eq('content_type', 'flashcard_card')
    .eq('content_id', flashcard_id)
    .eq('reaction_type', 'bookmark')
    .maybeSingle();

  if (existing) {
    await supabase.from('content_reactions').delete().eq('id', existing.id);
    return res.status(200).json({ known: false });
  }

  await supabase
    .from('content_reactions')
    .insert({
      user_id: ctx.userId,
      content_type: 'flashcard_card',
      content_id: flashcard_id,
      reaction_type: 'bookmark',
    });

  return res.status(200).json({ known: true });
}

async function checkAnswer(body, res, ctx) {
  const { flashcard_id, user_answer, check_type } = body;
  if (!flashcard_id || !user_answer) {
    throw new SecurityError('flashcard_id and user_answer required', 400);
  }

  const { data: card } = await supabase
    .from('flashcard_cards')
    .select('id, deck_id, card_type, back_text, accepted_answers, accepted_functions, mc_options, mc_correct_index')
    .eq('id', flashcard_id)
    .maybeSingle();

  if (!card) throw new SecurityError('Card not found', 404);

  const { data: deck } = await supabase
    .from('flashcard_decks')
    .select('unit_id')
    .eq('id', card.deck_id)
    .maybeSingle();

  if (!deck) throw new SecurityError('Deck not found', 404);

  await requireActionAccess(ctx, {
    actionKey: 'flashcards_check_answer',
    contentType: 'unit',
    contentId: deck.unit_id,
    restrictionType: 'flashcards_use'
  });

  if (card.card_type === 'multiple_choice') {
    const selected = parseInt(user_answer, 10);
    const correct = selected === card.mc_correct_index;
    return res.status(200).json({
      correct,
      strength: correct ? 'excellent' : 'incorrect',
      correct_answer: card.mc_options?.[card.mc_correct_index] || card.back_text,
    });
  }

  const acceptedItems = card.accepted_answers?.length
    ? card.accepted_answers
    : [{ term: card.back_text }];
  const itemsToCheck =
    check_type === 'function' && card.accepted_functions?.length
      ? card.accepted_functions
      : acceptedItems;

  const normalized = user_answer.trim();
  let result = { correct: false, strength: 'incorrect', correct_answer: card.back_text };

  for (const item of itemsToCheck) {
    const term = typeof item === 'string' ? item : item.term;
    if (normalized.toLowerCase() === term.toLowerCase()) {
      result = { correct: true, strength: 'excellent', matched: term };
      break;
    }
    if (normalized.toLowerCase().includes(term.toLowerCase()) && term.length > 3) {
      result = { correct: true, strength: 'strong', matched: term };
      break;
    }
    const dist = levenshteinDistance(normalized.toLowerCase(), term.toLowerCase());
    if (dist <= 2 && term.length > 4) {
      result = { correct: true, strength: 'strong', matched: term };
      break;
    }
  }

  return res.status(200).json(result);
}

function levenshteinDistance(a, b) {
  const matrix = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));
  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;
  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      matrix[j][i] = Math.min(
        matrix[j - 1][i] + 1,
        matrix[j][i - 1] + 1,
        matrix[j - 1][i - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
  }
  return matrix[b.length][a.length];
}

async function seedDegreeSamples(res, ctx) {
  const { data: levels } = await supabase
    .from('curriculum_levels')
    .select('id, display_name')
    .ilike('display_name', '%Pharmacy%Degree%');
  if (!levels?.length) throw new SecurityError('Pharmacy Degree curriculum level not found', 404);

  const { data: groups } = await supabase
    .from('curriculum_groups')
    .select('id')
    .in('level_id', levels.map(level => level.id))
    .eq('is_active', true);
  const groupIds = (groups || []).map(group => group.id);
  if (!groupIds.length) throw new SecurityError('No Pharmacy Degree curriculum groups found', 404);

  const { data: units } = await supabase
    .from('curriculum_units')
    .select('id, name')
    .in('group_id', groupIds)
    .eq('is_active', true)
    .order('display_order', { ascending: true });
  if (!units?.length) throw new SecurityError('No Pharmacy Degree curriculum units found', 404);

  const templates = [
    {
      suffix: 'Core Concepts',
      category: 'Core Pharmacy',
      description: 'Foundational pharmacy concepts for active recall and revision.',
      types: ['flip', 'typed'],
      cards: [
        { card_type: 'flip', front_text: 'What is bioavailability?', back_text: 'The fraction of an administered dose that reaches systemic circulation unchanged.', keywords: ['bioavailability'] },
        { card_type: 'typed', front_text: 'Which route gives complete systemic bioavailability?', back_text: 'Intravenous administration', accepted_answers: [{ term: 'intravenous' }, { term: 'IV' }] },
        { card_type: 'flip', front_text: 'What is pharmacokinetics?', back_text: 'The study of what the body does to a drug through absorption, distribution, metabolism and excretion.', keywords: ['ADME', 'pharmacokinetics'] },
        { card_type: 'typed', front_text: 'Name the four major pharmacokinetic processes.', back_text: 'Absorption, distribution, metabolism and excretion', accepted_answers: [{ term: 'absorption' }, { term: 'distribution' }, { term: 'metabolism' }, { term: 'excretion' }] }
      ]
    },
    {
      suffix: 'Clinical Pharmacology',
      category: 'Clinical Pharmacy',
      description: 'Clinical concepts linking medicines, mechanisms, effects and patient care.',
      types: ['flip', 'typed', 'multiple_choice'],
      cards: [
        { card_type: 'multiple_choice', front_text: 'Which process converts many drugs into more water-soluble metabolites?', back_text: 'Drug metabolism', mc_options: ['Drug metabolism', 'Drug distribution', 'Drug absorption', 'Drug storage'], mc_correct_index: 0 },
        { card_type: 'typed', front_text: 'What is a drug agonist?', back_text: 'A substance that binds to a receptor and activates it.', accepted_answers: [{ term: 'agonist' }, { term: 'activates a receptor' }] },
        { card_type: 'flip', front_text: 'What is therapeutic index?', back_text: 'A measure comparing toxic dose with effective dose and used as an indicator of relative drug safety.', keywords: ['therapeutic index'] },
        { card_type: 'multiple_choice', front_text: 'Which organ is the major site of metabolism for many medicines?', back_text: 'Liver', mc_options: ['Liver', 'Spleen', 'Skin', 'Bone'], mc_correct_index: 0 }
      ]
    },
    {
      suffix: 'Medicinal Chemistry',
      category: 'Medicinal Chemistry',
      description: 'Drug structure, functional groups and structure activity concepts.',
      types: ['flip', 'structure_identification'],
      cards: [
        { card_type: 'structure_identification', front_text: 'Identify the functional group with a carbonyl carbon bonded directly to nitrogen.', back_text: 'Amide', structure_name: 'Amide', hint: 'Look for C(=O) attached directly to nitrogen.', accepted_answers: [{ term: 'amide' }] },
        { card_type: 'structure_identification', front_text: 'Identify the functional group formed when a hydroxyl group is directly attached to an aromatic ring.', back_text: 'Phenol', structure_name: 'Phenol', hint: 'The hydroxyl group is directly attached to an aromatic ring.', accepted_answers: [{ term: 'phenol' }] },
        { card_type: 'flip', front_text: 'What is structure activity relationship analysis?', back_text: 'The study of how changes in chemical structure affect biological activity.', keywords: ['SAR', 'structure activity relationship'] },
        { card_type: 'structure_identification', front_text: 'Identify the functional group containing C(=O)O in an ester linkage.', back_text: 'Ester', structure_name: 'Ester', hint: 'Look for C(=O)O.', accepted_answers: [{ term: 'ester' }] }
      ]
    },
    {
      suffix: 'Pharmacology Quick Review',
      category: 'Pharmacology',
      description: 'High yield medicine and receptor review for pharmacy degree study.',
      types: ['multiple_choice', 'typed', 'flip'],
      cards: [
        { card_type: 'multiple_choice', front_text: 'Which receptor type directly regulates gene transcription after ligand binding?', back_text: 'Intracellular receptor', mc_options: ['Intracellular receptor', 'Ligand gated ion channel', 'G protein coupled receptor', 'Voltage gated channel'], mc_correct_index: 0 },
        { card_type: 'typed', front_text: 'What does half life mean in pharmacokinetics?', back_text: 'The time required for the concentration or amount of a drug in the body to decrease by half.', accepted_answers: [{ term: 'half life' }, { term: 'half-life' }] },
        { card_type: 'flip', front_text: 'What is a competitive antagonist?', back_text: 'A drug that binds to a receptor and reduces agonist action by competing for the same binding site.', keywords: ['competitive antagonist'] },
        { card_type: 'multiple_choice', front_text: 'Which route generally avoids first pass hepatic metabolism?', back_text: 'Sublingual administration', mc_options: ['Oral administration', 'Sublingual administration', 'Gastric administration', 'Jejunal administration'], mc_correct_index: 1 }
      ]
    }
  ];

  let createdDecks = 0;
  let createdCards = 0;

  for (const unit of units) {
    for (const template of templates) {
      const title = `${unit.name}: ${template.suffix}`;
      const { data: existing } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('unit_id', unit.id)
        .eq('title', title)
        .maybeSingle();
      if (existing) continue;

      const { data: deck, error: deckError } = await supabase
        .from('flashcard_decks')
        .insert({
          title,
          description: template.description,
          category: template.category,
          unit_id: unit.id,
          difficulty_confidence: { level: 'degree', sample: true },
          card_types: template.types,
          is_active: true,
          created_by: ctx.userId
        })
        .select('id')
        .single();
      if (deckError || !deck) continue;

      const rows = template.cards.map((card, index) => buildCardRow(deck.id, card, index));
      const { error: cardError } = await supabase.from('flashcard_cards').insert(rows);
      if (cardError) {
        await supabase.from('flashcard_decks').delete().eq('id', deck.id);
        continue;
      }
      createdDecks += 1;
      createdCards += rows.length;
    }
  }

  return res.status(200).json({
    success: true,
    units: units.length,
    created_decks: createdDecks,
    created_cards: createdCards
  });
}

async function createDeck(body, res, ctx) {
  const { title, description, category, unit_id, difficulty_confidence, card_types, cards } = body;
  if (!title || !category || !unit_id) {
    throw new SecurityError('title, category, unit_id required', 400);
  }

  const { data: unit } = await supabase
    .from('curriculum_units')
    .select('id')
    .eq('id', unit_id)
    .maybeSingle();

  if (!unit) throw new SecurityError('Curriculum unit not found', 404);

  const { data: deck, error: deckError } = await supabase
    .from('flashcard_decks')
    .insert({
      title,
      description: description || '',
      category,
      unit_id,
      difficulty_confidence: difficulty_confidence || null,
      card_types: card_types || ['flip'],
      is_active: true,
      created_by: ctx.userId,
    })
    .select()
    .single();

  if (deckError || !deck) {
    console.error('[FLASHCARDS_CREATE_DECK_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      error: deckError?.message
    }));
    throw new SecurityError('Failed to create deck', 500);
  }

  if (cards?.length) {
    const { error: cardsError } = await supabase.from('flashcard_cards').insert(cards.map((c, i) => buildCardRow(deck.id, c, i)));

    if (cardsError) {
      console.error('[FLASHCARDS_CREATE_CARDS_ERROR]', JSON.stringify({
        user_id: ctx.userId,
        deck_id: deck.id,
        error: cardsError.message
      }));
    }
  }

  return res.status(200).json({ success: true, deck_id: deck.id });
}

async function updateDeck(body, res, ctx) {
  const { deck_id, ...updates } = body;
  if (!deck_id) throw new SecurityError('deck_id required', 400);

  if (updates.cards) {
    await supabase.from('flashcard_cards').delete().eq('deck_id', deck_id);
    if (updates.cards.length) {
      await supabase
        .from('flashcard_cards')
        .insert(updates.cards.map((c, i) => buildCardRow(deck_id, c, i)));
    }
    delete updates.cards;
  }

  updates.updated_at = new Date().toISOString();

  const { error } = await supabase.from('flashcard_decks').update(updates).eq('id', deck_id);

  if (error) {
    console.error('[FLASHCARDS_UPDATE_DECK_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: error.message
    }));
    throw new SecurityError('Failed to update deck', 500);
  }

  return res.status(200).json({ success: true });
}

async function deleteDeck(body, res, ctx) {
  const { deck_id } = body;
  if (!deck_id) throw new SecurityError('deck_id required', 400);

  const { error } = await supabase.from('flashcard_decks').delete().eq('id', deck_id);

  if (error) {
    console.error('[FLASHCARDS_DELETE_DECK_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: error.message
    }));
    throw new SecurityError('Failed to delete deck', 500);
  }

  return res.status(200).json({ success: true });
}

async function addCards(body, res, ctx) {
  const { deck_id, cards } = body;
  if (!deck_id || !cards?.length) throw new SecurityError('deck_id and cards required', 400);

  const { count } = await supabase
    .from('flashcard_cards')
    .select('id', { count: 'exact', head: true })
    .eq('deck_id', deck_id);

  const { error } = await supabase
    .from('flashcard_cards')
    .insert(cards.map((c, i) => buildCardRow(deck_id, c, (count || 0) + i)));

  if (error) {
    console.error('[FLASHCARDS_ADD_CARDS_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      deck_id,
      error: error.message
    }));
    throw new SecurityError('Failed to add cards', 500);
  }

  return res.status(200).json({ success: true });
}

async function removeCard(body, res, ctx) {
  const { card_id } = body;
  if (!card_id) throw new SecurityError('card_id required', 400);

  const { error } = await supabase.from('flashcard_cards').delete().eq('id', card_id);

  if (error) {
    console.error('[FLASHCARDS_REMOVE_CARD_ERROR]', JSON.stringify({
      user_id: ctx.userId,
      card_id,
      error: error.message
    }));
    throw new SecurityError('Failed to remove card', 500);
  }

  return res.status(200).json({ success: true });
}

function buildCardRow(deckId, card, position) {
  return {
    deck_id: deckId,
    front_text: card.front_text || '',
    back_text: card.back_text || '',
    image_url: card.image_url || null,
    audio_url: card.audio_url || null,
    position,
    card_type: card.card_type || 'flip',
    accepted_answers: card.accepted_answers || [],
    accepted_functions: card.accepted_functions || [],
    keywords: card.keywords || [],
    mc_options: card.mc_options || [],
    mc_correct_index: card.mc_correct_index ?? null,
    structure_name: card.structure_name || null,
    hint: card.hint || null,
  };
}
