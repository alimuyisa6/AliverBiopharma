import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { getPdfDownloadUrl, getPastPaperDownloadUrl } from '../../api/client';
import { getCurriculumNode } from '../../api/curriculumNavigation';
import './LearningJourney.css';

const journeyCache = new Map();

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
    icon: 'layers'
  },
  quiz: {
    title: 'Check your understanding',
    description: 'Apply what you have learned to structured questions.',
    icon: 'clipboard-check'
  },
  papers: {
    title: 'Apply it in examinations',
    description: 'Practise with examination papers connected to this learning area.',
    icon: 'file-text'
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

export default function LearningJourney({
  unitId,
  noteId = null,
  internalLinks = null,
  linkedContent: suppliedLinkedContent,
  nodeName = '',
  nodeType = '',
  returnTo = ''
}) {
  const [fetchedLinkedContent, setFetchedLinkedContent] = useState(() => (
    unitId ? journeyCache.get(String(unitId)) ?? null : []
  ));
  const [loading, setLoading] = useState(Boolean(unitId) && !Array.isArray(suppliedLinkedContent) && !journeyCache.has(String(unitId)));
  const [downloadId, setDownloadId] = useState(null);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (Array.isArray(suppliedLinkedContent)) {
      setFetchedLinkedContent(suppliedLinkedContent);
      setLoading(false);
      return undefined;
    }

    if (!unitId) {
      setFetchedLinkedContent([]);
      setLoading(false);
      return undefined;
    }

    let active = true;
    const key = String(unitId);
    const cached = journeyCache.get(key);

    if (cached) {
      setFetchedLinkedContent(cached);
      setLoading(false);
    } else {
      setLoading(true);
    }

    getCurriculumNode(unitId)
      .then((result) => {
        if (!active) return;
        const items = Array.isArray(result?.linked_content) ? result.linked_content : [];
        journeyCache.set(key, items);
        setFetchedLinkedContent(items);
      })
      .catch(() => {
        if (active && !cached) setFetchedLinkedContent([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [unitId, suppliedLinkedContent]);

  const stages = useMemo(() => {
    const source = Array.isArray(suppliedLinkedContent) ? suppliedLinkedContent : fetchedLinkedContent;
    const byType = (type) => normalizeItems(source.filter((item) => item.content_type === type));
    const noteItems = byType('note').filter((item) => String(item.id) !== String(noteId || ''));
    const relatedNotes = (internalLinks?.related_links || [])
      .filter((item) => item.target_note_id && String(item.target_note_id) !== String(noteId || ''))
      .map((item) => ({
        id: String(item.target_note_id),
        title: item.target_title || 'Related reading',
        preview: item.target_content_preview || '',
        read_time: item.target_read_time || ''
      }));
    const uniqueNotes = [...noteItems, ...relatedNotes].filter((item, index, items) => (
      items.findIndex((candidate) => String(candidate.id) === String(item.id)) === index
    ));

    const noteDecks = Array.isArray(internalLinks?.activities?.flashcards)
      ? internalLinks.activities.flashcards
      : [];
    const decks = normalizeItems(noteId && noteDecks.length ? noteDecks : byType('flashcard_deck'));
    const noteQuizCount = Number(internalLinks?.activities?.quiz?.question_count || 0);
    const themeQuizCount = Number(internalLinks?.theme_activities?.quiz?.question_count || 0);
    const linkedQuizCount = byType('quiz_question').length;
    const noteRecallCount = Number(internalLinks?.activities?.recall?.question_count || 0);
    const themeRecallCount = Number(internalLinks?.theme_activities?.recall?.question_count || 0);
    const linkedRecallCount = byType('recall_question').length;
    const themeId = internalLinks?.theme_activities?.theme_id || null;
    const themeScope = Boolean(themeId && (themeQuizCount || themeRecallCount));
    const scope = ['theme', 'subtopic'].includes(String(nodeType).toLowerCase()) ? 'theme' : 'lesson';

    const quizCount = noteQuizCount || (themeScope ? themeQuizCount : linkedQuizCount);
    const quizUnitId = noteQuizCount ? unitId : (themeScope ? themeId : unitId);
    const quizScope = noteQuizCount ? 'note' : (themeScope ? 'theme' : scope);
    const quizQuery = createQuery({
      unit_id: quizUnitId,
      note_id: noteQuizCount ? noteId : null,
      activity_scope: quizScope
    });

    const recallCount = noteRecallCount || (themeScope ? themeRecallCount : linkedRecallCount);
    const recallUnitId = noteRecallCount ? unitId : (themeScope ? themeId : unitId);
    const recallScope = noteRecallCount ? 'note' : (themeScope ? 'theme' : scope);
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
        items: decks.map((deck) => ({
          ...deck,
          detail: deck.description || ((Number(deck.card_count) || 0) + ' flashcards'),
          to: '/flashcards?' + flashcardQuery(deck.id, Boolean(noteId && noteDecks.length))
        }))
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

    return result
      .map((stage) => ({ ...stage, meta: STAGE_META[stage.key] }))
      .filter((stage) => stage.items.length > 0);
  }, [suppliedLinkedContent, fetchedLinkedContent, noteId, internalLinks, unitId, nodeType, returnTo]);

  async function openDownload(item, type) {
    const key = type + '-' + item.id;
    if (downloadId) return;

    const popup = window.open('about:blank', '_blank');
    if (popup) popup.opener = null;

    setDownloadId(key);
    setActionError('');

    try {
      const result = type === 'pdf'
        ? await getPdfDownloadUrl(item.id)
        : await getPastPaperDownloadUrl(item.id);

      if (!result?.url) throw new Error('A download link was not returned.');

      if (popup) {
        popup.location.href = result.url;
      } else {
        const link = document.createElement('a');
        link.href = result.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (error) {
      if (popup) popup.close();
      setActionError(error?.message || 'This resource could not be opened. Please try again.');
    } finally {
      setDownloadId(null);
    }
  }

  if (loading) {
    return (
      <section className="learning-journey" aria-live="polite">
        <div className="learning-journey-heading">
          <span className="learning-journey-eyebrow">Keep learning</span>
          <h2>Finding your next steps</h2>
          <p>Connecting the reading, revision and practice materials for this learning area.</p>
        </div>
        <div className="learning-journey-loading" />
      </section>
    );
  }

  if (!stages.length) return null;

  return (
    <section className="learning-journey" aria-labelledby="learning-journey-title">
      <div className="learning-journey-heading">
        <span className="learning-journey-eyebrow">Keep learning</span>
        <h2 id="learning-journey-title">Continue exploring{nodeName ? ' ' + nodeName : ''}</h2>
        <p>These materials are connected to the same curriculum area, so you can move naturally from reading to revision and exam practice.</p>
      </div>

      <div className="learning-journey-flow">
        {stages.map((stage, index) => (
          <section className="learning-journey-stage" key={stage.key} aria-labelledby={'learning-journey-' + stage.key}>
            <div className="learning-journey-stage-marker" aria-hidden="true">
              <span>{String(index + 1).padStart(2, '0')}</span>
            </div>
            <div className="learning-journey-stage-content">
              <div className="learning-journey-stage-heading">
                <span className="learning-journey-stage-icon"><Icon name={stage.meta.icon} /></span>
                <div>
                  <span className="learning-journey-stage-step">Stage {String(index + 1).padStart(2, '0')}</span>
                  <h3 id={'learning-journey-' + stage.key}>{stage.meta.title}</h3>
                  <p>{stage.meta.description}</p>
                </div>
                <span className="learning-journey-stage-count">{stage.items.length} {stage.items.length === 1 ? 'resource' : 'resources'}</span>
              </div>

              <div className="learning-journey-items">
                {stage.items.map((item) => {
                  const content = (
                    <>
                      <span className="learning-journey-item-copy">
                        <strong>{item.title}</strong>
                        {item.detail && <small>{item.detail}</small>}
                        {item.preview && <small>{item.preview}</small>}
                      </span>
                      <span className="learning-journey-item-action">
                        {item.action
                          ? downloadId === item.action + '-' + item.id ? 'Opening…' : item.action === 'pdf' ? 'Open PDF' : 'Download paper'
                          : 'Continue'}
                        <Icon name="arrow-right" />
                      </span>
                    </>
                  );

                  return item.action ? (
                    <button
                      type="button"
                      className="learning-journey-item"
                      key={stage.key + '-' + item.id}
                      onClick={() => openDownload(item, item.action)}
                      disabled={Boolean(downloadId)}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link
                      className="learning-journey-item"
                      key={stage.key + '-' + item.id}
                      to={item.to}
                    >
                      {content}
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        ))}
      </div>

      {actionError && <p className="learning-journey-error" role="alert">{actionError}</p>}
    </section>
  );
}
