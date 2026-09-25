// src/features/resources/ResourcesView.jsx

import { useMemo, useState } from 'react';
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { useLayout } from '../../contexts/LayoutContext';
import '../../styles/resources.css';

const CONTENT_TYPES = [
  {
    key: 'notes',
    label: 'Notes',
    description: 'Structured Biology and Pharmacy notes with clear explanations, diagrams, and summaries.',
    icon: 'book-open',
    route: '/notes',
    color: 'blue',
    category: 'study'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Active recall with focused cards designed to strengthen memory and understanding.',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal',
    category: 'study'
  },
  {
    key: 'pdfs',
    label: 'PDF Library',
    description: 'Downloadable guides, reference sheets, and carefully organised study documents.',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey',
    category: 'reference'
  },
  {
    key: 'quizzes',
    label: 'Quizzes',
    description: 'Structured assessments across Biology and Pharmacy topics to test what you know.',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'amber',
    category: 'assessment'
  },
  {
    key: 'past_papers',
    label: 'Past Papers',
    description: 'Exam papers organised for focused practice, revision, and exam preparation.',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald',
    category: 'assessment'
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'Spaced repetition that brings important topics back at the right time for review.',
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
  const { level, bootstrap } = useLayout();
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

  const subtitle =
    sections?.section_headings?.content_types_subtitle ||
    'Notes, flashcards, quizzes, past papers and recall — everything you need to study Biology and Pharmacy with purpose.';

  function handleBrowse(type) {
    navigate(user ? type.route : '/login');
  }

  return (
    <div className="resources-page">
      <main className="resources-main">
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

        <div className="resources-intro">
          <div>
            <span className="resources-section-kicker">Resources · {levelName}</span>
            <h1>Your learning library</h1>
            <p>{subtitle}</p>
          </div>
          <span className="resources-section-context">
            {filteredTypes.length} of {CONTENT_TYPES.length}
          </span>
        </div>

        <div className="resources-section-head">
          <div>
            <span className="resources-section-kicker">Learning library</span>
            <h2 className="resources-section-title">
              Explore your resources
              <span className="resources-section-count">{filteredTypes.length}</span>
            </h2>
          </div>
        </div>

        {filteredTypes.length > 0 ? (
          <div className="resources-grid">
            {filteredTypes.map((type) => {
              const imageUrl = getImage(type.key);

              return (
                <article
                  key={type.key}
                  className={`resource-card resource-card-${type.color}`}
                >
                  <div className="resource-card-top">
                    <div className="resource-card-icon" aria-hidden="true">
                      {imageUrl ? (
                        <img src={imageUrl} alt="" loading="lazy" />
                      ) : (
                        <Icon name={type.icon} />
                      )}
                    </div>
                    <span className="resource-card-badge">
                      {CATEGORY_LABELS[type.category]}
                    </span>
                  </div>

                  <div className="resource-card-body">
                    <h3 className="resource-card-title">{type.label}</h3>
                    <p className="resource-card-desc">{type.description}</p>
                  </div>

                  <div className="resource-card-footer">
                    <span className="resource-card-meta">
                      <Icon name="arrow-right" />
                      Open resource
                    </span>

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleBrowse(type)}
                      aria-label={`Browse ${type.label}`}
                    >
                      Browse
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
            <h3>No resources found</h3>
            <p>
              Try another search term or choose a different resource category.
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
              Reset filters
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
