import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Spinner from '../components/Spinner/Spinner';
import Icon from '../components/Icon/Icon';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import InteractiveSymbolExplorer from '../components/Curriculum/InteractiveSymbolExplorer';
import { getSubscriptionPath, isPremiumAccessError, redirectToSubscription } from '../utils/subscriptionNavigation';
import { getCurriculumNode, getCurriculumNodeByPath, getCurriculumTree } from '../api/curriculumNavigation';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function isPharmacyCurriculum(node, ancestors = [], roots = []) {
  const rootType = ancestors[0]?.node_type || node?.node_type || roots[0]?.node_type;
  return rootType === 'unit' || rootType === 'sub_course_unit';
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

function renderBlockContent(block, node) {
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
        {content && <p>{content}</p>}
        <InteractiveSymbolExplorer config={block.interactive_config || {}} />
      </div>
    );
  }

  if (block.content_type === 'quiz_ref') {
    return (
      <div className="curriculum-node-block-quiz">
        {content ? <p>{content}</p> : <p>Check your understanding with questions connected to this lesson.</p>}
        {node?.id && <Link to={`/quiz?unit_id=${encodeURIComponent(node.id)}&activity_scope=lesson`} className="curriculum-node-question-bank-action">Start lesson quiz <Icon name="arrow-right" /></Link>}
      </div>
    );
  }

  return content ? <p>{content}</p> : null;
}

export default function CurriculumNodePage() {
  const { groupId, '*': nodePath = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
          if (!mounted) return;
          if (isPremiumAccessError(err)) {
            redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
            return;
          }
          setError(err?.message || 'We couldn’t load this curriculum. Please try again.');
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
        if (!mounted) return;
        if (isPremiumAccessError(err)) {
          redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
          return;
        }
        if (!cached) setError(err?.message || 'We couldn’t load this learning item. Please try again.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [groupId, nodePath, navigate, location]);

  const node = data?.node;
  const ancestors = data?.ancestors || [];
  const children = data?.children || [];
  const relationships = data?.relationships || [];
  const blocks = data?.blocks || [];
  const linkedContent = data?.linked_content || [];
  const curriculumDepth = Math.max(0, ancestors.filter((item) => item.group_id === groupId).length - 1);
  const isPharmacy = isPharmacyCurriculum(node, ancestors, rootNodes || []);
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
    const isPharmacy = isPharmacyCurriculum(null, [], rootNodes);
    const rootLabel = isPharmacy ? 'course unit' : 'topic';
    const rootLabelPlural = isPharmacy ? 'Course units' : 'Topics';
    const childLabel = isPharmacy ? 'course units' : 'topics';
    return (
      <Container className="curriculum-node-page">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: rootLabelPlural, href: null }]} />
        <header className="curriculum-node-header rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.16em] text-primary-800"><Icon name="route" /> Step 1 of 4 · {rootLabelPlural}</span>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-primary-950 sm:text-5xl">Choose a {rootLabel}</h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{isPharmacy ? 'Begin with a course unit, then follow its sub-course units, themes and lessons.' : 'Begin with a topic, then follow its subtopics, themes and lessons.'}</p>
          <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(isPharmacy ? ['Course unit','Sub-course unit','Theme','Lesson'] : ['Topic','Subtopic','Theme','Lesson']).map((step, index) => (
              <div key={step} className={`rounded-xl border px-3 py-3 ${index === 0 ? 'border-primary-300 bg-primary-100 text-primary-900 shadow-sm' : 'border-slate-200 bg-white/80 text-slate-500'}`}>
                <span className="block text-[11px] font-bold uppercase tracking-wider">Step {index + 1}</span><strong className="mt-1 block text-sm">{step}</strong>
              </div>
            ))}
          </div>
        </header>
        <section className="curriculum-node-section mt-8 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="curriculum-node-section-heading mb-5 flex items-end justify-between gap-3"><div><span className="text-xs font-bold uppercase tracking-[.15em] text-primary-700">Start here</span><h2 className="mt-2 text-2xl font-extrabold text-primary-950 sm:text-3xl">{rootLabelPlural}</h2></div><span className="curriculum-node-count rounded-full bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-800">{rootNodes.length} available</span></div>
          <div className="curriculum-node-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {rootNodes.map((item, index) => (
              <Link key={item.id} to={`/curriculum/${encodeURIComponent(groupId)}/${slugify(item.slug || item.name)}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`} className="group flex min-h-36 items-center gap-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-5 text-primary-950 no-underline shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-700 text-lg font-black text-white shadow-sm">{String(index + 1).padStart(2,'0')}</span>
                <span className="curriculum-node-child-body min-w-0 flex-1"><small className="block text-xs font-bold uppercase tracking-wider text-primary-700">{rootLabel}</small><strong className="mt-1 block text-lg leading-snug">{item.name}</strong></span>
                <Icon name="arrow-right" className="h-5 w-5 shrink-0 text-primary-700 transition-transform group-hover:translate-x-1" />
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
  const isLesson = String(node?.node_type || '').toLowerCase() === 'lesson' || curriculumDepth >= 3;
  const returnToLesson = `/curriculum/${encodeURIComponent(groupId)}/${nodePath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

  const openRelatedNode = async (event, relationship) => {
    event.preventDefault();

    try {
      const result = await getCurriculumNode(relationship.target_id);
      const targetNode = result?.node;
      const targetPathNodes = [...(result?.ancestors || []), targetNode].filter(Boolean);
      if (!targetNode) return;

      const targetPath = targetPathNodes
        .map((item) => slugify(item.slug || item.name))
        .filter(Boolean)
        .join('/');
      if (!targetPath) return;

      navigate(`/curriculum/${encodeURIComponent(groupId)}/${targetPath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`);
    } catch {
      return;
    }
  };

  return (
    <Container className="curriculum-node-page">
      <Breadcrumb items={breadcrumbItems} />

      <header className="curriculum-node-header rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-secondary-50 px-5 py-7 shadow-sm sm:px-8 sm:py-9">
        <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white px-3 py-1.5 text-xs font-extrabold uppercase tracking-[.15em] text-primary-800"><Icon name="route" /> Step {Math.min(curriculumDepth + 1, 4)} of 4 · {nodeLabel}</span>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-primary-950 sm:text-5xl">{node.name}</h1>
        {node.description && <p className="curriculum-node-description mt-3 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">{node.description}</p>}
        <div className="mt-7 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(isPharmacy ? ['Course unit','Sub-course unit','Theme','Lesson'] : ['Topic','Subtopic','Theme','Lesson']).map((step, index) => (
            <div key={step} className={`rounded-xl border px-3 py-3 ${index === curriculumDepth ? 'border-primary-300 bg-primary-100 text-primary-900 shadow-sm' : index < curriculumDepth ? 'border-secondary-200 bg-secondary-50 text-secondary-900' : 'border-slate-200 bg-white/80 text-slate-500'}`}>
              <span className="block text-[11px] font-bold uppercase tracking-wider">{index < curriculumDepth ? 'Completed' : index === curriculumDepth ? 'Current step' : `Step ${index + 1}`}</span><strong className="mt-1 block text-sm">{step}</strong>
            </div>
          ))}
        </div>
      </header>

      {isLeaf && blocks.length > 0 && (
        <section className="curriculum-node-section curriculum-node-learning">
          <div className="curriculum-node-section-heading">
            <div>
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
                {block.locked ? (
                  <div className="curriculum-node-premium-locked">
                    <p>This lesson is part of premium access.</p>
                    <Link to={getSubscriptionPath(location, { preserveCurrent: true, reason: 'premium' })} className="btn btn-primary">Unlock this lesson</Link>
                  </div>
                ) : renderBlockContent(block)}
                {block.is_premium && <span className="curriculum-node-premium">Premium</span>}
              </article>
            ))}
          </div>
        </section>
      )}

      {children.length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading mb-5 flex items-end justify-between gap-3">
            <div><span className="text-xs font-bold uppercase tracking-[.15em] text-primary-700">Next in your pathway</span><h2 className="mt-2 text-2xl font-extrabold text-primary-950 sm:text-3xl">Explore {node.name}</h2></div>
            <span className="curriculum-node-count rounded-full bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-800">{children.length} {children.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="curriculum-node-children grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {children.map((child) => {
              const parentPath = ancestors
                .map((item) => slugify(item.slug || item.name))
                .join('/');
              const childPath = [parentPath, slugify(child.slug || child.name)]
                .filter(Boolean)
                .join('/');
              const childHref = `/curriculum/${encodeURIComponent(groupId)}/${childPath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

              return (
                <Link key={child.id} to={childHref} className="curriculum-node-child group flex min-h-32 items-center gap-4 rounded-2xl border border-primary-100 bg-gradient-to-br from-white to-primary-50 p-5 text-primary-950 no-underline shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-700 text-white shadow-sm"><Icon name={child.node_type === 'lesson' ? 'book-open' : child.node_type === 'theme' ? 'layer-group' : 'graduation-cap'} className="h-5 w-5" /></span>
                  <span className="curriculum-node-child-body min-w-0 flex-1"><small className="block text-xs font-bold uppercase tracking-wider text-primary-700">{curriculumLevelLabel(curriculumDepth + 1, isPharmacy)}</small><strong className="mt-1 block text-base leading-snug">{child.name}</strong></span>
                  <Icon name="arrow-right" className="h-5 w-5 shrink-0 text-primary-700 transition-transform group-hover:translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isLesson && (
        <section className="curriculum-node-question-bank">
          <div>
            <span className="curriculum-node-question-bank-eyebrow">Targeted practice</span>
            <h2>Build a test from this lesson</h2>
            <p>Search the questions linked to this lesson, select the concepts you want to practise and save a custom assessment.</p>
          </div>
          <Link to={`/question-bank?unit_id=${encodeURIComponent(node.id)}`} className="curriculum-node-question-bank-action">
            Open lesson question bank <Icon name="arrow-right" />
          </Link>
        </section>
      )}

      {isLesson && (
        <LearningJourney
          unitId={node.id}
          nodeName={node.name}
          nodeType={node.node_type}
          linkedContent={linkedContent}
          returnTo={returnToLesson}
          resourceFocus={normalizedResourceFocus}
        />
      )}

      {relationships.length > 0 && (
        <section className="curriculum-node-section">
          <div className="curriculum-node-section-heading">
            <div>
              <h2>Connected learning</h2>
            </div>
          </div>

          <div className="curriculum-node-links">
            {relationships.map((relationship, index) => (
              <Link
                key={`${relationship.relationship_type}-${relationship.target_id}-${index}`}
                to={`/curriculum/${encodeURIComponent(groupId)}/${slugify(relationship.target_slug || relationship.target_name)}`}
                onClick={(event) => openRelatedNode(event, relationship)}
                className="curriculum-node-link"
              >
                <span>{relationship.target_name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
