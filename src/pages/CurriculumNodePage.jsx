import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Spinner from '../components/Spinner/Spinner';
import Icon from '../components/Icon/Icon';
import { getCurriculumNodeByPath, getCurriculumTree } from '../api/curriculumNavigation';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function curriculumLevelLabel(depth, isPharmacy) {
  if (depth <= 0) return isPharmacy ? 'Course Unit' : 'Topic';
  if (depth === 1) return isPharmacy ? 'Sub-course Unit' : 'Subtopic';
  if (depth === 2) return 'Theme';
  return 'Lesson';
}

function resourcePath(resource, unitId) {
  const routes = {
    notes: '/notes',
    quiz: '/quiz',
    flashcards: '/flashcards',
    recall: '/recall',
    pdfs: '/pdfs',
    'past-papers': '/past-papers'
  };

  const route = routes[resource] || '/resources';
  return `${route}?unit_id=${encodeURIComponent(unitId)}`;
}

const curriculumNodeCache = new Map();

const RESOURCE_LABELS = {
  notes: 'Notes',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  recall: 'Recall',
  pdfs: 'PDFs',
  'past-papers': 'Past Papers'
};

function renderBlockContent(block) {
  const content = block?.content || '';

  if (block.content_type === 'image') {
    return block.media_url ? (
      <img
        src={block.media_url}
        alt={block.title || 'Curriculum learning illustration'}
        className="curriculum-node-block-image"
        loading="lazy"
      />
    ) : null;
  }

  if (block.content_type === 'video') {
    if (!block.media_url) return content ? <p>{content}</p> : null;

    return (
      <div className="curriculum-node-block-video">
        <video controls preload="metadata" src={block.media_url}>
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (block.content_type === 'interactive') {
    return (
      <div className="curriculum-node-block-interactive">
        {content ? <p>{content}</p> : <p>Interactive learning content will appear here.</p>}
      </div>
    );
  }

  if (block.content_type === 'quiz_ref') {
    return (
      <div className="curriculum-node-block-quiz">
        {content ? <p>{content}</p> : <p>Test your understanding of this topic.</p>}
      </div>
    );
  }

  return content ? <p>{content}</p> : null;
}

export default function CurriculumNodePage() {
  const { groupId, '*': nodePath = '' } = useParams();
  const [searchParams] = useSearchParams();
  const resourceFocus = searchParams.get('resource') || '';
  const [rootNodes, setRootNodes] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const cacheKey = `${groupId || ''}:${nodePath || ''}`;
    const cached = curriculumNodeCache.get(cacheKey);

    if (!nodePath) {
      setData(null);
      setRootNodes(null);
      setLoading(true);
      setError(null);
      getCurriculumTree(groupId)
        .then((tree) => {
          if (!mounted) return;
          setRootNodes((Array.isArray(tree) ? tree : [])
            .filter((item) => !item.parent_id && Number(item.depth || 0) === 0)
            .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name)));
        })
        .catch((err) => {
          if (mounted) setError(err?.message || 'Unable to load this curriculum.');
        })
        .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
    }

    setRootNodes(null);
    if (cached) {
      setData(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    getCurriculumNodeByPath(groupId, nodePath)
      .then((result) => {
        curriculumNodeCache.set(cacheKey, result);
        if (mounted) setData(result);
      })
      .catch((err) => {
        if (mounted && !cached) setError(err?.message || 'Unable to load this curriculum node.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [groupId, nodePath]);

  const node = data?.node;
  const ancestors = data?.ancestors || [];
  const children = data?.children || [];
  const relationships = data?.relationships || [];
  const counts = data?.resource_counts || {};
  const blocks = data?.blocks || [];
  const linkedContent = data?.linked_content || [];
  const curriculumContext = `${ancestors.map((item) => item.name || '').join(' ')} ${node?.name || ''}`.toLowerCase();
  const isPharmacy = String(data?.curriculum_group?.level_id || '').toLowerCase().includes('pharmacy') || curriculumContext.includes('pharmacy') || String(node?.node_type || '').toLowerCase() === 'sub_course_unit';
  const curriculumDepth = Math.max(0, ancestors.filter((item) => item.group_id === groupId).length - 1);
  const nodeType = String(node?.node_type || '').toLowerCase();
  const nodeLabel = curriculumLevelLabel(curriculumDepth, isPharmacy);
  const linkedNotes = linkedContent.filter((item) => item.content_type === 'note' && item.content_id);
  const normalizedResourceFocus = ({ quizzes: 'quiz', past_papers: 'past-papers' })[resourceFocus] || resourceFocus;
  const focusedResourceLabel = RESOURCE_LABELS[normalizedResourceFocus] || '';
  const linkedContentGroups = linkedContent.reduce((groups, item) => {
    const key = item.content_type;
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'Home', href: '/' }];
    const group = data?.curriculum_group;

    if (group) {
      items.push({
        label: group.name,
        href: `/curriculum/${encodeURIComponent(groupId)}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`
      });
    }

    ancestors.forEach((ancestor, index) => {
      const path = ancestors
        .slice(0, index + 1)
        .map((item) => slugify(item.slug || item.name))
        .join('/');
      const isCurrent = ancestor.id === node?.id;
      items.push({
        label: ancestor.name,
        href: isCurrent ? null : `/curriculum/${encodeURIComponent(groupId)}/${path}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`
      });
    });

    if (node && !ancestors.some((ancestor) => ancestor.id === node.id)) {
      items.push({ label: node.name, href: null });
    }

    return items;
  }, [ancestors, node, data?.curriculum_group, groupId, resourceFocus]);

  if (loading) {
    return (
      <Container className="curriculum-node-page">
        <div className="curriculum-node-loading">
          <Spinner context="brand" size="lg" />
        </div>
      </Container>
    );
  }

  if (!node && Array.isArray(rootNodes)) {
    const groupName = rootNodes[0]?.group_name || '';
    const isPharmacyRoot = /pharmacy/i.test(String(groupId)) || /pharmacy/i.test(String(groupName)) || rootNodes.some((item) => /pharmacy/i.test(String(item.level_id || '')));
    const rootLabel = isPharmacyRoot ? 'course unit' : 'topic';
    return (
      <Container className="curriculum-node-page">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: isPharmacyRoot ? 'Course units' : 'Topics', href: null }]} />
        <header className="curriculum-node-header">
          <span className="curriculum-node-type">Your curriculum</span>
          <h1>Choose a {rootLabel}</h1>
          <p>Start here, then follow the connected {isPharmacyRoot ? 'sub-course units' : 'subtopics'}, themes and lessons. Your selected class or programme determines what you see.{focusedResourceLabel ? ` You chose ${focusedResourceLabel}; we will keep that resource in focus as you move through the curriculum.` : ''}</p>
        </header>
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading"><div><span className="curriculum-node-kicker">Step 1 of 4</span><h2>{isPharmacyRoot ? 'Course units' : 'Topics'}</h2></div><span className="curriculum-node-count">{rootNodes.length} available</span></div>
          <div className="curriculum-node-children">
            {rootNodes.map((item) => (
              <Link key={item.id} to={`/curriculum/${encodeURIComponent(groupId)}/${slugify(item.slug || item.name)}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`} className="curriculum-node-child">
                <span className="curriculum-node-child-icon"><Icon name={item.icon || 'book-open'} /></span>
                <span className="curriculum-node-child-body"><strong>{item.name}</strong><small>{isPharmacyRoot ? 'Course Unit' : 'Topic'}</small></span>
                <Icon name="arrow-right" />
              </Link>
            ))}
          </div>
        </section>
      </Container>
    );
  }

  if (error || !node) {
    return (
      <Container className="curriculum-node-page">
        <div className="curriculum-node-error">
          <Icon name="triangle-exclamation" />
          <h1>Curriculum node unavailable</h1>
          <p>{error || 'The requested curriculum node could not be found.'}</p>
          <Link to="/resources" className="btn btn-primary">Back to Resources</Link>
        </div>
      </Container>
    );
  }

  const isLeaf = children.length === 0;
  const RESOURCE_COUNT_KEYS = {
    notes: 'notes',
    quiz: 'quiz_questions',
    flashcards: 'flashcard_decks',
    recall: 'recall_questions_bank',
    pdfs: 'pdf_resources',
    'past-papers': 'past_papers'
  };
  const availableResources = (isLeaf ? Object.entries(RESOURCE_LABELS) : [])
    .filter(([key]) => Number(counts[RESOURCE_COUNT_KEYS[key] || key] || 0) > 0)
    .sort(([a], [b]) => (a === normalizedResourceFocus ? -1 : b === normalizedResourceFocus ? 1 : 0));
  const returnToLesson = `/curriculum/${encodeURIComponent(groupId)}/${nodePath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

  return (
    <Container className="curriculum-node-page">
      <Breadcrumb items={breadcrumbItems} />

      <header className="curriculum-node-header">
        <span className="curriculum-node-type">{nodeLabel}{curriculumDepth >= 0 ? ` · Step ${Math.min(curriculumDepth + 1, 4)} of 4` : ''}</span>
        <h1>{node.name}</h1>
        <p>{children.length > 0
          ? `Choose a ${curriculumLevelLabel(curriculumDepth + 1, isPharmacy).toLowerCase()} to continue. Your selected class or programme is kept throughout the journey.`
          : `This is your lesson. Read its core concepts, then use the connected practice and reference materials to strengthen your understanding.`}</p>
        {focusedResourceLabel && <p className="curriculum-node-focus-note">Your selected resource: <strong>{focusedResourceLabel}</strong>. We will keep it in focus as you move through this pathway.</p>}
      </header>

      {isLeaf && linkedNotes.length > 0 && (
        <section className="curriculum-node-section curriculum-node-core-reading" aria-labelledby="curriculum-core-reading-title">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Core concepts · Start reading</span>
              <h2 id="curriculum-core-reading-title">Build your understanding of {node.name}</h2>
            </div>
            <span className="curriculum-node-count">{linkedNotes.length} {linkedNotes.length === 1 ? 'reading' : 'readings'}</span>
          </div>
          <p className="curriculum-node-reading-intro">Begin with the explanation below, then return here for practice questions, flashcards and revision resources.</p>
          <div className="curriculum-node-core-reading-list">
            {linkedNotes.map((item) => (
              <Link key={item.id} to={`/notes/read?id=${encodeURIComponent(item.content_id)}&return_to=${encodeURIComponent(returnToLesson)}`} className="curriculum-node-core-reading-link">
                <span className="curriculum-node-child-icon"><Icon name="book-open" /></span>
                <span className="curriculum-node-child-body">
                  <strong>{item.title || 'Read core concepts'}</strong>
                  <small>Open the full explanation</small>
                </span>
                <span className="curriculum-node-reading-cta">Read now <Icon name="arrow-right" /></span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {isLeaf && blocks.length > 0 && (
        <section className="curriculum-node-section curriculum-node-learning">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Learning content</span>
              <h2>Study {node.name}</h2>
            </div>
          </div>

          <div className="curriculum-node-blocks">
            {blocks.map((block) => (
              <article
                key={block.id}
                className={`curriculum-node-block curriculum-node-block-${block.content_type || 'text'}`}
              >
                {block.title && <h3>{block.title}</h3>}
                {renderBlockContent(block)}
                {block.is_premium && <span className="curriculum-node-premium">Premium</span>}
              </article>
            ))}
          </div>
        </section>
      )}

      {children.length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Next level</span>
              <h2>Continue into {node.name}</h2>
            </div>
            <span className="curriculum-node-count">{children.length} {children.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="curriculum-node-children">
            {children.map((child) => {
              const parentPath = ancestors
                .map((item) => slugify(item.slug || item.name))
                .join('/');
              const childPath = [parentPath, slugify(child.slug || child.name)]
                .filter(Boolean)
                .join('/');
              const childHref = `/curriculum/${encodeURIComponent(groupId)}/${childPath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

              return (
                <Link key={child.id} to={childHref} className="curriculum-node-child">
                  <span className="curriculum-node-child-icon">
                    {child.icon ? <Icon name={child.icon} /> : <Icon name="book-open" />}
                  </span>
                  <span className="curriculum-node-child-body">
                    <strong>{child.name}</strong>
                    <small>{curriculumLevelLabel(curriculumDepth + 1, isPharmacy)}</small>
                  </span>
                  <Icon name="chevron-right" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {availableResources.length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Study resources</span>
              <h2>Learn this {node.node_type || 'unit'}</h2>
            </div>
          </div>

          <div className="curriculum-node-resources">
            {availableResources.map(([key, label]) => (
              <Link key={key} to={resourcePath(key, node.id)} className="curriculum-node-resource">
                <span>{label}</span>
                <Icon name="arrow-right" />
              </Link>
            ))}
          </div>
        </section>
      )}


      {isLeaf && Object.keys(linkedContentGroups).length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Connected resources</span>
              <h2>Study {node.name} across resource types</h2>
            </div>
          </div>

          <div className="curriculum-node-linked-groups">
            {Object.entries(linkedContentGroups).map(([type, items]) => {
              const resourceKeys = {
                note: 'notes',
                article: 'articles',
                video: 'videos',
                flashcard_deck: 'flashcards',
                quiz_question: 'quiz',
                recall_question: 'recall',
                past_paper: 'past-papers',
                pdf_resource: 'pdfs',
                curriculum_unit_block: null,
                glossary_term: null
              };
              const resourceKey = resourceKeys[type];
              const label = {
                note: 'Notes',
                article: 'Articles',
                video: 'Videos',
                flashcard_deck: 'Flashcards',
                quiz_question: 'Quiz questions',
                recall_question: 'BioRecall questions',
                past_paper: 'Past papers',
                pdf_resource: 'PDF resources',
                curriculum_unit_block: 'Lesson content',
                glossary_term: 'Glossary terms'
              }[type] || type.replaceAll('_', ' ');
              const destination = resourceKey ? resourcePath(resourceKey, node.id) : null;

              return (
                <article key={type} className="curriculum-node-linked-group">
                  <div className="curriculum-node-linked-group-heading">
                    <strong>{label}</strong>
                    <span className="curriculum-node-count">
                      {items.length} {items.length === 1 ? 'item' : 'items'}
                    </span>
                  </div>
                  <ul className="curriculum-node-linked-preview">
                    {items.slice(0, 3).map((item) => (
                      <li key={item.id}>{item.title}</li>
                    ))}
                    {items.length > 3 && <li>And {items.length - 3} more</li>}
                  </ul>
                  {destination && (
                    <Link to={destination} className="curriculum-node-resource-action">
                      Open {label.toLowerCase()} <Icon name="arrow-right" />
                    </Link>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      )}

      {relationships.length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading">
            <div>
              <span className="curriculum-node-kicker">Knowledge graph</span>
              <h2>Connected learning</h2>
            </div>
          </div>

          <div className="curriculum-node-links">
            {relationships.map((relationship, index) => (
              <div key={`${relationship.relationship_type}-${relationship.target_id}-${index}`} className="curriculum-node-link">
                <span className="curriculum-node-link-type">{relationship.relationship_type.replaceAll('_', ' ')}</span>
                <span>{relationship.target_name}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
