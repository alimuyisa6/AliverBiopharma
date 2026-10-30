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
    image: 'https://images.pexels.com/photos/7972949/pexels-photo-7972949.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    label: 'Notes',
    description: 'Learn with clear explanations, diagrams, and concise summaries.',
    icon: 'book-open',
    route: '/notes',
    color: 'blue',
    category: 'study'
  },
  {
    key: 'flashcards',
    image: 'https://images.pexels.com/photos/16420473/pexels-photo-16420473.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    label: 'Flashcards',
    description: 'Recall key facts with quick question-and-answer cards.',
    icon: 'layer-group',
    route: '/flashcards',
    color: 'teal',
    category: 'study'
  },
  {
    key: 'pdfs',
    image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    label: 'PDF Library',
    description: 'Find study guides, reference sheets, and course documents.',
    icon: 'file-pdf',
    route: '/pdfs',
    color: 'grey',
    category: 'reference'
  },
  {
    key: 'quizzes',
    image: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    label: 'Quizzes',
    description: 'Check your understanding with questions matched to your selected programme.',
    icon: 'clipboard-check',
    route: '/quiz',
    color: 'amber',
    category: 'assessment'
  },
  {
    key: 'past_papers',
    image: 'https://images.pexels.com/photos/8199759/pexels-photo-8199759.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
    label: 'Past Papers',
    description: 'Build exam confidence with questions from previous exam papers.',
    icon: 'file-lines',
    route: '/past-papers',
    color: 'emerald',
    category: 'assessment'
  },
  {
    key: 'recall',
    image: 'https://images.pexels.com/photos/8199770/pexels-photo-8199770.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop',
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
    ? 'Find notes, flashcards, quizzes, past papers, and recall practice for Pharmacy.'
    : 'Find Biology notes, flashcards, quizzes, and past papers in one place.';

  function getBrowseHref(type) {
    if (!user) return '/login';

    // The resource card opens the shared curriculum path and carries its
    // resource focus forward through topic → subtopic → theme → lesson.
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
              <p>Browse your syllabus and open the notes, PDFs, flashcards, and practice activities linked to each topic.</p>
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
            <span className="resources-section-kicker">Study and practise</span>
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
                    <div className="resource-card-artwork">
                      <img src={getImage(type.key) || type.image} alt={`${type.label} learning materials`} loading="lazy" width="900" height="600" />
                      <span className="resource-card-image-label">{type.label}</span>
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
