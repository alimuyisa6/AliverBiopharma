import {
  getNotesList,
  getPdfsByLevel
} from '../api/client';
import { getCached, setCache } from './cache';

const activePrefetches = new Map();
const completedScopes = new Set();
const PREFETCH_SESSION_KEY = 'aliver:learning-prefetch:v1';

function canPrefetch() {
  if (typeof window === 'undefined' || document.visibilityState !== 'visible') {
    return false;
  }

  const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

  if (connection?.saveData) return false;
  if (['slow-2g', '2g', '3g'].includes(connection?.effectiveType)) return false;
  if (typeof connection?.downlink === 'number' && connection.downlink < 1.5) return false;
  if (typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 2) return false;

  return true;
}

function hasCompletedScope(scope) {
  if (completedScopes.has(scope)) return true;

  try {
    const stored = JSON.parse(sessionStorage.getItem(PREFETCH_SESSION_KEY) || '[]');
    if (stored.includes(scope)) {
      completedScopes.add(scope);
      return true;
    }
  } catch {}

  return false;
}

function markCompletedScope(scope) {
  completedScopes.add(scope);

  try {
    const stored = JSON.parse(sessionStorage.getItem(PREFETCH_SESSION_KEY) || '[]');
    const next = [...new Set([...stored, scope])].slice(-20);
    sessionStorage.setItem(PREFETCH_SESSION_KEY, JSON.stringify(next));
  } catch {}
}

function scheduleIdle(callback) {
  if (typeof window === 'undefined') return () => {};

  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(callback, { timeout: 6000 });
    return () => window.cancelIdleCallback(id);
  }

  const id = window.setTimeout(callback, 1800);
  return () => window.clearTimeout(id);
}

export function prefetchLearningPages({ userId, level, className, groupId }) {
  if (!userId || !canPrefetch()) return Promise.resolve();

  const scope = `${userId}:${groupId || ''}:${level || ''}:${className || ''}`;

  if (hasCompletedScope(scope)) return Promise.resolve();
  if (activePrefetches.has(scope)) return activePrefetches.get(scope);

  const task = (async () => {
    const notesKey = `notes_page_${userId}:${level || ''}:${className || ''}:all`;
    const pdfScope = groupId || `${level || ''}:${className || ''}`;
    const pdfsKey = `pdfs_page_${userId}:${pdfScope}:all`;
    const jobs = [];

    if (getCached(notesKey) === null) {
      jobs.push(
        getNotesList(null, { priority: 'background' }).then((data) => {
          setCache(notesKey, Array.isArray(data) ? data : []);
        })
      );
    }

    if (getCached(pdfsKey) === null) {
      jobs.push(
        getPdfsByLevel(null, groupId, pdfScope, { priority: 'background' }).then((data) => {
          setCache(pdfsKey, Array.isArray(data) ? data : []);
        })
      );
    }

    await Promise.allSettled(jobs);
    markCompletedScope(scope);
  })().finally(() => {
    activePrefetches.delete(scope);
  });

  activePrefetches.set(scope, task);
  return task;
}

export function scheduleLearningPagePrefetch(options) {
  if (!canPrefetch()) return () => {};

  return scheduleIdle(() => {
    if (canPrefetch()) prefetchLearningPages(options).catch(() => {});
  });
}
