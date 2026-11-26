import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import Button from '../../components/Button/Button';
import { useLayout } from '../../contexts/LayoutContext';
import DynamicActions from '../../components/DynamicActions';
import StorysetIllustration from '../../components/StorysetIllustration';

const CONTENT_TYPES = [
  { key: 'notes', label: 'Notes', description: 'Learn with clear explanations, diagrams, and concise summaries.', icon: 'book-open', route: '/notes', category: 'learn' },
  { key: 'flashcards', label: 'Flashcards', description: 'Recall key facts with quick question-and-answer cards.', icon: 'layer-group', route: '/flashcards', category: 'practise' },
  { key: 'pdfs', label: 'PDF Library', description: 'Find study guides, reference sheets, and course documents.', icon: 'file-pdf', route: '/pdfs', category: 'learn' },
  { key: 'question_bank', label: 'Question Bank', description: 'Search questions by lesson, concept and difficulty, then build a custom test.', icon: 'search', route: '/question-bank', category: 'practise' },
  { key: 'quizzes', label: 'Question practice', description: 'Check your understanding with questions matched to your selected programme.', icon: 'clipboard-check', route: '/quiz', category: 'practise' },
  { key: 'past_papers', label: 'Past Papers', description: 'Build exam confidence with questions from previous exam papers.', icon: 'file-lines', route: '/past-papers', category: 'apply' },
  { key: 'recall', label: 'Recall', description: 'Revisit key ideas at spaced intervals to strengthen long-term recall.', icon: 'brain', route: '/recall', category: 'review' }
];

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'learn', label: 'Learn' },
  { key: 'practise', label: 'Practise' },
  { key: 'apply', label: 'Apply' },
  { key: 'review', label: 'Review' }
];

const CATEGORY_LABELS = { learn: 'Learn', practise: 'Practise', apply: 'Apply', review: 'Review' };

const categoryStyles = {
  learn: 'border-primary-200 bg-primary-50 text-primary-800',
  practise: 'border-secondary-200 bg-secondary-50 text-secondary-800',
  apply: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  review: 'border-primary-200 bg-primary-50 text-primary-800'
};

export default function ResourcesView({ navigate, user }) {
  const { level, groups } = useLayout();
  const activeGroupId = user?.profile?.active_group_id || null;
  const activeGroup = (groups || []).find((group) => group.id === activeGroupId) || null;
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const filteredTypes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return CONTENT_TYPES.filter((type) => {
      const matchesFilter = filter === 'all' || type.category === filter;
      const matchesQuery = !normalizedQuery || type.label.toLowerCase().includes(normalizedQuery) || type.description.toLowerCase().includes(normalizedQuery);
      return matchesFilter && matchesQuery;
    });
  }, [filter, query]);

  const levelName = level?.display_name || level?.name || level?.title || 'Your level';
  const isPharmacy = /pharmacy/i.test(String(levelName));
  const subtitle = isPharmacy
    ? 'Learn pharmaceutical science, practise key concepts, apply your knowledge and review what needs strengthening.'
    : 'Learn core Biology concepts, practise questions, apply your knowledge and review what needs strengthening.';

  function getBrowseHref(type) {
    if (!user) return '/login';
    if (type.key === 'question_bank') return '/question-bank';
    if (activeGroupId) return `/curriculum/${encodeURIComponent(activeGroupId)}?resource=${encodeURIComponent(type.key)}`;
    return type.route;
  }

  return (
    <div className="min-h-screen w-full bg-background">
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <DynamicActions pageId="resources" className="mb-6" />
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources' }]} />

        <header className="mt-8 grid grid-cols-1 items-center gap-6 border-b border-border bg-primary-50 px-5 py-7 pb-8 sm:grid-cols-[minmax(0,1fr)_auto_180px] sm:px-8">
          <div className="max-w-3xl">
            <span className="inline-flex items-center rounded-full border border-primary-200 bg-primary-50 px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] text-primary-800">
              Resources <span className="mx-2 text-primary-400">·</span> {levelName}{activeGroup?.name ? ` · ${activeGroup.name}` : ''}
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-primary-900 sm:text-5xl">Explore your study tools</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted sm:text-lg">{subtitle}</p>
          </div>
          <div className="inline-flex w-fit items-center rounded-xl border border-border bg-white px-4 py-3 text-sm font-semibold text-primary-800 shadow-sm">
            <span className="mr-2 text-xl font-bold">{filteredTypes.length}</span> resources shown
          </div>
          <StorysetIllustration name="library" alt="Library of learning resources" className="hidden w-full max-w-[180px] sm:block" />
        </header>

        {user && activeGroupId && (
          <section className="mt-8 flex flex-col gap-5 rounded-2xl border border-primary-200 bg-primary-50 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8" aria-labelledby="resources-curriculum-heading">
            <div className="max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-primary-700">Start with your syllabus</span>
              <h2 id="resources-curriculum-heading" className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">Browse the curriculum</h2>
              <p className="mt-2 text-sm leading-6 text-primary-800 sm:text-base">
                {isPharmacy ? 'Browse your programme and open the learning materials linked to each course unit and lesson.' : 'Browse your syllabus and open the learning materials linked to each topic and lesson.'}
              </p>
            </div>
            <Button size="sm" variant="primary" onClick={() => navigate(`/curriculum/${encodeURIComponent(activeGroupId)}`)}>
              Browse curriculum <Icon name="arrow-right" />
            </Button>
          </section>
        )}

        <section className="mt-10 w-full bg-secondary-50 px-4 py-6 sm:px-6" aria-label="Resource filters">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter resources">
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 ${active ? 'border-primary-700 bg-primary-700 text-white shadow-sm' : 'border-border bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50 hover:text-primary-800'}`}
                    onClick={() => setFilter(item.key)}
                    aria-pressed={active}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            <label className="flex min-h-12 w-full items-center gap-3 rounded-xl border border-border bg-white px-4 shadow-sm transition focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 lg:max-w-sm">
              <Icon name="search" className="shrink-0 text-muted" />
              <span className="sr-only">Search resources</span>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search resources…"
                aria-label="Search resources"
                className="block min-h-11 w-full min-w-0 flex-1 border-0 bg-transparent px-0 py-2 text-sm leading-6 text-foreground outline-none placeholder:text-slate-400 focus:ring-0 disabled:cursor-not-allowed disabled:text-slate-500"
              />
            </label>
          </div>
        </section>

        <section className="mt-10 w-full bg-primary-50 px-4 py-7 sm:px-6 sm:py-9" aria-labelledby="resources-grid-heading">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">Learn · Practise · Apply · Review</span>
              <h2 id="resources-grid-heading" className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">Browse resources</h2>
            </div>
            <span className="text-sm font-semibold text-muted">{filteredTypes.length} {filteredTypes.length === 1 ? 'resource' : 'resources'}</span>
          </div>

          {filteredTypes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filteredTypes.map((type) => (
                <article key={type.key} className="flex min-h-[290px] flex-col rounded-2xl border border-border bg-white p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-primary-300 hover:shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${categoryStyles[type.category]}`}>
                      {CATEGORY_LABELS[type.category]}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Study tool</span>
                  </div>

                  <div className="mt-6 flex flex-1 flex-col">
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border ${type.category === 'learn' ? 'border-primary-200 bg-primary-50 text-primary-700' : type.category === 'practise' ? 'border-secondary-200 bg-secondary-50 text-secondary-700' : type.category === 'apply' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-primary-200 bg-primary-50 text-primary-700'}`}>
                      <Icon name={type.icon} className="h-8 w-8" />
                    </div>
                    <h3 className="mt-5 text-xl font-bold text-primary-900">{type.label}</h3>
                    <p className="mt-2 flex-1 text-sm leading-6 text-muted">{type.description}</p>
                  </div>

                  <div className="mt-6 border-t border-border pt-5">
                    <Link
                      to={getBrowseHref(type)}
                      className="inline-flex min-h-11 items-center gap-3 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"
                      aria-label={user ? `Explore ${type.label} in your learning pathway` : `Sign in to explore ${type.label}`}
                    >
                      {user ? 'Open resource' : 'Sign in'}
                      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true" focusable="false">
                        <path d="M4.5 12h14m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="mx-auto flex max-w-xl flex-col items-center rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center shadow-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
                <Icon name="search" className="h-8 w-8" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-primary-900">No matching resources</h3>
              <p className="mt-2 max-w-md text-sm leading-6 text-muted">Change your search term and select a category to narrow the results.</p>
              <Button variant="secondary" size="sm" className="mt-5" onClick={() => { setQuery(''); setFilter('all'); }}>
                <Icon name="refresh" /> Reset search and filters
              </Button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
