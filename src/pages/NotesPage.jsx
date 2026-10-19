import AdSlot from '../components/Advertising/AdSlot';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useLayout } from '../contexts/LayoutContext';
import { getNotesStructure } from '../api/cachedClient';
import { getCurriculumNode } from '../api/curriculumNavigation';
import Card from '../components/Card/Card';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import Button from '../components/Button/Button';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import StickyNotePolaroidFrame from '../components/StickyNotePolaroidFrame/StickyNotePolaroidFrame';

const notesPageCache = new Map();
const notesContextCache = new Map();

function normalizeCurriculumResponse(data) {
  const payload = data?.node?.node ? data.node : data;
  return {
    node: payload?.node || null,
    ancestors: Array.isArray(payload?.ancestors) ? payload.ancestors : [],
    children: Array.isArray(payload?.children) ? payload.children : [],
    resourceCounts: payload?.resource_counts || {},
  };
}

function buildCurriculumPath(context) {
  const groupId = context?.node?.group_id;
  const parts = [
    ...(context?.ancestors || []).map((item) => item.slug).filter(Boolean),
    context?.node?.slug,
  ].filter(Boolean);

  if (!groupId || !parts.length) return null;
  return `/curriculum/${encodeURIComponent(groupId)}/${parts.join('/')}`;
}

function formatResourceCount(value) {
  const count = Number(value || 0);
  return count === 1 ? '1 note' : `${count} notes`;
}

export default function NotesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const access = useContentAccess();
  const { level, class_name, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const unitId = searchParams.get('unit_id');

  const [notes, setNotes] = useState([]);
  const [curriculumContext, setCurriculumContext] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [contextLoading, setContextLoading] = useState(false);
  const [error, setError] = useState(null);
  const cacheKey = `${level || ''}:${class_name || ''}:${unitId || 'all'}`;

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const cachedNotes = notesPageCache.get(cacheKey);

    if (cachedNotes) {
      setNotes(cachedNotes);
      setLoading(false);
      setError(null);
      loadContent(() => mounted, false);
    } else {
      setLoading(true);
      loadContent(() => mounted, true);
    }

    return () => {
      mounted = false;
    };
  }, [access.canAccess, level, class_name, unitId]);

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

    return () => {
      mounted = false;
    };
  }, [access.canAccess, unitId]);

  async function loadContent(isMounted = () => true, showLoading = true) {
    if (showLoading) setLoading(true);
    setError(null);

    try {
      const data = await getNotesStructure(unitId || null);
      const nextNotes = Array.isArray(data) ? data : [];
      notesPageCache.set(cacheKey, nextNotes);
      if (isMounted()) setNotes(nextNotes);
    } catch {
      if (isMounted() && !notesPageCache.has(cacheKey)) setError('Failed to load notes.');
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
      note.author,
    ].filter(Boolean).some((value) => String(value).toLowerCase().includes(query)));
  }, [notes, searchTerm]);

  const contextPath = useMemo(
    () => buildCurriculumPath(curriculumContext),
    [curriculumContext]
  );

  const contextTitle = curriculumContext?.node?.name || null;
  const contextAncestors = curriculumContext?.ancestors || [];
  const breadcrumbItems = useMemo(() => {
    const items = [
      { label: 'Home', href: '/' },
      { label: 'Notes', href: unitId ? `/notes?unit_id=${encodeURIComponent(unitId)}` : '/notes' },
    ];

    if (contextLoading) {
      items.push({ label: 'Loading curriculum…' });
    } else if (contextTitle) {
      contextAncestors.forEach((ancestor, index) => {
        items.push({
          label: ancestor.name,
          href: buildCurriculumPath({
            node: ancestor,
            ancestors: contextAncestors.slice(0, index),
          }),
        });
      });
      items.push({ label: contextTitle });
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
      <Container>
        <EmptyState
          image={getEmptyStateImage('notes')}
          title="Access Restricted"
          description="Your account does not have access to study notes."
        />
      </Container>
    );
  }

  return (
    <Container className="notes-page-shell">
      <div className="notes-page">
        <div className="notes-page-heading">
          <div className="notes-page-intro">
            <span className="notes-page-kicker">Learn at your pace</span>
            <h1 className="section-title notes-page-title font-fraunces">
              Study notes
            </h1>
            <p className="notes-page-description">
              Build understanding one topic at a time. Search your notes, follow your curriculum and return to the concepts you want to strengthen.
            </p>
          </div>

          <Breadcrumb items={breadcrumbItems} />
        </div>

        <AdSlot placement="notes" pageContext="notes" />
        {contextTitle && (
          <section className="notes-curriculum-context" aria-label="Curriculum context">
            <div className="notes-context-main">
              <div className="notes-context-kicker font-mono">Curriculum focus</div>
              <p className="notes-context-description">
                These notes support <strong>{contextTitle}</strong>. Follow the connected curriculum areas below when you are ready to continue.
              </p>
              {contextPath && (
                <Link className="notes-context-link" to={contextPath}>
                  <span>Open learning hub</span>
                  <Icon name="arrow-right" />
                </Link>
              )}
            </div>

            <div className="notes-context-meta" aria-label="Note count">
              <strong>{resourceNoteCount == null ? notes.length : resourceNoteCount}</strong>
              <span>{formatResourceCount(resourceNoteCount == null ? notes.length : resourceNoteCount).replace(/^\d+\s*/, '')}</span>
            </div>
          </section>
        )}

        {contextChildren.length > 0 && (
          <section className="notes-pathway" aria-labelledby="notes-pathway-title">
            <div className="notes-section-heading">
              <div>
                <span className="sec-label font-mono">Continue through the curriculum</span>
                <h2 id="notes-pathway-title">Connected areas</h2>
              </div>
              <span className="notes-section-count font-mono">{contextChildren.length} areas</span>
            </div>

            <div className="notes-pathway-list">
              {contextChildren.map((child) => {
                const childPath = buildCurriculumPath({
                  node: child,
                  ancestors: [...contextAncestors, curriculumContext.node],
                });

                return childPath ? (
                  <Link className="notes-pathway-item" to={childPath} key={child.id}>
                    <span>
                      <small className="font-mono">{child.node_type || 'topic'}</small>
                      <strong>{child.name}</strong>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                ) : null;
              })}
            </div>
          </section>
        )}

        <div className="notes-toolbar" role="search">
          <div className="notes-toolbar-label">
            <span className="sec-label font-mono">Your notes</span>
            {!loading && <span className="notes-result-count font-mono">{filteredNotes.length} shown</span>}
          </div>
          <label className="notes-search">
            <Icon name="search" />
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search notes"
              aria-label="Search notes"
            />
            {searchTerm && (
              <button type="button" className="notes-search-clear" onClick={() => setSearchTerm('')} aria-label="Clear note search">
                <Icon name="xmark" />
              </button>
            )}
          </label>
        </div>

        {loading ? (
          <div className="notes-skeleton-grid">
            <Skeleton height={160} />
            <Skeleton height={160} />
            <Skeleton height={160} />
          </div>
        ) : error ? (
          <EmptyState
            image={getEmptyStateImage('error')}
            title="Error"
            description={error}
            action={<Button onClick={() => loadContent(() => true, true)}>Try Again</Button>}
          />
        ) : notes.length === 0 ? (
          <EmptyState
            image={getEmptyStateImage('notes')}
            title="No Notes Available"
            description={`Study notes for ${contextTitle || classLabel || levelName || 'this curriculum'} will appear here as content is added.`}
          />
        ) : filteredNotes.length === 0 ? (
          <EmptyState
            image={getEmptyStateImage('notes')}
            title="No Matching Notes"
            description={`No notes match “${searchTerm}”. Try a different title, topic, category, or keyword.`}
            action={<Button onClick={() => setSearchTerm('')}>Clear Search</Button>}
          />
        ) : (
          <div className="notes-grid">
            {filteredNotes.map((note) => (
              <Card
                key={note.id}
                variant="blue-strong"
                className="card-round notes-card folded-card folded-card-blue"
                media={
                  <StickyNotePolaroidFrame
                    noteTitle={note.title}
                    noteText={note.content_preview || 'Explore this topic in your study notes.'}
                    noteFooter={note.read_time ? note.read_time + ' min read' : 'AliverBiopharm study note'}
                    noteColor={note.is_premium ? 'gold' : 'teal'}
                    rotation={0}
                    className="notes-card-polaroid"
                  >
                    {note.topic_image_url ? <img src={note.topic_image_url} alt={note.title || 'Study topic'} loading="lazy" /> : null}
                  </StickyNotePolaroidFrame>
                }
                title={note.title}
                description={note.content_preview}
                footer={
                  <div className="notes-card-footer">
                    <span className="notes-card-meta font-mono">
                      {note.read_time ? `${note.read_time} min read` : 'Study note'}
                      {note.is_premium ? ' · Premium' : ''}
                    </span>
                    <Button variant="primary" size="sm" onClick={() => navigate(`/notes/read?id=${note.id}`)}>
                      Read Note
                    </Button>
                  </div>
                }
                onClick={() => navigate(`/notes/read?id=${note.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  );
}

