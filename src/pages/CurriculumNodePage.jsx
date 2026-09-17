import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Spinner from '../components/Spinner/Spinner';
import Icon from '../components/Icon/Icon';
import { getCurriculumNodeByPath } from '../api/curriculumNavigation';

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resourcePath(path, resource) {
  return `${path}/${resource}`;
}

const RESOURCE_LABELS = {
  notes: 'Notes',
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  recall: 'Recall',
  pdfs: 'PDFs',
  'past-papers': 'Past Papers'
};

export default function CurriculumNodePage() {
  const { groupId, '*': nodePath = '' } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    setLoading(true);
    setError(null);

    getCurriculumNodeByPath(groupId, nodePath)
      .then((result) => {
        if (mounted) setData(result);
      })
      .catch((err) => {
        if (mounted) setError(err?.message || 'Unable to load this curriculum node.');
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

  const breadcrumbItems = useMemo(() => {
    const group = ancestors[1];
    const items = [{ label: 'Home', href: '/' }];

    if (group) {
      items.push({
        label: group.name,
        href: `/curriculum/${group.group_id}`
      });
    }

    ancestors.forEach((ancestor, index) => {
      if (index < 2) return;
      const path = ancestors
        .slice(2, index + 1)
        .map((item) => slugify(item.slug || item.name))
        .join('/');

      items.push({
        label: ancestor.name,
        href: path ? `/curriculum/${group?.group_id}/${path}` : null
      });
    });

    if (node && items[items.length - 1]?.label !== node.name) {
      items.push({ label: node.name, href: null });
    }

    return items;
  }, [ancestors, node]);

  if (loading) {
    return (
      <Container className="curriculum-node-page">
        <div className="curriculum-node-loading">
          <Spinner context="brand" size="lg" />
        </div>
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

  const currentPath = `/curriculum/${groupId}/${nodePath}`.replace(/\/$/, '');
  const availableResources = Object.entries(RESOURCE_LABELS).filter(
    ([key]) => Number(counts[key === 'quiz' ? 'quiz_questions' : key === 'flashcards' ? 'flashcard_decks' : key === 'pdfs' ? 'pdf_resources' : key] || 0) > 0
  );

  return (
    <Container className="curriculum-node-page">
      <Breadcrumb items={breadcrumbItems} />

      <header className="curriculum-node-header">
        <span className="curriculum-node-type">{node.node_type || 'unit'}</span>
        <h1>{node.name}</h1>
        <p>Continue learning through the concepts, resources, and related curriculum connected to this node.</p>
      </header>

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
              const childPath = `${currentPath}/${slugify(child.slug || child.name)}`;
              return (
                <Link key={child.id} to={childPath} className="curriculum-node-child">
                  <span className="curriculum-node-child-icon">
                    {child.icon ? <Icon name={child.icon} /> : <Icon name="book-open" />}
                  </span>
                  <span className="curriculum-node-child-body">
                    <strong>{child.name}</strong>
                    <small>{child.node_type || 'topic'}</small>
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
              <Link key={key} to={resourcePath(currentPath, key)} className="curriculum-node-resource">
                <span>{label}</span>
                <Icon name="arrow-right" />
              </Link>
            ))}
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
