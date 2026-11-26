import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import Container from '../components/Container/Container';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';
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
        className="my-5 block max-h-[32rem] w-full rounded-2xl object-contain"
        loading="lazy"
      />
    ) : null;
  }

  if (block.content_type === 'video') {
    if (!block.media_url) return content ? <p>{content}</p> : null;

    return (
      <div className="my-5 overflow-hidden rounded-2xl border border-border bg-slate-950">
        <video controls preload="metadata" src={block.media_url}>
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  if (block.content_type === 'interactive') {
    return (
      <div className="my-5 rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:p-7">
        {content && <p>{content}</p>}
        <InteractiveSymbolExplorer config={block.interactive_config || {}} />
      </div>
    );
  }

  if (block.content_type === 'quiz_ref') {
    return (
      <div className="my-5 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 sm:p-7">
        {content ? <p>{content}</p> : <p>Check your understanding with questions connected to this lesson.</p>}
        {node?.id && <Link to={`/quiz?unit_id=${encodeURIComponent(node.id)}&activity_scope=lesson`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Start lesson quiz <Icon name="arrow-right" /></Link>}
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
      <Container className="min-h-screen bg-background">
        <div className="flex min-h-[45vh] items-center justify-center">
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
      <Container className="min-h-screen bg-background">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: rootLabelPlural, href: null }]} />
        <PageHeader
          title={`Choose a ${rootLabel}`}
          subtitle={isPharmacy ? 'Begin with a course unit, then follow its sub-course units, themes and lessons.' : 'Begin with a topic, then follow its subtopics, themes and lessons.'}
          className="max-w-4xl border-b border-border pb-8"
        />
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><h2>{rootLabelPlural}</h2></div><span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">{rootNodes.length} available</span></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rootNodes.map((item) => (
              <Link key={item.id} to={`/curriculum/${encodeURIComponent(groupId)}/${slugify(item.slug || item.name)}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`} className={UI.curriculumTile}>
                <span className="min-w-0 flex-1"><strong>{item.name}</strong></span>
              </Link>
            ))}
          </div>
        </section>
      </Container>
    );
  }

  if (error || !node) {
    return (
      <Container className="min-h-screen bg-background">
        <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900">
          <Icon name="triangle-exclamation" />
          <h1>This learning item isn’t available</h1>
          <p>{error || 'We couldn’t find the learning item you requested.'}</p>
          <Link to="/resources" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Back to learning resources</Link>
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
    <Container className="min-h-screen bg-background">
      <Breadcrumb items={breadcrumbItems} />

      <PageHeader
        title={node.name}
        subtitle={node.description || undefined}
        className="max-w-4xl border-b border-border pb-8"
      />

      {isLeaf && blocks.length > 0 && (
        <section className="mt-10 rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2>Study {node.name}</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-5">
            {blocks.map((block) => (
              <article
                key={block.id}
                className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7"
              >
                {block.title && <h3>{block.title}</h3>}
                {block.locked ? (
                  <div className="my-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
                    <p>This lesson is part of premium access.</p>
                    <Link to={getSubscriptionPath(location, { preserveCurrent: true, reason: 'premium' })} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">Unlock this lesson</Link>
                  </div>
                ) : renderBlockContent(block)}
                {block.is_premium && <span className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-amber-700">Premium</span>}
              </article>
            ))}
          </div>
        </section>
      )}

      {children.length > 0 && (
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2>Explore {node.name}</h2>
            </div>
            <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">{children.length} {children.length === 1 ? 'item' : 'items'}</span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {children.map((child) => {
              const parentPath = ancestors
                .map((item) => slugify(item.slug || item.name))
                .join('/');
              const childPath = [parentPath, slugify(child.slug || child.name)]
                .filter(Boolean)
                .join('/');
              const childHref = `/curriculum/${encodeURIComponent(groupId)}/${childPath}${resourceFocus ? `?resource=${encodeURIComponent(resourceFocus)}` : ''}`;

              return (
                <Link key={child.id} to={childHref} className={UI.curriculumTile}>
                  <span className="min-w-0 flex-1">
                    <strong>{child.name}</strong>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {isLesson && (
        <section className="mt-8 rounded-2xl border border-secondary-200 bg-secondary-50 p-6 sm:p-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">Targeted practice</span>
            <h2>Build a test from this lesson</h2>
            <p>Search the questions linked to this lesson, select the concepts you want to practise and save a custom assessment.</p>
          </div>
          <Link to={`/question-bank?unit_id=${encodeURIComponent(node.id)}`} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600">
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
        <section className="mt-10">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2>Connected learning</h2>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relationships.map((relationship, index) => (
              <Link
                key={`${relationship.relationship_type}-${relationship.target_id}-${index}`}
                to={`/curriculum/${encodeURIComponent(groupId)}/${slugify(relationship.target_slug || relationship.target_name)}`}
                onClick={(event) => openRelatedNode(event, relationship)}
                className={UI.curriculumRelatedTile}
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
