// src/features/resources/ResourcesView.jsx

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import Button from '../../components/Button/Button';
import { useLayout } from '../../contexts/LayoutContext';
import '../../styles/resources.css';
import DynamicActions from '../../components/DynamicActions';

const CONTENT_TYPES = [
  {
    key: 'notes',
    label: 'Notes',
    description: 'Learn with clear explanations, diagrams, and concise summaries.',
    icon: 'book-open',
    route: '/notes',
    color: 'blue',
    category: 'learn'
  },
  {
    key: 'flashcards',
    label: 'Flashcards',
    description: 'Recall key facts with quick question-and-answer cards.',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal',
    category: 'practise'
  },
  {
    key: 'pdfs',
    label: 'PDF Library',
    description: 'Find study guides, reference sheets, and course documents.',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey',
    category: 'learn'
  },
  {
    key: 'quizzes',
    label: 'Question practice',
    description: 'Check your understanding with questions matched to your selected programme.',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'mint',
    category: 'practise'
  },
  {
    key: 'past_papers',
    label: 'Past Papers',
    description: 'Build exam confidence with questions from previous exam papers.',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald',
    category: 'apply'
  },
  {
    key: 'recall',
    label: 'Recall',
    description: 'Revisit key ideas at spaced intervals to strengthen long-term recall.',
    icon: 'brain',
    route: '/recall',
    color: 'violet',
    category: 'review'
  }
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'learn', label: 'Learn' },
  { key: 'practise', label: 'Practise' },
  { key: 'apply', label: 'Apply' },
  { key: 'review', label: 'Review' }
];

const CATEGORY_LABELS = {
  learn: 'Learn',
  practise: 'Practise',
  apply: 'Apply',
  review: 'Review'
};

export default function ResourcesView({ navigate, user, sections }) {
  const { level, groups } = useLayout();
  const activeGroupId = user?.profile?.active_group_id || null;
  const activeGroup = (groups || []).find((group) => group.id === activeGroupId) || null;
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

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
    ? 'Learn pharmaceutical science, practise key concepts, apply your knowledge and review what needs strengthening.'
    : 'Learn core Biology concepts, practise questions, apply your knowledge and review what needs strengthening.';

  function getBrowseHref(type) {
    if (!user) return '/login';

    // The resource card opens the shared curriculum path and carries its
    // resource focus through the level-specific four-stage learning sequence.
    if (activeGroupId) {
      return `/curriculum/${encodeURIComponent(activeGroupId)}?resource=${encodeURIComponent(type.key)}`;
    }

    return type.route;
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
              <p>{isPharmacy ? 'Browse your programme and open the learning materials linked to each course unit and lesson.' : 'Browse your syllabus and open the learning materials linked to each topic and lesson.'}</p>
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
            <span className="resources-section-kicker">Learn · Practise · Apply · Review</span>
            <h2 className="resources-section-title">
              Browse resources
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
                      <Icon name={type.icon} />
                    </div>
                    <h3 className="resource-card-title">{type.label}</h3>
                    <p className="resource-card-desc">{type.description}</p>
                  </div>

                  <div className="resource-card-footer">
                    <Link
                      to={getBrowseHref(type)}
                      className="btn btn-secondary"
                      aria-label={user ? `Explore ${type.label} in your learning pathway` : `Sign in to explore ${type.label}`}
                    >
                      {user ? 'Open resource' : 'Sign in'}
                      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false">
                        <path d="M4.5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
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
