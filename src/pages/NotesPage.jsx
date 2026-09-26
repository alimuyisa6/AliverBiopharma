import AdSlot from '../components/Advertising/AdSlot';
import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useContentAccess } from '../hooks/useContentAccess';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useLayout } from '../contexts/LayoutContext';
import { getNotesList } from '../api/client';
import { getCurriculumNode } from '../api/curriculumNavigation';
import Card from '../components/Card/Card';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import EmptyState from '../components/EmptyState/EmptyState';
import Button from '../components/Button/Button';
import Container from '../components/Container/Container';

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

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;

    loadContent(mounted);

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
    setContextLoading(true);

    getCurriculumNode(unitId)
      .then((data) => {
        if (mounted) setCurriculumContext(normalizeCurriculumResponse(data));
      })
      .catch(() => {
        if (mounted) setCurriculumContext(null);
      })
      .finally(() => {
        if (mounted) setContextLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [access.canAccess, unitId]);

  async function loadContent(mounted = true) {
    setLoading(true);
    setError(null);

    try {
      const data = await getNotesList(unitId || null);

      if (mounted) setNotes(Array.isArray(data) ? data : []);
    } catch {
      if (mounted) setError('Failed to load notes.');
    } finally {
      if (mounted) setLoading(false);
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
    <Container>
      <div className="notes-page">
        <span className="sec-label font-mono">Study Notes</span>
        <h1 className="section-title notes-page-title font-fraunces">
          {contextTitle || 'Notes'}
          {!contextTitle && <>{levelName ? <><br />– {levelName}</> : ''}</>}
        </h1>

        {classLabel && !contextTitle && <p className="notes-page-class font-maven-pro">{classLabel}</p>}

        <AdSlot placement="notes" pageContext="notes" />

        <nav className="breadcrumb font-mono" aria-label="Breadcrumb">
          <Link to="/"><Icon name="home" className="breadcrumb-icon" /> Home</Link>
          <Icon name="chevron-right" className="breadcrumb-sep" />
          <Link to="/notes">Notes</Link>

          {contextLoading ? (
            <>
              <Icon name="chevron-right" className="breadcrumb-sep" />
              <span className="font-maven-pro">Loading curriculum…</span>
            </>
          ) : contextTitle ? (
            <>
              {contextAncestors.map((ancestor) => (
                <span className="notes-breadcrumb-segment" key={ancestor.id}>
                  <Icon name="chevron-right" className="breadcrumb-sep" />
                  <span className="font-maven-pro">{ancestor.name}</span>
                </span>
              ))}
              <Icon name="chevron-right" className="breadcrumb-sep" />
              <span className="font-maven-pro">{contextTitle}</span>
            </>
          ) : unitId ? (
            <>
              <Icon name="chevron-right" className="breadcrumb-sep" />
              <span className="font-maven-pro">Selected curriculum</span>
            </>
          ) : null}
        </nav>

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
            <span className="sec-label font-mono">Available notes</span>
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
            action={<Button onClick={() => loadContent()}>Try Again</Button>}
          />
        ) : notes.length === 0 ? (
          <EmptyState
            image={getEmptyStateImage('notes')}
            title="No Notes Available"
            description={`No study notes found for ${contextTitle || classLabel || levelName || 'this curriculum node'}.`}
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
                image={note.topic_image_url || undefined}
                icon={note.topic_image_url ? undefined : 'book-open'}
                title={note.title}
                description={note.content_preview}
                footer={
                  <div className="notes-card-footer">
                    <span className="notes-card-meta font-mono">
                      {note.read_time ? `${note.read_time} min read` : 'Study note'}
                      {note.is_premium ? ' · Premium' : ''}
                    </span>
                    <Button size="sm" onClick={() => navigate(`/notes/read?id=${note.id}`)}>
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
