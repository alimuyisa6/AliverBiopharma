import {
  getNotesList,
  getFlashcardDecks,
  getKnownFlashcards,
  getPdfsByLevel,
  getPastPapers,
  listQuizTopics
} from '../api/client';
import { getCached, setCache } from './cache';

const activePrefetches = new Map();

function scheduleIdle(callback) {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 4000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 1200);
  return () => window.clearTimeout(id);
}

export function prefetchLearningPages({
  userId,
  level,
  className,
  groupId
}) {
  if (!userId) return Promise.resolve();

  const scope = `${userId}:${groupId || ''}:${level || ''}:${className || ''}`;
  if (activePrefetches.has(scope)) return activePrefetches.get(scope);

  const task = (async () => {
    const notesKey = `notes_page_${userId}:${level || ''}:${className || ''}:all`;
    const flashcardsKey = `flashcards_page_${userId}:${level || ''}:${className || ''}:all:no-note:default-scope`;
    const pdfScope = groupId || `${level || ''}:${className || ''}`;
    const pdfsKey = `pdfs_page_${userId}:${pdfScope}:all`;
    const filters = {
      subject: '',
      year: '',
      exam_board: '',
      paper_type: ''
    };
    const papersKey = `papers_page_papers:${userId}::${level || ''}:${className || ''}:all:1::year_desc:${JSON.stringify(filters)}`;
    const quizKey = `quiz_topics_page_${userId}:${groupId || 'all'}:all:no-note:default`;

    const jobs = [];

    if (getCached(notesKey) === null) {
      jobs.push(
        getNotesList(null).then((data) => {
          setCache(notesKey, Array.isArray(data) ? data : []);
        })
      );
    }

    if (getCached(pdfsKey) === null) {
      jobs.push(
        getPdfsByLevel(null, groupId, pdfScope).then((data) => {
          setCache(pdfsKey, Array.isArray(data) ? data : []);
        })
      );
    }

    await Promise.allSettled(jobs);

    const secondaryJobs = [];

    if (getCached(flashcardsKey) === null) {
      secondaryJobs.push(
        Promise.all([
          getKnownFlashcards(),
          getFlashcardDecks({})
        ]).then(([knownData, deckData]) => {
          setCache(flashcardsKey, {
            knownIds: Array.isArray(knownData) ? knownData : [],
            decks: Array.isArray(deckData) ? deckData : []
          });
        })
      );
    }

    if (getCached(papersKey) === null) {
      secondaryJobs.push(
        getPastPapers({
          page: 1,
          limit: 12,
          ...(level ? { level } : {}),
          ...(className ? { class_name: className } : {}),
          sort: 'year_desc'
        }).then((result) => {
          setCache(papersKey, {
            papers: result?.papers || [],
            totalPages: result?.total_pages || 1,
            total: result?.total || 0
          });
        })
      );
    }

    if (getCached(quizKey) === null) {
      secondaryJobs.push(
        listQuizTopics().then((result) => {
          setCache(quizKey, Array.isArray(result?.topics) ? result.topics : []);
        })
      );
    }

    await Promise.allSettled(secondaryJobs);
  })().finally(() => {
    activePrefetches.delete(scope);
  });

  activePrefetches.set(scope, task);
  return task;
}

export function scheduleLearningPagePrefetch(options) {
  return scheduleIdle(() => {
    prefetchLearningPages(options).catch(() => {});
  });
}
