// src/features/resources/ResourcesView.jsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import Button from '../../components/Button/Button';
import { useLayout } from '../../contexts/LayoutContext';
import '../../styles/resources.css';
import DynamicActions from '../../components/DynamicActions';
import ResourceIllustration from './ResourceIllustration';

const CONTENT_TYPES = [
  {
    key: 'notes',
    label: 'Notes',
    description: 'Learn with clear explanations, diagrams, and concise summaries.',
    icon: 'book-open',
    route: '/notes',
    color: 'blue',
    category: 'study'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Recall key facts with quick question-and-answer cards.',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal',
    category: 'study'
  },
  {
    key: 'pdfs',
    label: 'PDF Library',
    description: 'Find study guides, reference sheets, and course documents.',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey',
    category: 'reference'
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    description: 'Check your understanding with questions matched to your selected programme.',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'amber',
    category: 'assessment'
  },
  {
    key: 'past_papers',
    label: 'Past Papers',
    description: 'Build exam confidence with questions from previous exam papers.',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald',
    category: 'assessment'
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'Revisit key ideas at spaced intervals to strengthen long-term recall.',
    icon: 'brain',
    route: '/recall',
    color: 'violet',
    category: 'practice'
  }
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study materials' },
  { key: 'practice', label: 'Practice tools' },
  { key: 'assessment', label: 'Assessments' },
  { key: 'reference', label: 'Reference materials' }
];

const CATEGORY_LABELS = {
  study: 'Study materials',
  practice: 'Practice tools',
  assessment: 'Assessments',
  reference: 'Reference materials'
};

export default function ResourcesView({ navigate, user, sections }) {
  const { level, bootstrap, groups } = useLayout();
  const activeGroupId = user?.profile?.active_group_id || null;
  const activeGroup = (groups || []).find((group) => group.id === activeGroupId) || null;
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const uiComponents = bootstrap?.ui_components || [];

  function getImage(key) {
    const component = uiComponents.find(
      (item) => item.component_key === `content_type_${key}`
    );

    return component?.properties?.image_url || component?.image_url || null;
  }

  const hubComponent = uiComponents.find(
    (item) => item.component_key === 'resources_hub_section'
  );
  const hubImage =
    hubComponent?.properties?.image_url || hubComponent?.image_url || null;

  const filteredTypes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return CONTENT_TYPES.filter((type) => {
      const matchesFilter = filter === 'all' || type.category === filter;
      const matchesQuery =
        !normalizedQuery ||
        type.label.toLowerCase().includes(normalizedQuery) ||
        type.description.toLowerCase().includes(normalizedQuery);

      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const levelName =
    level?.display_name || level?.name || level?.title || 'Your level';

  const isPharmacy = /pharmacy/i.test(String(levelName));
  const subtitle = isPharmacy
    ? 'Explore notes, flashcards, quizzes, past papers, and recall practice for your Pharmacy programme.'
    : 'Explore Biology notes, diagrams, flashcards, quizzes, and past papers. Choose a resource to study a topic, practise key ideas, and check your understanding.';

  function handleBrowse(type) {
    if (!user) {
      navigate('/login');
      return;
    }

    // Keep the chosen resource type active while the learner moves through
    // topic → subtopic → theme → lesson.
    if (activeGroupId) {
      navigate(`/curriculum/${encodeURIComponent(activeGroupId)}?resource=${encodeURIComponent(type.key)}`);
      return;
    }

    navigate(type.route);
  }

  return (
    <div className="resources-page">
      <main className="resources-main">
        <DynamicActions pageId="resources" className="resources-dynamic-actions" />
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources' }]} />

        <div className="resources-intro">
          <div>
            <span className="resources-section-kicker">Resources · {levelName}{activeGroup?.name ? ` · ${activeGroup.name}` : ''}</span>
            <h1>Explore your study tools</h1>
            <p>{subtitle}</p>
          </div>
          <span className="resources-section-context">
            {filteredTypes.length} of {CONTENT_TYPES.length}
          </span>
        </div>

        {user && activeGroupId && (
          <section className="resources-curriculum-entry" aria-labelledby="resources-curriculum-heading">
            <div className="resources-curriculum-entry-copy">
              <span className="resources-section-kicker">Start with your syllabus</span>
              <h2 id="resources-curriculum-heading">Browse the curriculum</h2>
              <p>Open your programme’s topic map, read lesson content, and follow links to notes, PDFs, flashcards, quizzes, and revision practice for each topic.</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate(`/curriculum/${encodeURIComponent(activeGroupId)}`)}>
              Browse curriculum <Icon name="arrow-right" />
            </Button>
          </section>
        )}

        <div className="resources-toolbar">
          <div className="resources-filter-chips" role="group" aria-label="Filter resources">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`resources-chip${filter === item.key ? ' active' : ''}`}
                onClick={() => setFilter(item.key)}
                aria-pressed={filter === item.key}
              >
                {item.label}
              </button>
            ))}
          </div>

          <label className="resources-search">
            <Icon name="search" />
            <span className="sr-only">Search resources</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search resources…"
              aria-label="Search resources"
            />
          </label>
        </div>

        <div className="resources-section-head">
          <div>
            <span className="resources-section-kicker">Study · Practise · Check your progress</span>
            <h2 className="resources-section-title">
              Your study resources
              <span className="resources-section-count">{filteredTypes.length}</span>
            </h2>
          </div>
        </div>

        {filteredTypes.length > 0 ? (
          <div className="resources-grid">
            {filteredTypes.map((type) => {
              return (
                <article
                  key={type.key}
                  className={`resource-card resource-card-${type.color}`}
                >
                  <div className="resource-card-top">
                    <span className="resource-card-badge">
                      {CATEGORY_LABELS[type.category]}
                    </span>
                  </div>

                  <div className="resource-card-body">
                    <div className="resource-card-artwork" aria-hidden="true">
                      <ResourceIllustration type={type.key} />
                    </div>
                    <h3 className="resource-card-title">{type.label}</h3>
                    <p className="resource-card-desc">{type.description}</p>
                  </div>

                  <div className="resource-card-footer">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBrowse(type)}
                      aria-label={`Open ${type.label}`}
                    >
                      Explore
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="resources-empty-state">
            <div className="resources-empty-icon" aria-hidden="true">
              <Icon name="search" />
            </div>
            <h3>No matching resources</h3>
            <p>
              Change your search term and select a category to narrow the results.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQuery('');
                setFilter('all');
              }}
            >
              <Icon name="refresh" />
              Reset search and filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
