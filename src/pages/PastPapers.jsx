/* pages/PastPapers.jsx */
import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import StorysetIllustration from '../components/StorysetIllustration';
import { useLevelFilter } from '../hooks/useLevelFilter';
import {
  getPastPapers,
  getPastPaper,
  getPastPaperFilterOptions,
  getPastPaperDownloadUrl,
  togglePaperBookmark,
  getBookmarkedPapers,
  trackPaperView,
  getDownloadHistory,
  trackPaperDownloadAttempt,
  getPaperReviews,
  ratePaper,
  deletePaperReview,
  getPaperFilterPresets,
  savePaperFilterPreset,
  deletePaperFilterPreset
} from '../api/client';
import Icon from '../components/Icon/Icon';
import Skeleton from '../components/Skeleton/Skeleton';
import Button from '../components/Button/Button';
import DownloadButton from '../components/ui/DownloadButton';
import PremiumAccessButton from '../components/ui/PremiumAccessButton';
import Select from '../components/Select/Select';
import EmptyState from '../components/EmptyState/EmptyState';
import { useToast } from '../components/Toast/Toast';
import { useLayout } from '../contexts/LayoutContext';
import ContentSwitcher from '../components/ContentSwitcher/ContentSwitcher';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import { isPremiumAccessError, redirectToSubscription } from '../utils/subscriptionNavigation';
import { getCachedStale, setCache } from '../utils/cache';
import { UI } from '../design-system';

const TABS = [
  { key: 'all', label: 'All papers' },
  { key: 'bookmarked', label: 'Saved papers' },
  { key: 'downloaded', label: 'Downloaded' }
];

export default function PastPapers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const { level, class_name, showAll, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const addToast = useToast();
  const effectiveLevel = showAll ? null : level;
  const effectiveClass = showAll ? null : class_name;
  const initialPapersKey = `papers_page_papers:${user?.id || 'guest'}:${curriculumUnitId || ''}:${effectiveLevel || ''}:${effectiveClass || ''}:all:1::year_desc:{"subject":"","year":"","exam_board":"","paper_type":""}`;
  const initialPapers = getCachedStale(initialPapersKey);

  const [initializing, setInitializing] = useState(true);
  const [papers, setPapers] = useState(() => initialPapers?.papers || []);
  const [filterOptions, setFilterOptions] = useState({
    subjects: [],
    years: [],
    exam_boards: [],
    paper_types: []
  });
  const [filters, setFilters] = useState({
    subject: '',
    year: '',
    exam_board: '',
    paper_type: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(() => initialPapers?.totalPages || 1);
  const [total, setTotal] = useState(() => initialPapers?.total || 0);
  const [papersLoading, setPapersLoading] = useState(() => !initialPapers);
  const [downloadingId, setDownloadingId] = useState(null);
  const [bookmarkingId, setBookmarkingId] = useState(null);
  const [deletingReview, setDeletingReview] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
  const [downloadedIds, setDownloadedIds] = useState(new Set());
  const [selectedPaper, setSelectedPaper] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('year_desc');
  const [presets, setPresets] = useState([]);
  const [presetName, setPresetName] = useState('');
  const [showPresets, setShowPresets] = useState(false);

  const papersRequestId = useRef(0);



  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find(
      (item) => item.component_key === `empty_state_${key}`
    );
    return component?.properties?.image_url || null;
  }

  useEffect(() => {
    let mounted = true;

    getPastPaperFilterOptions()
      .then((result) => {
        if (mounted) {
          setFilterOptions({
            subjects: result?.subjects || [],
            years: result?.years || [],
            exam_boards: result?.exam_boards || [],
            paper_types: result?.paper_types || []
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) {
          setInitializing(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    setPage(1);
  }, [effectiveLevel, effectiveClass, activeTab, searchQuery, curriculumUnitId]);

  useEffect(() => {
    if (!user) {
      setBookmarkedIds(new Set());
      setDownloadedIds(new Set());
      setPresets([]);
      return;
    }

    loadUserInteractions();
    loadPresets();
  }, [user]);

  useEffect(() => {
    loadPapers();
  }, [
    page,
    effectiveLevel,
    effectiveClass,
    activeTab,
    searchQuery,
    sortBy,
    filters.subject,
    filters.year,
    filters.exam_board,
    filters.paper_type,
    curriculumUnitId,
    user?.id
  ]);

  const loadUserInteractions = async () => {
    try {
      const [bookmarked, downloaded] = await Promise.all([
        getBookmarkedPapers(1, 100),
        getDownloadHistory(1, 100)
      ]);

      setBookmarkedIds(
        new Set((bookmarked?.papers || []).map((paper) => paper.id))
      );

      setDownloadedIds(
        new Set((downloaded?.papers || []).map((paper) => paper.id))
      );
    } catch {}
  };

  const loadPresets = async () => {
    try {
      const result = await getPaperFilterPresets();
      setPresets(Array.isArray(result) ? result : []);
    } catch {
      setPresets([]);
    }
  };

  const loadPapers = async () => {
    const requestId = ++papersRequestId.current;
    const cacheKey = `papers:${user?.id || 'guest'}:${curriculumUnitId || ''}:${effectiveLevel || ''}:${effectiveClass || ''}:${activeTab}:${page}:${searchQuery.trim()}:${sortBy}:${JSON.stringify(filters)}`;
    const persistentCacheKey = `papers_page_${cacheKey}`;
    const cached = getCachedStale(persistentCacheKey);

    if (cached) {
      setPapers(cached.papers);
      setTotalPages(cached.totalPages);
      setTotal(cached.total);
      setPapersLoading(false);
    } else {
      setPapersLoading(true);
    }

    try {
      let result;

      if (activeTab === 'bookmarked') {
        result = await getBookmarkedPapers(page, 12);
      } else if (activeTab === 'downloaded') {
        result = await getDownloadHistory(page, 12);
      } else {
        const params = {
          page,
          limit: 12
        };

        if (curriculumUnitId) {
          params.unit_id = curriculumUnitId;
        }

        if (effectiveLevel) {
          params.level = effectiveLevel;
        }

        if (effectiveClass) {
          params.class_name = effectiveClass;
        }

        if (searchQuery.trim()) {
          params.search = searchQuery.trim();
        }

        if (sortBy) {
          params.sort = sortBy;
        }

        if (filters.subject) {
          params.subject = filters.subject;
        }

        if (filters.year) {
          params.year = filters.year;
        }

        if (filters.exam_board) {
          params.exam_board = filters.exam_board;
        }

        if (filters.paper_type) {
          params.paper_type = filters.paper_type;
        }

        result = await getPastPapers(params);
      }

      if (requestId !== papersRequestId.current) {
        return;
      }

      const nextData = {
        papers: result?.papers || [],
        totalPages: result?.total_pages || 1,
        total: result?.total || 0
      };
      setCache(persistentCacheKey, nextData);
      setPapers(nextData.papers);
      setTotalPages(nextData.totalPages);
      setTotal(nextData.total);
    } catch (error) {
      if (requestId !== papersRequestId.current) {
        return;
      }

      console.error('[PAST_PAPERS_LOAD_ERROR]', error);
      addToast("We couldn't load the past papers. Please try again.", 'error');

      setPapers([]);
      setTotalPages(1);
      setTotal(0);
    } finally {
      if (requestId === papersRequestId.current) {
        setPapersLoading(false);
      }
    }
  };

  const loadReviews = async (paperId) => {
    setReviewsLoading(true);

    try {
      const result = await getPaperReviews(paperId, 1, 20);
      setReviews(result?.reviews || []);
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  const recordDownloadAttempt = (paper, status, reason) => {
    trackPaperDownloadAttempt(paper?.id, status, reason).catch(() => {
      // Best-effort audit only: logging must never block a user's download flow.
    });
  };

  const handleDownload = async (paper) => {
    if (!user) {
      addToast('Sign in to download this paper.', 'warning');
      return;
    }

    if (paper.locked) {
      recordDownloadAttempt(paper, 'premium_blocked', paper.reason || 'Premium access required');
      redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
      return;
    }

    setDownloadingId(paper.id);

    try {
      const result = await getPastPaperDownloadUrl(paper.id);

      if (!result?.url) {
        throw new Error('Download URL was not returned');
      }

      recordDownloadAttempt(paper, 'link_issued', 'A signed download link was issued; file completion cannot be confirmed by the browser.');

      const anchor = document.createElement('a');

      anchor.href = result.url;
      anchor.download = `${paper.title}.pdf`;
      anchor.target = '_blank';
      anchor.rel = 'noopener noreferrer';

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      setDownloadedIds((prev) => {
        const next = new Set(prev);
        next.add(paper.id);
        return next;
      });

      addToast('Download started', 'success');
    } catch (error) {
      const status = error?.status === 403
        ? 'premium_blocked'
        : (error?.code === 'REQUEST_TIMEOUT' || error instanceof TypeError)
          ? 'network_error'
          : 'request_failed';
      recordDownloadAttempt(paper, status, error?.message || 'Download request failed');

      if (isPremiumAccessError(error) || error?.status === 403 && /premium/i.test(error?.message || '')) {
        redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
      } else if (status === 'network_error') {
        addToast('Connection problem. Check your internet and try again.', 'error');
      } else {
        addToast("We couldn't download this paper. Please try again.", 'error');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handleBookmark = async (paperId) => {
    if (!user) {
      addToast('Sign in to save this paper to your bookmarks.', 'warning');
      return;
    }

    setBookmarkingId(paperId);
    try {
      const result = await togglePaperBookmark(paperId);

      setBookmarkedIds((prev) => {
        const next = new Set(prev);

        if (result?.bookmarked) {
          next.add(paperId);
        } else {
          next.delete(paperId);
        }

        return next;
      });

      if (activeTab === 'bookmarked') {
        loadPapers();
      }
    } catch {
      addToast("We couldn't update your bookmark. Please try again.", 'error');
    } finally {
      setBookmarkingId(null);
    }
  };

  const handlePaperOpen = async (paper) => {
    if (paper.is_premium) {
      try {
        const access = await getPastPaper(paper.id);
        if (access?.locked && ['premium_locked', 'premium_required'].includes(access.reason)) {
          redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
          return;
        }
        if (access?.locked) {
          addToast('This paper is restricted for your account.', 'warning');
          return;
        }
      } catch (error) {
        if (isPremiumAccessError(error)) {
          redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
          return;
        }
        addToast(error?.message || "We couldn't open this paper. Please try again.", 'error');
        return;
      }
    }

    setSelectedPaper(paper);

    setReviewRating(0);
    setReviewComment('');

    if (user) {
      try {
        await trackPaperView(paper.id);
      } catch {}
    }

    loadReviews(paper.id);
  };

  const handleCloseModal = () => {
    setSelectedPaper(null);
    setReviews([]);
    setReviewRating(0);
    setReviewComment('');
  };

  const handleSubmitReview = async () => {
    if (!selectedPaper) {
      return;
    }

    if (!user) {
      addToast('Sign in to leave a review for this paper.', 'warning');
      return;
    }

    if (!reviewRating) {
      addToast('Choose a star rating before submitting your review.', 'warning');
      return;
    }

    setSubmittingReview(true);

    try {
      await ratePaper(
        selectedPaper.id,
        reviewRating,
        reviewComment.trim() || null
      );

      addToast('Review submitted', 'success');

      setReviewRating(0);
      setReviewComment('');

      loadReviews(selectedPaper.id);
    } catch {
      addToast("We couldn't submit your review. Please try again.", 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async () => {
    if (!selectedPaper) {
      return;
    }

    setDeletingReview(true);
    try {
      await deletePaperReview(selectedPaper.id);

      addToast('Review deleted', 'success');
      loadReviews(selectedPaper.id);
    } catch {
      addToast("We couldn't delete your review. Please try again.", 'error');
    } finally {
      setDeletingReview(false);
    }
  };

  const handleSavePreset = async () => {
    if (!user) {
      addToast('Sign in to save your filter settings.', 'warning');
      return;
    }

    if (!presetName.trim()) {
      return;
    }

    setSavingPreset(true);
    try {
      const preset = await savePaperFilterPreset(
        presetName.trim(),
        filters
      );

      setPresets((prev) => [
        preset,
        ...prev.filter((item) => item.name !== preset.name)
      ]);

      setPresetName('');

      addToast('Filter preset saved', 'success');
    } catch {
      addToast("We couldn't save these filters. Please try again.", 'error');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleApplyPreset = (preset) => {
    setFilters({
      subject: preset?.filters?.subject || '',
      year: preset?.filters?.year || '',
      exam_board: preset?.filters?.exam_board || '',
      paper_type: preset?.filters?.paper_type || ''
    });

    setPage(1);
    setShowPresets(false);
  };

  const handleDeletePreset = async (presetId) => {
    setDeletingPresetId(presetId);
    try {
      await deletePaperFilterPreset(presetId);

      setPresets((prev) =>
        prev.filter((preset) => preset.id !== presetId)
      );
    } catch {
      addToast("We couldn't delete this saved filter. Please try again.", 'error');
    } finally {
      setDeletingPresetId(null);
    }
  };

  const clearFilters = () => {
    setFilters({
      subject: '',
      year: '',
      exam_board: '',
      paper_type: ''
    });

    setPage(1);
  };

  const activeFilterCount = [
    filters.subject,
    filters.year,
    filters.exam_board,
    filters.paper_type
  ].filter(Boolean).length;

  const levelName = displayName || level || '';
  const classLabel = class_name || '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="w-full bg-primary-50 px-4 py-10 sm:px-6 lg:py-14">
        <div className="mx-auto max-w-7xl">
          <div className="grid max-w-4xl gap-4">
            <div className="flex items-center justify-between gap-6">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-primary-950 sm:text-5xl">
              {levelName ? `${levelName} past papers` : 'Past papers'}
              </h1>
              <StorysetIllustration name="onlineTest" alt="Learner preparing for an exam" className="hidden w-40 shrink-0 object-contain sm:block" />
            </div>

            {classLabel && (
              <p className="mt-2 text-lg font-semibold text-secondary-800">
                {classLabel}
              </p>
            )}

            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Search past exams by subject, year, or exam board. Save papers and practise at your own pace.
            </p>

            <Breadcrumb items={[
              { label: 'Home', href: '/' },
              { label: curriculumUnitId ? 'Curriculum Past Papers' : 'Past Papers' },
            ]} />

            <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-border pt-5 text-sm text-slate-600">
              <span className="inline-flex items-center gap-1">
                <strong>{total}</strong> papers
              </span>
              <span className="h-5 w-px bg-border" />
              <span className="inline-flex items-center gap-1">
                <strong>{filterOptions.years.length || '—'}</strong> years
              </span>
              <span className="h-5 w-px bg-border" />
              <span className="inline-flex items-center gap-1">
                <strong>{filterOptions.subjects.length || '—'}</strong> subjects
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!user && (
          <div className="mb-6 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-4 text-sm font-medium text-primary-950">
            <Icon name="lock" /> <span>You can browse past papers freely. Sign in when you're ready to download one.</span>
          </div>
        )}

        <ContentSwitcher
          title="Past paper collection"
          options={TABS.map((tab) => ({
            value: tab.key,
            label: tab.label,
            icon: <Icon name={tab.key === 'all' ? 'file-lines' : tab.key === 'bookmarked' ? 'bookmark' : 'download'} />
          }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === 'all' && (
          <div className="my-6 flex flex-wrap items-end gap-4 rounded-2xl border border-border bg-white p-4 shadow-sm">
            <div className="relative min-w-[min(100%,18rem)] flex-1">
              <input
                type="search"
                placeholder="Search past papers…"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="block min-h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-3 pr-11 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 hover:border-primary-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                aria-label="Search past papers"
              />
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">
                <Icon name="magnifying-glass" />
              </span>
            </div>

            <Select
              label="Sort by"
              options={[
                { value: 'year_desc', label: 'Newest' },
                { value: 'year_asc', label: 'Oldest' },
                { value: 'downloads', label: 'Most downloaded' },
                { value: 'rating', label: 'Highest rated' }
              ]}
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
            />

            <Button
              variant={showFilters ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setShowFilters((value) => !value)}
            >
              <Icon name="filter" /> Filter papers
              {activeFilterCount > 0 && (
                <span className="ml-2 rounded-full bg-secondary-100 px-2 py-0.5 text-xs font-bold text-secondary-900">{activeFilterCount}</span>
              )}
            </Button>

            {user && presets.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPresets((value) => !value)}
              >
                <Icon name="bookmark" /> Presets
              </Button>
            )}

            {activeFilterCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <Icon name="xmark" /> Clear filters
              </Button>
            )}

            <p className="ml-auto text-sm font-semibold text-slate-600">
              {papersLoading ? 'Loading past papers…' : `${total} ${total === 1 ? 'paper' : 'papers'} found`}
            </p>
          </div>
        )}

        {showPresets && activeTab === 'all' && user && (
          <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-white p-4 shadow-sm">
            {presets.length === 0 ? (
              <p className="text-sm text-muted">No saved filters yet. Save a filter to reuse it later.</p>
            ) : (
              presets.map((preset) => (
                <div key={preset.id} className="flex items-center gap-2 border-b border-border py-2 last:border-0">
                  <button
                    className="inline-flex min-h-10 flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-primary-800 hover:bg-primary-50"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <Icon name="bookmark" />
                    {preset.name}
                  </button>
                  <button
                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-red-700 hover:bg-red-50 disabled:opacity-50"
                    onClick={() => handleDeletePreset(preset.id)}
                    disabled={deletingPresetId === preset.id}
                    aria-label={`Delete ${preset.name}`}
                  >
                    <Icon name="trash" />
                  </button>
                </div>
              ))
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="text"
                placeholder="Name this filter…"
                value={presetName}
                onChange={(event) => setPresetName(event.target.value)}
                className={`${UI.inputBase} border-border`}
                maxLength={50}
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSavePreset}
                loading={savingPreset}
                loadingLabel="Saving…"
                disabled={!presetName.trim()}
              >
                Save
              </Button>
            </div>
          </div>
        )}

        {showFilters && activeTab === 'all' && (
          <div className="mt-4 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-4 sm:grid-cols-2 xl:grid-cols-4">
            <Select
              label="Subject"
              options={filterOptions.subjects.map((subject) => ({
                value: subject,
                label: subject
              }))}
              value={filters.subject}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  subject: event.target.value
                }))
              }
            />

            <Select
              label="Year"
              options={filterOptions.years.map((year) => ({
                value: String(year),
                label: String(year)
              }))}
              value={filters.year}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  year: event.target.value
                }))
              }
            />

            <Select
              label="Exam Board"
              options={filterOptions.exam_boards.map((board) => ({
                value: board,
                label: board
              }))}
              value={filters.exam_board}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  exam_board: event.target.value
                }))
              }
            />

            <Select
              label="Paper Type"
              options={filterOptions.paper_types.map((type) => ({
                value: type,
                label: type
              }))}
              value={filters.paper_type}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  paper_type: event.target.value
                }))
              }
            />
          </div>
        )}

        {papersLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="rounded-2xl border border-border bg-white p-5" aria-hidden="true">
                <div className="grid gap-4">
                  <Skeleton width="80%" height={20} borderRadius="var(--radius-sm)" />
                  <Skeleton width="50%" height={14} borderRadius="var(--radius-sm)" />
                  <Skeleton width="100%" height={14} borderRadius="var(--radius-sm)" />
                  <Skeleton width="60%" height={14} borderRadius="var(--radius-sm)" />
                </div>
              </div>
            ))}
          </div>
        ) : papers.length === 0 ? (
          <EmptyState
            image={getEmptyStateImage('past_papers')}
            title={
              activeTab === 'bookmarked'
                ? 'Your saved papers'
                : activeTab === 'downloaded'
                ? 'Your downloads'
                : 'Past papers for your studies'
            }
            description={
              activeTab === 'bookmarked'
                ? 'Save papers here to find them quickly next time.'
                : activeTab === 'downloaded'
                ? 'Your downloaded papers will appear here for easy access.'
                : `There are no past papers listed for ${classLabel || levelName || 'your selected programme'} yet. Try adjusting the filters above.`
            }
            action={
              activeTab === 'all' && (
                <Button variant="secondary" onClick={clearFilters}>
                  Clear filters
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {papers.map((paper) => (
              <article
                key={paper.id}
                className={`relative flex h-full min-w-0 flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg ${paper.is_premium ? 'border-secondary-300' : 'border-border hover:border-primary-300'}`}
              >
                <span className={`absolute right-3 top-3 z-10 rounded-full px-3 py-1 text-xs font-bold ${paper.is_premium ? 'bg-secondary-100 text-secondary-900' : 'bg-emerald-100 text-emerald-900'}`} aria-label={paper.is_premium ? 'Premium resource' : 'Free resource'}>{paper.is_premium ? 'Premium' : 'Free'}</span>
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-primary-50">
                  <img
                    src={paper.cover_image_url || paper.thumbnail_url || paper.image_url || 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                    alt={paper.subject ? `${paper.subject} past paper` : paper.title}
                    loading="lazy"
                    width="900"
                    height="600"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute bottom-3 left-3 rounded-lg bg-primary-900/90 px-3 py-1.5 text-xs font-bold text-white">{paper.subject || 'Exam paper'}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-lg font-extrabold leading-6 text-primary-900">{paper.title}</h3>
                    <button
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border transition ${bookmarkedIds.has(paper.id) ? 'border-secondary-300 bg-secondary-50 text-secondary-800' : 'border-border bg-white text-muted hover:bg-primary-50 hover:text-primary-800'}`}
                      onClick={() => handleBookmark(paper.id)}
                      aria-label={bookmarkedIds.has(paper.id) ? 'Remove bookmark' : 'Bookmark paper'}
                      disabled={bookmarkingId === paper.id}
                    >
                      <Icon name={bookmarkedIds.has(paper.id) ? 'bookmark-solid' : 'bookmark'} />
                    </button>
                  </div>
                  <p className="text-sm font-semibold text-muted">{paper.subject}</p>
                  {paper.avg_rating > 0 && (
                    <div className="flex items-center gap-1 text-secondary-600">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={
                            star <= Math.round(paper.avg_rating)
                              ? 'text-secondary-600'
                              : 'text-slate-300'
                          }
                        >
                          <Icon name="star" />
                        </span>
                      ))}
                      <span className="ml-1 text-xs text-muted">({paper.rating_count || 0})</span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {paper.level && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{paper.level}</span>}
                    {paper.year && <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-900">{paper.year}</span>}
                    {paper.paper_type && <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-900">{paper.paper_type}</span>}
                    {paper.class_name && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">{paper.class_name}</span>}
                    {downloadedIds.has(paper.id) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">
                        <Icon name="check" /> Downloaded
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border p-5">
                  <Button variant="secondary" size="sm" className="min-w-28" onClick={() => handlePaperOpen(paper)}>
                    View details
                  </Button>
                  {paper.is_premium ? (
                    <PremiumAccessButton
                      loading={downloadingId === paper.id}
                      onClick={() => handleDownload(paper)}
                    >
                      Download premium paper
                    </PremiumAccessButton>
                  ) : (
                    <DownloadButton
                      loading={downloadingId === paper.id}
                      onClick={() => handleDownload(paper)}
                    >
                      {user ? 'Download paper' : 'Sign in to download'}
                    </DownloadButton>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {!papersLoading && totalPages > 1 && (
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-border py-6">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
            >
              <Icon name="chevron-left" />
            </Button>

            {Array.from({ length: totalPages }, (_, index) => index + 1)
              .filter(
                (item) =>
                  item === 1 ||
                  item === totalPages ||
                  Math.abs(item - page) <= 2
              )
              .map((item) => (
                <Button
                  key={item}
                  variant={item === page ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setPage(item)}
                >
                  {item}
                </Button>
              ))}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
            >
              <Icon name="chevron-right" />
            </Button>
          </div>
        )}
      </div>

      {curriculumUnitId && (
        <LearningJourney
          unitId={curriculumUnitId}
          excludeStages={['papers']}
          returnTo={'/past-papers?unit_id=' + encodeURIComponent(curriculumUnitId)}
        />
      )}

      {selectedPaper && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 sm:p-6" onClick={handleCloseModal}>
          <div className="my-auto w-full max-w-3xl overflow-hidden rounded-2xl border border-border bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-start justify-between gap-4 border-b border-border bg-primary-50 p-5 sm:p-6">
              <div>
                <h2 className="text-xl font-extrabold text-primary-900 sm:text-2xl">{selectedPaper.title}</h2>
                <p className="mt-1 text-sm text-muted">{selectedPaper.subject}</p>
              </div>
              <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-muted hover:bg-primary-50 hover:text-primary-900" onClick={handleCloseModal} aria-label="Close">
                <Icon name="xmark" />
              </button>
            </div>

            <div className="grid max-h-[80vh] gap-6 overflow-y-auto p-4 sm:p-6">
              <div className="flex flex-wrap gap-2">
                {selectedPaper.level && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selectedPaper.level}</span>}
                {selectedPaper.year && <span className="rounded-full bg-secondary-100 px-3 py-1 text-xs font-semibold text-secondary-900">{selectedPaper.year}</span>}
                {selectedPaper.paper_type && <span className="rounded-full bg-primary-100 px-3 py-1 text-xs font-semibold text-primary-900">{selectedPaper.paper_type}</span>}
                {selectedPaper.exam_board && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">{selectedPaper.exam_board}</span>}
                {selectedPaper.class_name && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-900">{selectedPaper.class_name}</span>}
              </div>

              <div className="flex flex-wrap gap-3 border-b border-border pb-5">
                {selectedPaper.is_premium ? (
                  <Button
                    size="sm"
                    loading={downloadingId === selectedPaper.id}
                    onClick={() => handleDownload(selectedPaper)}
                    variant="warm"
                  >
                    <Icon name="lock" />
                    Download premium paper
                  </Button>
                ) : (
                  <DownloadButton
                    loading={downloadingId === selectedPaper.id}
                    onClick={() => handleDownload(selectedPaper)}
                  >
                    Download
                  </DownloadButton>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleBookmark(selectedPaper.id)}
                >
                  <Icon name={bookmarkedIds.has(selectedPaper.id) ? 'bookmark-solid' : 'bookmark'} />
                  {bookmarkedIds.has(selectedPaper.id) ? 'Bookmarked' : 'Bookmark'}
                </Button>
              </div>

              <div className="grid gap-3 border-b border-border pb-6">
                <span className="text-sm font-bold text-primary-900">Your rating</span>
                <div className="flex items-center gap-1 text-secondary-600">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg ${star <= reviewRating ? 'bg-secondary-100 text-secondary-800' : 'bg-slate-100 text-slate-400'}`}
                      onClick={() => setReviewRating(star)}
                      aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                    >
                      <Icon name="star" />
                    </button>
                  ))}
                </div>
                <textarea
                  className={`${UI.inputBase} min-h-32 resize-y border-border`}
                  placeholder="Share your thoughts on this paper (optional)…"
                  value={reviewComment}
                  onChange={(event) => setReviewComment(event.target.value)}
                  rows={3}
                />
                <Button
                  size="sm"
                  variant="primary"
                  loading={submittingReview}
                  onClick={handleSubmitReview}
                >
                  <Icon name="paper-plane" /> Submit review
                </Button>
              </div>

              {reviewsLoading ? (
                <div className="flex min-h-24 items-center justify-center">
                  <Spinner size="sm" />
                </div>
              ) : reviews.length === 0 ? (
                <p className="rounded-xl bg-primary-50 p-4 text-sm text-muted">No reviews yet. Leave a review to help other learners choose useful papers.</p>
              ) : (
                <div className="grid divide-y divide-border">
                  {reviews.map((review) => (
                    <div key={review.id} className="grid gap-3 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-800">
                            {review.display_name?.[0] || 'U'}
                          </div>
                          <div>
                            <span className="block text-sm font-bold text-primary-900">
                              {review.display_name || 'Anonymous'}
                            </span>
                            <div className="mt-1 flex items-center gap-1 text-secondary-600">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  className={star <= review.rating ? 'text-secondary-600' : 'text-slate-300'}
                                >
                                  <Icon name="star" />
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="text-xs text-muted">
                            {new Date(review.created_at).toLocaleDateString()}
                          </span>
                          {review.user_id === user?.id && (
                            <button className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50" onClick={handleDeleteReview} disabled={deletingReview}>
                              <Icon name="trash" /> Delete
                            </button>
                          )}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="rounded-xl bg-primary-50 p-4 text-sm leading-6 text-slate-700">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

