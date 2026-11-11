const STAGE_META = {
  notes: {
    title: 'Continue reading',
    description: 'Move into the next connected explanation.',
    icon: 'book-open'
  },
  pdfs: {
    title: 'Explore reference material',
    description: 'Deepen the topic with supporting documents.',
    icon: 'file-pdf'
  },
  recall: {
    title: 'Recall what you know',
    description: 'Bring important ideas back to mind without looking at your notes.',
    icon: 'brain'
  },
  flashcards: {
    title: 'Reinforce key ideas',
    description: 'Strengthen definitions, facts and important relationships.',
    icon: 'layer-group'
  },
  quiz: {
    title: 'Check your understanding',
    description: 'Apply what you have learned to structured questions.',
    icon: 'clipboard-check'
  },
  papers: {
    title: 'Apply it in examinations',
    description: 'Practise with examination papers connected to this learning area.',
    icon: 'file-lines'
  }
};

function contentId(item) {
  return item?.content_id ?? item?.id ?? null;
}

function normalizeItems(items) {
  return (Array.isArray(items) ? items : [])
    .filter((item) => contentId(item) !== null && contentId(item) !== undefined)
    .map((item) => ({
      ...item,
      id: String(contentId(item)),
      title: item.title || item.question_text || 'Untitled learning resource'
    }));
}

function createQuery(values) {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, String(value));
    }
  });
  return params.toString();
}

export function buildLearningStages({
  source = [],
  noteId = null,
  internalLinks = null,
  unitId = null,
  nodeType = '',
  returnTo = '',
  excludeStages = []
}) {
  const items = Array.isArray(source) ? source : [];
  const byType = (type) => normalizeItems(items.filter((item) => item.content_type === type));
  const noteItems = byType('note').filter((item) => String(item.id) !== String(noteId || ''));
  const relatedNotes = (internalLinks?.related_links || [])
    .filter((item) => item.target_note_id && String(item.target_note_id) !== String(noteId || ''))
    .map((item) => ({
      id: String(item.target_note_id),
      title: item.target_title || 'Related reading',
      preview: item.target_content_preview || '',
      read_time: item.target_read_time || ''
    }));
  const uniqueNotes = [...noteItems, ...relatedNotes].filter((item, index, allItems) => (
    allItems.findIndex((candidate) => String(candidate.id) === String(item.id)) === index
  ));

  const themeFlashcardCount = Number(internalLinks?.theme_activities?.flashcards?.deck_count || 0);
  const noteDecks = Array.isArray(internalLinks?.activities?.flashcards)
    ? internalLinks.activities.flashcards
    : [];
  const unitDecks = byType('flashcard_deck');
  const decks = normalizeItems(noteId && noteDecks.length ? noteDecks : unitDecks);
  const themeDecksAvailable = Boolean(internalLinks?.theme_activities?.theme_id && themeFlashcardCount > 0);
  const noteQuizCount = Number(internalLinks?.activities?.quiz?.question_count || 0);
  const themeQuizCount = Number(internalLinks?.theme_activities?.quiz?.question_count || 0);
  const linkedQuizCount = byType('quiz_question').length;
  const noteRecallCount = Number(internalLinks?.activities?.recall?.question_count || 0);
  const themeRecallCount = Number(internalLinks?.theme_activities?.recall?.question_count || 0);
  const linkedRecallCount = byType('recall_question').length;
  const themeId = internalLinks?.theme_activities?.theme_id || null;
  const themeQuizAvailable = Boolean(themeId && themeQuizCount > 0);
  const themeRecallAvailable = Boolean(themeId && themeRecallCount > 0);
  const scope = ['theme', 'subtopic'].includes(String(nodeType).toLowerCase()) ? 'theme' : 'lesson';

  const quizCount = noteQuizCount || (themeQuizAvailable ? themeQuizCount : linkedQuizCount);
  const quizUnitId = noteQuizCount ? unitId : (themeQuizAvailable ? themeId : unitId);
  const quizScope = noteQuizCount ? 'note' : (themeQuizAvailable ? 'theme' : scope);
  const quizQuery = createQuery({
    unit_id: quizUnitId,
    note_id: noteQuizCount ? noteId : null,
    activity_scope: quizScope
  });

  const recallCount = noteRecallCount || (themeRecallAvailable ? themeRecallCount : linkedRecallCount);
  const recallUnitId = noteRecallCount ? unitId : (themeRecallAvailable ? themeId : unitId);
  const recallScope = noteRecallCount ? 'note' : (themeRecallAvailable ? 'theme' : scope);
  const recallQuery = createQuery({
    unit_id: recallUnitId,
    note_id: noteRecallCount ? noteId : null,
    activity_scope: recallScope,
    resume: '1'
  });

  const flashcardQuery = (deckId, deckIsNoteSpecific) => createQuery({
    unit_id: unitId,
    note_id: deckIsNoteSpecific ? noteId : null,
    deck_id: deckId,
    activity_scope: deckIsNoteSpecific ? 'note' : scope
  });

  const result = [
    {
      key: 'notes',
      items: uniqueNotes.map((item) => ({
        ...item,
        to: '/notes/read?id=' + encodeURIComponent(item.id) + (returnTo ? '&return_to=' + encodeURIComponent(returnTo) : '')
      }))
    },
    {
      key: 'pdfs',
      items: byType('pdf_resource').map((item) => ({ ...item, action: 'pdf' }))
    },
    {
      key: 'recall',
      items: recallCount > 0 && recallUnitId
        ? [{ id: 'recall-' + recallUnitId, title: 'Active recall practice', detail: recallCount + ' linked prompts', to: '/recall?' + recallQuery }]
        : []
    },
    {
      key: 'flashcards',
      items: decks.length ? decks.map((deck) => ({
        ...deck,
        detail: deck.description || ((Number(deck.card_count) || 0) + ' flashcards'),
        to: '/flashcards?' + flashcardQuery(deck.id, Boolean(noteId && noteDecks.length))
      })) : themeDecksAvailable ? [{
        id: 'theme-flashcards-' + internalLinks.theme_activities.theme_id,
        title: 'Theme-wide flashcards',
        detail: themeFlashcardCount + ' available decks',
        to: '/flashcards?' + createQuery({
          unit_id: internalLinks.theme_activities.theme_id,
          activity_scope: 'theme'
        })
      }] : []
    },
    {
      key: 'quiz',
      items: quizCount > 0 && quizUnitId
        ? [{ id: 'quiz-' + quizUnitId, title: 'Quiz practice', detail: quizCount + ' linked questions', to: '/quiz/blocks?' + quizQuery }]
        : []
    },
    {
      key: 'papers',
      items: byType('past_paper').map((item) => ({ ...item, action: 'paper' }))
    }
  ];

  const stageOrder = ['notes', 'flashcards', 'recall', 'quiz', 'papers', 'pdfs'];
  const excluded = new Set(excludeStages);

  return result
    .filter((stage) => !excluded.has(stage.key))
    .sort((a, b) => stageOrder.indexOf(a.key) - stageOrder.indexOf(b.key))
    .map((stage) => ({ ...stage, meta: STAGE_META[stage.key] }))
    .filter((stage) => stage.items.length > 0);
}
