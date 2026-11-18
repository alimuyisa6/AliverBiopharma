import AdSlot from '../components/Advertising/AdSlot';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
import { useAuth } from '../contexts/AuthContext';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useLayout } from '../contexts/LayoutContext';
import { getNotesList as getNotesStructure } from '../api/client';
import { getCurriculumNode } from '../api/curriculumNavigation';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import { getCachedStale, setCache } from '../utils/cache';
import { normalizeCurriculumResponse, buildCurriculumPath, formatResourceCount } from '../utils/notesPage';

const notesPageCache = new Map();
const notesContextCache = new Map();

export default function NotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const access = useContentAccess();
  const { user } = useAuth();
  const { level, class_name, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const unitId = searchParams.get('unit_id');

  const cacheKey = `${user?.id || 'guest'}:${level || ''}:${class_name || ''}:${unitId || 'all'}`;
  const [notes, setNotes] = useState(() => getCachedStale(`notes_page_${cacheKey}`) || notesPageCache.get(cacheKey) || []);
  const [curriculumContext, setCurriculumContext] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(() => !getCachedStale(`notes_page_${cacheKey}`) && !notesPageCache.has(cacheKey));
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const cachedNotes = getCachedStale(`notes_page_${cacheKey}`) || notesPageCache.get(cacheKey);

    if (cachedNotes) {
      setNotes(cachedNotes);
      setLoading(false);
      setError(null);
      loadContent(() => mounted, false);
    } else {
      setLoading(true);
      loadContent(() => mounted, true);
    }

    return () => { mounted = false; };
  }, [access.canAccess, user?.id, level, class_name, unitId]);

  useEffect(() => {
    if (!access.canAccess || !unitId) {
      setCurriculumContext(null);
      setContextLoading(false);
      return;
    }

    let mounted = true;
    const cachedContext = notesContextCache.get(unitId);
    if (cachedContext) {
      setCurriculumContext(cachedContext);
      setContextLoading(false);
    } else {
      setContextLoading(true);
    }

    getCurriculumNode(unitId)
      .then((data) => {
        const context = normalizeCurriculumResponse(data);
        notesContextCache.set(unitId, context);
        if (mounted) setCurriculumContext(context);
      })
      .catch(() => {
        if (mounted && !cachedContext) setCurriculumContext(null);
      })
      .finally(() => {
        if (mounted) setContextLoading(false);
      });

    return () => { mounted = false; };
  }, [access.canAccess, unitId]);

  async function loadContent(isMounted = () => true, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await getNotesStructure(unitId || null);
      const nextNotes = Array.isArray(data) ? data : [];
      notesPageCache.set(cacheKey, nextNotes);
      setCache(`notes_page_${cacheKey}`, nextNotes);
      if (isMounted()) setNotes(nextNotes);
    } catch {
      if (isMounted() && !notesPageCache.has(cacheKey)) setError("We couldn't load your notes. Please try again.");
    } finally {
      if (isMounted()) setLoading(false);
    }
  }

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  const filteredNotes = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return notes;
    return notes.filter((note) => [
      note.title,
      note.content_preview,
      note.category,
      note.tag,
      note.author
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [notes, searchTerm]);

  const contextPath = useMemo(() => buildCurriculumPath(curriculumContext), [curriculumContext]);
  const contextTitle = curriculumContext?.node?.name || null;
  const contextAncestors = curriculumContext?.ancestors || [];
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Notes', href: unitId ? `/notes?unit_id=${encodeURIComponent(unitId)}` : '/notes' }
    ];

    if (contextLoading) {
      items.push({ label: 'Loading curriculum…' });
    } else if (contextTitle) {
      contextAncestors.forEach((ancestor, index) => {
        items.push({
          label: ancestor.name,
          href: buildCurriculumPath({ node: ancestor, ancestors: contextAncestors.slice(0, index) })
        });
      });
      if (items[items.length - 1]?.label !== contextTitle) items.push({ label: contextTitle });
    } else if (unitId) {
      items.push({ label: 'Selected curriculum' });
    }

    return items;
  }, [unitId, contextLoading, contextTitle, contextAncestors]);

  const contextChildren = curriculumContext?.children || [];
  const resourceNoteCount = curriculumContext?.resourceCounts?.notes;
  const levelName = displayName || level || '';
  const classLabel = class_name || '';

  if (!access.canAccess) {
    return (
      <main className="mx-auto min-h-[60vh] w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <EmptyState
          image={getEmptyStateImage('notes')}
          title="Study notes unavailable"
          description="Your account doesn’t currently have access to these study notes."
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <header className="flex flex-col gap-6 border-b border-border pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full border border-secondary-200 bg-secondary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-secondary-800">Study at your pace</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-primary-900 sm:text-5xl">Study notes</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">Build your understanding step by step. Search your notes, follow your learning path, and revisit ideas that need more practice.</p>
          </div>
          <div className="lg:pb-1">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        </header>

        <div className="mt-6">
          <AdSlot placement="notes" pageContext="notes" />
        </div>

        {contextTitle && (
          <section className="mt-8 flex flex-col gap-5 rounded-2xl border border-primary-200 bg-primary-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" aria-label="Learning pathway context">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-primary-700">Your learning pathway</span>
              <p className="mt-2 text-base leading-7 text-primary-900">Topic: <strong>{contextTitle}</strong>.</p>
              {contextPath && (
                <Link className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-primary-800 underline decoration-primary-300 underline-offset-4 hover:text-primary-950" to={contextPath}>
                  View topic <Icon name="arrow-right" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-primary-200 bg-white px-5 py-3 text-primary-900" aria-label="Note count">
              <strong className="text-3xl font-bold">{resourceNoteCount == null ? notes.length : resourceNoteCount}</strong>
              <span className="max-w-24 text-xs font-semibold leading-5 text-muted">{formatResourceCount(resourceNoteCount == null ? notes.length : resourceNoteCount).replace(/^\d+\s*/, '')}</span>
            </div>
          </section>
        )}

        {contextChildren.length > 0 && (
          <section className="mt-10" aria-labelledby="notes-pathway-title">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">Continue studying</span>
                <h2 id="notes-pathway-title" className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">Next topics</h2>
              </div>
              <span className="text-sm font-semibold text-muted">{contextChildren.length} topics</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {contextChildren.map((child) => {
                const childPath = buildCurriculumPath({ node: child, ancestors: [...contextAncestors, curriculumContext.node] });
                return childPath ? (
                  <Link className="group flex min-h-20 items-center justify-between gap-4 rounded-xl border border-border bg-white p-4 text-foreground no-underline shadow-sm transition hover:border-primary-300 hover:bg-primary-50" to={childPath} key={child.id}>
                    <span className="min-w-0">
                      <small className="block text-xs font-bold uppercase tracking-wider text-muted">{child.node_type || 'topic'}</small>
                      <strong className="mt-1 block text-sm font-bold text-primary-900">{child.name}</strong>
                    </span>
                    <Icon name="arrow-right" className="h-5 w-5 shrink-0 text-primary-700 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        )}

        <section className="mt-10" aria-label="Search study notes">
          <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary-700">Study library</span>
              <h2 className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">Find a note</h2>
              {!loading && <p className="mt-1 text-sm text-muted">{filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'} found</p>}
            </div>
            <label className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-sm transition focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 sm:max-w-md">
              <Icon name="search" plain className="h-5 w-5 shrink-0 text-muted" />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search notes"
                aria-label="Search notes"
                className="min-w-0 flex-1 border-0 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-slate-400 focus:ring-0 block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              />
              {searchTerm && (
                <button type="button" className="rounded-lg p-2 text-muted hover:bg-slate-100 hover:text-primary-800" onClick={() => setSearchTerm('')} aria-label="Clear note search">
                  <Icon name="xmark" />
                </button>
              )}
            </label>
          </div>
        </section>

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Skeleton height={220} /><Skeleton height={220} /><Skeleton height={220} />
          </div>
        ) : error ? (
          <div className="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
            <h3 className="text-lg font-bold">We couldn’t load your notes</h3>
            <p className="mt-2 text-sm leading-6">{error}</p>
            <button type="button" className="mt-4 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-800" onClick={() => loadContent(() => true, true)}>Try again</button>
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-8">
            <EmptyState
              image={getEmptyStateImage('notes')}
              title="No study notes are available for this selection yet"
              description={`Notes for ${contextTitle || classLabel || levelName || 'your selected study level'} will appear here as they become available.`}
            />
          </div>
        ) : filteredNotes.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><Icon name="search" className="h-7 w-7" /></div>
            <h3 className="mt-4 text-xl font-bold text-primary-900">No matching study notes</h3>
            <p className="mt-2 text-sm text-muted">No notes match “{searchTerm}”. Try a different search term.</p>
            <button type="button" className="mt-4 rounded-xl border border-primary-200 bg-primary-50 px-4 py-2.5 text-sm font-bold text-primary-800 hover:bg-primary-100" onClick={() => setSearchTerm('')}>Clear search</button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredNotes.map((note) => (
              <article key={note.id} className="flex min-h-[360px] flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-200 hover:shadow-lg">
                <div className="aspect-[16/9] w-full overflow-hidden bg-primary-50">
                  <img
                    src={note.cover_image_url || note.thumbnail_url || note.topic_image_url || 'https://images.pexels.com/photos/7972949/pexels-photo-7972949.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex flex-1 flex-col p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
                    <span>{note.read_time ? `${note.read_time} min read` : 'Study note'}</span>
                    {note.is_premium && <span className="rounded-full border border-secondary-200 bg-secondary-50 px-2.5 py-1 text-secondary-800">Premium</span>}
                  </div>
                  <h3 className="mt-3 text-xl font-bold leading-snug text-primary-900">{note.title}</h3>
                  <p className="mt-2 flex-1 text-sm leading-6 text-muted">{note.content_preview || 'Open this note to read the full explanation and review its key ideas.'}</p>
                  <div className="mt-5 border-t border-border pt-4">
                    <Link to={`/notes/read?id=${encodeURIComponent(note.id)}`} className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                      Read note <Icon name="arrow-right" className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {unitId && (
          <LearningJourney unitId={unitId} excludeStages={['notes']} returnTo={'/notes?unit_id=' + encodeURIComponent(unitId)} />
        )}
      </div>
    </main>
  );
}
