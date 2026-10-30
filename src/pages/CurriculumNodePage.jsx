import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Spinner from '../components/Spinner/Spinner';
import Icon from '../components/Icon/Icon';
import LearningJourney from '../components/LearningJourney/LearningJourney';
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
        alt={block.title || 'Learning illustration'}
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
        {content ? <p>{content}</p> : <p>Interactive activities will be added here when they are ready.</p>}
      </div>
    );
  }

  if (block.content_type === 'quiz_ref') {
    return (
      <div className="curriculum-node-block-quiz">
        {content ? <p>{content}</p> : <p>Answer a few questions to check what you’ve learned.</p>}
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
          if (mounted) setError(err?.message || 'We couldn’t load this curriculum. Please try again.');
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
        if (mounted && !cached) setError(err?.message || 'We couldn’t load this learning item. Please try again.');
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
  const normalizedResourceFocus = ({ quizzes: 'quiz', past_papers: 'past-papers' })[resourceFocus] || resourceFocus;
  const focusedResourceLabel = RESOURCE_LABELS[normalizedResourceFocus] || '';
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
          <span className="curriculum-node-type">Your learning pathway</span>
          <h1>Choose a {rootLabel}</h1>
          <p>Start here, then explore the connected {isPharmacyRoot ? 'sub-course units' : 'subtopics'}, themes and lessons. Your selected curriculum determines what you see.{focusedResourceLabel ? ` You chose ${focusedResourceLabel}; we’ll keep that resource in focus as you move through the curriculum.` : ''}</p>
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
          <h1>This learning item isn’t available</h1>
          <p>{error || 'We couldn’t find the learning item you requested.'}</p>
          <Link to="/resources" className="btn btn-primary">Back to learning resources</Link>
        </div>
      </Container>
    );
  }

  const isLeaf = children.length === 0;
  const returnToLesson = `/curriculum/${encodeURIComponent(groupId)}/${nodePath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

  return (
    <Container className="curriculum-node-page">
      <Breadcrumb items={breadcrumbItems} />

      <header className="curriculum-node-header">
        <span className="curriculum-node-type">{nodeLabel}{curriculumDepth >= 0 ? ` · Step ${Math.min(curriculumDepth + 1, 4)} of 4` : ''}</span>
        <h1>{node.name}</h1>
        <p>{children.length > 0
          ? `Choose a ${curriculumLevelLabel(curriculumDepth + 1, isPharmacy).toLowerCase()} to continue. Your selected curriculum stays in place throughout the journey.`
          : `You’ve reached the lesson. Start with the key ideas, then use the linked questions and revision materials to check your understanding.`}</p>
        {focusedResourceLabel && <p className="curriculum-node-focus-note"><span>Your selected resource:</span> <strong>{focusedResourceLabel}</strong><span> — we’ll keep it in focus as you move through this pathway.</span></p>}
      </header>

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
              <span className="curriculum-node-kicker">Next step</span>
              <h2>Explore {node.name}</h2>
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

      {isLeaf && (
        <LearningJourney
          unitId={node.id}
          nodeName={node.name}
          nodeType={node.node_type}
          linkedContent={linkedContent}
          returnTo={returnToLesson}
        />
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
