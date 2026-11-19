import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon/Icon';
import { globalSearch, searchNotes } from '../../api/client';
import { useLayout } from '../../contexts/LayoutContext';
import DOMPurify from 'dompurify';

const CATEGORIES = [
  { key: 'note', label: 'Notes', icon: 'book-open', path: (item) => `/notes/read?id=${item.id}` },
  { key: 'glossary_term', label: 'Glossary', icon: 'book-open', path: (item) => `/glossary/${item.slug}` },
  { key: 'past_paper', label: 'Past Papers', icon: 'file-lines', path: () => '/past-papers' },
  { key: 'flashcard_deck', label: 'Flashcards', icon: 'layer-group', path: () => '/flashcards' },
  { key: 'curriculum_unit', label: 'Quizzes', icon: 'clipboard-check', path: () => '/quiz' }
];

export default function SearchOverlay({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);
  const focusTimeoutRef = useRef(null);
  const navigate = useNavigate();
  const { level, activeGroupId } = useLayout();

  useEffect(() => {
    clearTimeout(focusTimeoutRef.current);

    if (open) {
      focusTimeoutRef.current = setTimeout(() => inputRef.current?.focus(), 150);
    } else {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
      setQuery('');
      setResults(null);
      setLoading(false);
    }

    return () => clearTimeout(focusTimeoutRef.current);
  }, [open]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'Escape') onClose();
    };

    if (open) document.addEventListener('keydown', handler);

    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current);
      clearTimeout(focusTimeoutRef.current);
    };
  }, []);

  const runSearch = useCallback((value) => {
    clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setResults(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const trimmedQuery = value.trim();

      try {
        const [globalResults, noteResults] = await Promise.allSettled([
          globalSearch(trimmedQuery, activeGroupId ? { group_id: activeGroupId } : {}),
          searchNotes(trimmedQuery, 20)
        ]);

        const globalData = globalResults.status === 'fulfilled' ? globalResults.value : { results: [] };
        const otherResults = (globalData.results || []).filter(
          (item) => item.type !== 'note'
        );

        const fullTextNotes = noteResults.status === 'fulfilled'
          ? noteResults.value.map((note) => ({
              type: 'note',
              id: note.id,
              title: note.title,
              preview: note.snippet || note.content_preview || '',
              slug: note.slug,
              read_time: note.read_time,
              word_count: note.word_count
            }))
          : [];

        const mergedResults = [...otherResults, ...fullTextNotes];

        setResults({ results: mergedResults });
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
  }, [activeGroupId]);

  function handleChange(event) {
    setQuery(event.target.value);
    runSearch(event.target.value);
  }

  function handleResultClick(url) {
    onClose();
    navigate(url);
  }

  const hasResults = results?.results?.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="search-overlay relative z-30 mx-auto w-full max-w-7xl border-b border-slate-200 bg-white px-3 py-3 shadow-lg sm:px-6 sm:py-4" style={{ position: "relative", inset: "auto", width: "100%", maxWidth: "80rem", margin: "0 auto", background: "#fff", zIndex: 30 }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          <div className="search-input-wrapper flex w-full items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-2 shadow-inner" style={{ display: "flex", width: "100%", alignItems: "center", gap: "0.5rem" }}>
            <Icon name="magnifying-glass" className="search-input-icon shrink-0 text-slate-500" />
            <input
              ref={inputRef}
              type="text"
              className="search-input block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder={`Search ${level?.display_name || ''} resources...`}
              value={query}
              onChange={handleChange}
            />
            <button className="search-close inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100" onClick={onClose} aria-label="Close search" type="button">
              <Icon name="xmark" />
            </button>
          </div>

          {loading && (
            <div className="search-results search-loading mt-3 flex min-h-16 items-center justify-center rounded-xl border border-slate-100 bg-white p-4">
              <div className="spinner" />
            </div>
          )}

          {!loading && hasResults && (
            <div className="search-results mt-3 max-h-[65vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
              {CATEGORIES.map((category) => {
                const items = results.results.filter((item) => item.type === category.key);

                if (!items.length) return null;

                return (
                  <div key={category.key} className="search-result-group mb-3 last:mb-0">
                    <div className="search-result-group-label mb-2 px-2 text-xs font-bold uppercase tracking-wider text-slate-500">{category.label}</div>

                    {items.map((item, idx) => (
                      <button
                        key={idx}
                        className="search-result-item flex w-full items-center gap-3 rounded-xl p-3 text-left transition hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600" type="button"
                        onClick={() => handleResultClick(category.path(item))}
                      >
                        <Icon name={category.icon === 'dna' ? 'microscope' : category.icon} className="search-result-icon shrink-0 text-blue-700" />
                        <div className="search-result-content min-w-0 flex-1">
                          <div className="search-result-title truncate font-semibold text-slate-800">{item.title}</div>
                          {item.preview && (
                            <div
                              className="search-result-meta mt-1 line-clamp-2 text-sm leading-5 text-slate-600"
                              dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(item.preview)
                              }}
                            />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}

          {!loading && query.length >= 2 && !hasResults && (
            <div className="search-results">
              <div className="search-empty rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">No results for "{query}"</div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
