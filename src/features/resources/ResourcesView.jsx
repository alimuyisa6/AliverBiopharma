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
    description: 'Clear explanations, diagrams and summaries to help you understand each topic.',
    icon: 'book-open',
    route: '/notes',
    color: 'blue',
    category: 'study'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Use short question-and-answer cards to test what you remember.',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal',
    category: 'study'
  },
  {
    key: 'pdfs',
    label: 'PDF Library',
    description: 'Download study guides, reference sheets and other useful documents.',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey',
    category: 'reference'
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    description: 'Check your understanding with questions from your course or subject.',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'amber',
    category: 'assessment'
  },
  {
    key: 'past_papers',
    label: 'Past Papers',
    description: 'Practise with past exam papers and build confidence before your exams.',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald',
    category: 'assessment'
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'Revisit key ideas over time to help move them into long-term memory.',
    icon: 'brain',
    route: '/recall',
    color: 'violet',
    category: 'practice'
  }
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'study', label: 'Study' },
  { key: 'practice', label: 'Practice' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'reference', label: 'Reference' }
];

const CATEGORY_LABELS = {
  study: 'Study',
  practice: 'Practice',
  assessment: 'Assessment',
  reference: 'Reference'
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
    ? 'Explore course-unit notes, flashcards, quizzes, past papers and recall practice matched to your Pharmacy programme.'
    : 'Explore Biology notes, diagrams, flashcards, quizzes and past papers. Choose a resource to understand a topic, practise and check what you remember.';

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
            <h1>Choose a resource and get started</h1>
            <p>{subtitle}</p>
          </div>
          <span className="resources-section-context">
            {filteredTypes.length} of {CONTENT_TYPES.length}
          </span>
        </div>

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
            <span className="resources-section-kicker">Study · Practise · Review</span>
            <h2 className="resources-section-title">
              Browse your study resources
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
                      Open resource
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
              Try a different search or choose another category.
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
              Clear search and filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
