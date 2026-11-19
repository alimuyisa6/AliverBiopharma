 import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import ChartWhenVisible from '../components/charts/ChartWhenVisible';
const TotalLearningActivity = lazy(() => import('../components/charts/AnalyticsCharts').then((m) => ({ default: m.TotalLearningActivity })));
const ActivityDistribution = lazy(() => import('../components/charts/AnalyticsCharts').then((m) => ({ default: m.ActivityDistribution })));
const MasteryDonut = lazy(() => import('../components/charts/AnalyticsCharts').then((m) => ({ default: m.MasteryDonut })));
const XpBars = lazy(() => import('../components/charts/AnalyticsCharts').then((m) => ({ default: m.XpBars })));
const DualAreaTrend = lazy(() => import('../components/charts/DualAreaTrend'));
const BarChart = lazy(() => import('../components/charts/BarChart'));
const DonutChart = lazy(() => import('../components/charts/DonutChart'));
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getUserDashboard } from '../api/cachedClient';
import { getCachedStale, setCache } from '../utils/cache';
import { scheduleLearningPagePrefetch } from '../utils/prefetchLearningPages';
import { listClassrooms as fetchClassrooms } from '../api/client';
import { getDownloadHistory, getDownloadAttemptSummary } from '../api/client';
import { getCurriculumTree } from '../api/curriculumNavigation';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import EmptyState from '../components/EmptyState/EmptyState';
import Icon from '../components/Icon/Icon';
import Container from '../components/Container/Container';
import ProgressBar, { ProgressRing } from '../components/ProgressBar/ProgressBar';
import { useI18n } from '../contexts/I18nContext';

const pageWrap = 'mx-auto w-full max-w-7xl space-y-7 px-3 py-4 sm:px-6 sm:py-10 lg:px-8';
const cardBase = 'overflow-hidden rounded-2xl border shadow-card transition-shadow hover:shadow-card-hover';
const cardPrimary = `${cardBase} border-primary-100 bg-primary-50/80`;
const cardSecondary = `${cardBase} border-slate-200 bg-white`;
const panelHeader = 'flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-3 py-4 sm:px-6';
const panelBody = 'space-y-4 p-3 sm:p-6';
const panelTitle = 'text-xl font-bold text-primary-900 sm:text-2xl';
const sectionIntro = 'max-w-3xl text-sm text-slate-600 sm:text-base';
const noteText = 'text-sm leading-6 text-slate-600';
const graphGuide = 'rounded-xl bg-white p-3 text-sm leading-6 text-slate-600 sm:p-4';
const insightChart = 'space-y-3 rounded-xl bg-white p-3 sm:p-4';
const sectionLink = 'inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2 text-sm font-bold text-primary-800 no-underline transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-900';
const listGrid = 'grid gap-2';
const listItem = 'flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-3 py-3 text-slate-700 no-underline';
const listItemLink = `${listItem} transition hover:border-primary-200 hover:bg-primary-50`;
const itemText = 'flex min-w-0 flex-col text-slate-700 [&_small]:text-xs [&_small]:text-slate-500';
const metricBox = 'flex flex-col gap-1 rounded-xl border border-slate-200 bg-white p-4';
const metricBoxPass = 'flex flex-col gap-1 rounded-xl border border-emerald-200 bg-emerald-50 p-4';
const metricBoxFail = 'flex flex-col gap-1 rounded-xl border border-red-200 bg-red-50 p-4';
const metricValue = 'text-2xl font-extrabold text-primary-900';
const metricLabel = 'text-xs font-semibold text-slate-600';
const statCell = 'flex flex-col rounded-xl border border-slate-200 bg-white p-3 [&_strong]:text-xl [&_strong]:font-extrabold [&_strong]:text-primary-900 [&_span]:text-xs [&_span]:font-semibold [&_span]:text-slate-600';
const chartLoading = 'flex min-h-40 items-center justify-center text-sm text-slate-500';
const skeletonBlock = 'animate-shimmer rounded-xl bg-slate-200';

const downloadStatusStyles = {
  link_issued: 'bg-emerald-50 text-emerald-800',
  premium_blocked: 'bg-secondary-50 text-secondary-800',
  network_error: 'bg-slate-100 text-slate-700',
  request_failed: 'bg-red-50 text-red-800'
};

const classroomStatusStyles = {
  live: 'bg-red-50 text-red-700',
  open_floor: 'bg-emerald-50 text-emerald-800',
  upcoming: 'bg-primary-50 text-primary-800'
};

const activityIconStyles = {
  recall: 'bg-primary-50 text-primary-700',
  quiz: 'bg-secondary-50 text-secondary-700',
  flashcards: 'bg-emerald-50 text-emerald-700',
  reading: 'bg-slate-100 text-slate-700'
};

function ChartFallback() {
  return <div className={chartLoading} role="status">Loading chart…</div>;
}

function ChartBlock({ children }) {
  return (
    <ChartWhenVisible>
      <Suspense fallback={<ChartFallback />}>{children}</Suspense>
    </ChartWhenVisible>
  );
}

function DashboardSectionAside({ children }) {
  return (
    <aside className="rounded-xl border-l-4 border-secondary-500 bg-secondary-50 px-4 py-3 text-sm text-secondary-900" aria-label="Helpful next step">
      <strong className="font-bold">Your next step</strong>
      <p className="mt-1 text-secondary-800">{children}</p>
    </aside>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { level, bootstrap } = useLayout();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();

  const dashboardCacheKey = `dashboard_${user?.id || 'guest'}`;
  const initialSummary = user?.id ? getCachedStale(dashboardCacheKey) : null;
  const [summary, setSummary] = useState(() => initialSummary);
  const [loading, setLoading] = useState(() => !initialSummary);
  const [error, setError] = useState(null);
  const [activityRange, setActivityRange] = useState('week');
  const [downloadHistory, setDownloadHistory] = useState({ papers: [], total: 0 });
  const [downloadAttempts, setDownloadAttempts] = useState({ counts: {}, recent: [] });
  const [classroomRooms, setClassroomRooms] = useState([]);
  const [curriculumNodes, setCurriculumNodes] = useState([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumError, setCurriculumError] = useState(null);
  const summaryLoadedRef = useRef(false);

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;
    const cachedSummary = user?.id ? getCachedStale(dashboardCacheKey) : null;
    if (cachedSummary) {
      summaryLoadedRef.current = true;
      setSummary(cachedSummary);
      setLoading(false);
    } else {
      summaryLoadedRef.current = false;
      setLoading(true);
    }

    const refreshDashboard = () => {
      getUserDashboard()
        .then((data) => {
          if (mounted) {
            summaryLoadedRef.current = true;
            setSummary(data);
            setCache(dashboardCacheKey, data);
            setError(null);
          }
        })
        .catch(() => {
          if (mounted && !summaryLoadedRef.current) {
            setError("We couldn't load your dashboard. Please try again in a moment.");
          }
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    refreshDashboard();
    const refreshTimer = window.setInterval(refreshDashboard, 60000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [access.canAccess, user?.id, dashboardCacheKey]);

  useEffect(() => {
    if (!access.canAccess || !user?.id || !summary?.group_id) return undefined;

    return scheduleLearningPagePrefetch({
      userId: user.id,
      level: user.profile?.track || null,
      className: user.profile?.class_name || null,
      groupId: summary.group_id || user.profile?.active_group_id || null
    });
  }, [access.canAccess, user?.id, user?.profile?.track, user?.profile?.class_name, user?.profile?.active_group_id, summary?.group_id]);

  useEffect(() => {
    let mounted = true;

    const refreshHistory = () => {
      getDownloadHistory(1, 5)
        .then((data) => {
          if (mounted) {
            setDownloadHistory({
              papers: Array.isArray(data?.papers) ? data.papers : [],
              total: Number(data?.total) || 0
            });
          }
        })
        .catch(() => {});
    };

    refreshHistory();
    const refreshTimer = window.setInterval(refreshHistory, 60000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;

    const refreshAttempts = () => {
      getDownloadAttemptSummary()
        .then((data) => {
          if (mounted) {
            setDownloadAttempts({
              counts: data?.counts || {},
              recent: Array.isArray(data?.recent) ? data.recent : []
            });
          }
        })
        .catch(() => {});
    };

    refreshAttempts();
    const refreshTimer = window.setInterval(refreshAttempts, 60000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [user?.id]);

  useEffect(() => {
    let mounted = true;
    const groupId = summary?.group_id;

    if (!groupId) {
      setClassroomRooms([]);
      return () => { mounted = false; };
    }

    const refreshClassrooms = () => {
      fetchClassrooms(null, groupId)
        .then((rooms) => {
          if (mounted) {
            setClassroomRooms(
              (Array.isArray(rooms) ? rooms : [])
                .filter((room) => ['live', 'open_floor', 'upcoming'].includes(room.status))
                .slice(0, 4)
            );
          }
        })
        .catch(() => {});
    };

    refreshClassrooms();
    const refreshTimer = window.setInterval(refreshClassrooms, 30000);

    return () => {
      mounted = false;
      window.clearInterval(refreshTimer);
    };
  }, [summary?.group_id]);

  useEffect(() => {
    const groupId = summary?.group_id;
    let mounted = true;

    if (!groupId) {
      setCurriculumNodes([]);
      setCurriculumLoading(false);
      setCurriculumError(null);
      return () => { mounted = false; };
    }

    setCurriculumLoading(true);
    setCurriculumError(null);
    getCurriculumTree(groupId)
      .then((tree) => {
        if (!mounted) return;
        const nodes = Array.isArray(tree) ? tree : [];
        setCurriculumNodes(nodes.sort((a, b) =>
          Number(a.depth || 0) - Number(b.depth || 0) ||
          Number(a.display_order || 0) - Number(b.display_order || 0) ||
          String(a.name || '').localeCompare(String(b.name || ''))
        ));
      })
      .catch(() => {
        if (mounted) {
          setCurriculumNodes([]);
          setCurriculumError("We couldn't load your learning pathway. Please try again.");
        }
      })
      .finally(() => {
        if (mounted) setCurriculumLoading(false);
      });

    return () => { mounted = false; };
  }, [summary?.group_id]);

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  if (!access.canAccess) {
    return (
      <Container>
        <div className={pageWrap}>
          <EmptyState
            image={getEmptyStateImage('dashboard')}
            title="Access Restricted"
            description="Your account can't access this area."
          />
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className={pageWrap}>
          <div className="space-y-6" role="status" aria-label="Loading your dashboard">
            <div className="space-y-3">
              <div className={`${skeletonBlock} h-9 w-2/3 max-w-md`} />
              <div className={`${skeletonBlock} h-5 w-1/2 max-w-sm`} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`${skeletonBlock} h-32`} />
              <div className={`${skeletonBlock} h-32`} />
              <div className={`${skeletonBlock} h-32`} />
              <div className={`${skeletonBlock} h-32`} />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (locked) {
    return (
      <Container>
        <div className={pageWrap}>
          <EmptyState
            icon="lock"
            title="This action is temporarily unavailable"
            description={reason || 'For your security, this action is temporarily unavailable. Please try again later.'}
          />
        </div>
      </Container>
    );
  }

  if (error || !summary) {
    return (
      <Container>
        <div className={pageWrap}>
          <EmptyState
            image={getEmptyStateImage('error')}
            title="We couldn't load your dashboard"
            description={error || 'Your dashboard is temporarily unavailable. Please try again.'}
          />
        </div>
      </Container>
    );
  }

  const {
    platform,
    recall,
    quiz,
    notes,
    achievements,
    weak_areas,
    recent_activity,
    unit_xp,
    flashcards = {},
    analytics,
    level_user_counts: levelUserCounts = {}
  } = summary;

  const levelName = level?.display_name || 'No Level';
  const curriculumIsPharmacy = /pharmacy/i.test([
    level?.display_name,
    level?.name,
    summary?.level_name,
    summary?.program_name
  ].filter(Boolean).join(' '));
  const curriculumRootLabel = curriculumIsPharmacy ? 'Course Unit' : 'Topic';
  const curriculumChildLabel = curriculumIsPharmacy ? 'sub-course units' : 'subtopics';
  const curriculumRoots = curriculumNodes
    .filter((item) => !item.parent_id && Number(item.depth || 0) === 0)
    .sort((a, b) =>
      Number(a.display_order || 0) - Number(b.display_order || 0) ||
      String(a.name || '').localeCompare(String(b.name || ''))
    );
  const curriculumSlug = (value) => String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const userName = user?.full_name || '';
  const continueReading = notes.continue_reading || [];
  const recommendations = analytics?.recommendations || [];
  const weakAreas = weak_areas || [];
  const recentActivity = recent_activity || [];
  const unitXp = unit_xp || [];
  const planner = analytics?.planner || {};
  const heatmap = analytics?.heatmap || [];
  const personalRecords = analytics?.personal_records || {};
  const unitXpChart = unitXp.slice(0, 6).map((item) => ({
    label: item.unit_name,
    value: Math.max(0, Number(item.xp) || 0)
  }));
  const quizOutcomeChart = [
    { label: 'Passed', value: Math.max(0, Number(quiz.passed_count) || 0) },
    { label: 'Not passed', value: Math.max(0, Number(quiz.failed_count) || 0) }
  ];
  const recallComparisonChart = [
    Math.max(0, Math.min(100, Number(recall.accuracy) || 0)),
    Math.max(0, Math.min(100, Number(recall.best_mastery) || 0))
  ];
  const downloadOutcomeChart = [
    Math.max(0, Number(downloadAttempts.counts.links_issued) || 0),
    Math.max(0, Number(downloadAttempts.counts.premium_blocked) || 0),
    Math.max(0, (Number(downloadAttempts.counts.request_failed) || 0) + (Number(downloadAttempts.counts.network_error) || 0))
  ];
  const weakAreaChart = weakAreas.slice(0, 5).map((item) => ({
    label: item.concept || 'Concept',
    value: Math.max(0, Number(item.incorrect_attempts) || 0)
  }));
  const recentActivityMix = [
    { label: 'Quizzes', value: recentActivity.filter((item) => item.type === 'quiz').length },
    { label: 'Recall', value: recentActivity.filter((item) => item.type === 'recall').length },
    { label: 'Reading', value: recentActivity.filter((item) => item.type === 'reading').length },
    { label: 'Flashcards', value: recentActivity.filter((item) => item.type === 'flashcards').length }
  ];

  const masteryMap = analytics?.mastery_map || [];
  const assessedMastery = masteryMap.filter((item) => item.assessed);
  const overallMastery = assessedMastery.length
    ? Math.round(assessedMastery.reduce((sum, item) => sum + item.mastery, 0) / assessedMastery.length)
    : 0;

  function unitPath(item, fallback = '/resources') {
    if (item?.group_id && item?.slug) {
      return `/curriculum/${encodeURIComponent(item.group_id)}/${encodeURIComponent(item.slug)}`;
    }
    return fallback;
  }

  const todayTasks = [
    planner.due_reviews > 0
      ? {
          key: 'review',
          label: 'Review due recall questions',
          detail: `${planner.due_reviews} review${planner.due_reviews === 1 ? '' : 's'} ready`,
          to: '/recall',
          icon: 'brain'
        }
      : null,
    weakAreas[0]
      ? {
          key: 'weak',
          label: `Practice ${weakAreas[0].concept}`,
          detail: 'Focus on a topic to practise next',
          to: weakAreas[0].unit_id ? `/quiz?unit_id=${encodeURIComponent(weakAreas[0].unit_id)}` : '/quiz',
          icon: 'lightbulb'
        }
      : null,
    continueReading[0]
      ? {
          key: 'reading',
          label: `Continue ${continueReading[0].title}`,
          detail: `${Math.round(continueReading[0].progress_percentage)}% completed`,
          to: `/notes/read?id=${encodeURIComponent(continueReading[0].note_id)}`,
          icon: 'book-open'
        }
      : null
  ].filter(Boolean);

  const activityDays = activityRange === 'day' ? 1 : activityRange === 'month' ? 30 : 7;
  const activityMap = new Map((heatmap || []).map((item) => [item.activity_date, item]));
  const heatmapValues = Array.from({ length: activityDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (activityDays - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return activityMap.get(key) || { activity_date: key, count: 0 };
  });

  const activityCounts = heatmapValues.map((item) => Number(item.count) || 0);
  const activityMax = Math.max(...activityCounts, 1);
  const activityMin = Math.min(...activityCounts);
  const activityMaxRaw = Math.max(...activityCounts);
  const activityAverage = Math.round(activityCounts.reduce((sum, value) => sum + value, 0) / activityCounts.length);
  const activityAverageOffset = Math.round((Math.max(0, activityCounts.reduce((sum, value) => sum + value, 0) / activityCounts.length) / activityMax) * 62);
  const activityPeriodLabel = activityRange === 'day' ? 'Daily' : activityRange === 'month' ? 'Monthly' : 'Weekly';

  return (
    <Container>
      <div className={pageWrap}>
        <section className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-5 text-white shadow-xl sm:p-8" aria-labelledby="welcome-title">
          <div>
            <h1 id="welcome-title" className="text-3xl text-white sm:text-4xl lg:text-5xl">
              Welcome back{userName ? `, ${userName}` : ''}
            </h1>
            <p id="welcome-subtitle" className="mt-3 max-w-2xl text-blue-100">
              {platform.rank_title} · {levelName}
              <span className="mt-1 block text-blue-100">Ready to learn? Check your progress, practise with a quiz, or continue where you left off.</span>
            </p>
            {user?.profile?.role === 'teacher' && user?.profile?.is_approved_teacher && user?.profile?.level_approval_status === 'approved' && (
              <Link to="/quiz/review" className={`${sectionLink} mt-4`}>
                <Icon name="clipboard-check" /> Mark essay submissions
              </Link>
            )}
          </div>
        </section>

        {summary.group_id && (
          <section className={cardPrimary} id="dashboard-curriculum-section" aria-labelledby="dashboard-curriculum-title">
            <div className={panelHeader}>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">Your learning pathway</span>
                <h2 className={panelTitle} id="dashboard-curriculum-title">
                  {curriculumIsPharmacy ? 'Continue by course unit' : 'Continue by topic'}
                </h2>
              </div>
              <Link to={`/curriculum/${encodeURIComponent(summary.group_id)}`} className={sectionLink}>
                Browse all {curriculumIsPharmacy ? 'course units' : 'topics'}
              </Link>
            </div>
            <div className={panelBody}>
              <p className={sectionIntro}>
                Explore your selected class or programme from {curriculumRootLabel.toLowerCase()} through to sub-levels, themes and lessons. Open a lesson to see its available learning materials.
              </p>
              {curriculumLoading ? (
                <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600" role="status">Loading your learning pathway…</div>
              ) : curriculumError ? (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600" role="status">
                  <p>{curriculumError}</p>
                  <Link to="/resources" className={sectionLink}>Explore learning resources</Link>
                </div>
              ) : curriculumRoots.length > 0 ? (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {curriculumRoots.slice(0, 6).map((item) => {
                      const childCount = curriculumNodes.filter((child) => child.parent_id === item.id).length;
                      const detailPath = `/curriculum/${encodeURIComponent(summary.group_id)}/${curriculumSlug(item.slug || item.name)}`;
                      const resourceCounts = item.resource_counts || {};
                      const availableCounts = [
                        { label: 'Notes', value: Number(resourceCounts.notes || 0) },
                        { label: 'Flashcards', value: Number(resourceCounts.flashcards || 0) },
                        { label: 'BioRecall', value: Number(resourceCounts.recall_questions_bank || item.recall_question_count || 0) },
                        { label: 'Glossary', value: Number(resourceCounts.glossary_terms || 0) },
                        { label: 'Quizzes', value: Number(resourceCounts.quiz_questions || item.quiz_question_count || 0) },
                        { label: 'PDFs', value: Number(resourceCounts.pdf_resources || item.pdf_count || 0) },
                        { label: 'Past papers', value: Number(resourceCounts.past_papers || 0) }
                      ].filter((resource) => resource.value > 0);
                      return (
                        <Link key={item.id} to={detailPath} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-primary-900 no-underline shadow-sm transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-lg sm:p-5">
                          <span className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-800">{curriculumRootLabel}</span>
                            {item.is_premium && <span className="rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-bold text-secondary-800">Premium</span>}
                          </span>
                          <strong className="break-words text-lg font-bold text-primary-900">{item.name}</strong>
                          <span className="text-sm leading-6 text-slate-600">
                            {childCount} {childCount === 1 ? (curriculumIsPharmacy ? 'sub-course unit' : 'subtopic') : curriculumChildLabel}
                          </span>
                          {availableCounts.length > 0 && (
                            <span className="flex flex-wrap gap-2">
                              {availableCounts.map((count) => (
                                <span key={count.label} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-700">
                                  <strong className="font-bold text-primary-900">{count.value}</strong> {count.label}
                                </span>
                              ))}
                            </span>
                          )}
                          <span className="mt-auto inline-flex items-center gap-2 text-sm font-bold text-primary-700 [&_svg]:h-4 [&_svg]:w-4">Explore {curriculumRootLabel.toLowerCase()} <Icon name="arrow-right" /></span>
                        </Link>
                      );
                    })}
                  </div>
                  {curriculumRoots.length > 6 && (
                    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
                      <span>Showing 6 of {curriculumRoots.length} {curriculumIsPharmacy ? 'course units' : 'topics'}.</span>
                      <Link to={`/curriculum/${encodeURIComponent(summary.group_id)}`} className={sectionLink}>View all</Link>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-5 text-sm text-slate-600">
                  <p>No topics are available for your selected class or programme yet.</p>
                  <Link to="/resources" className={sectionLink}>Browse available resources</Link>
                </div>
              )}
              <p className="text-sm text-slate-600 [&_strong]:text-primary-900">
                <strong>Learning sequence:</strong> {curriculumIsPharmacy ? 'Course Unit' : 'Topic'} <span aria-hidden="true">→</span> {curriculumIsPharmacy ? 'Sub-course Unit' : 'Subtopic'} <span aria-hidden="true">→</span> Theme <span aria-hidden="true">→</span> Lesson
              </p>
            </div>
          </section>
        )}

        {todayTasks.length > 0 && (
          <section className={cardPrimary} id="today-plan-section" aria-labelledby="today-plan-title">
            <div className={panelHeader}>
              <h3 className={panelTitle} id="today-plan-title">
                Today's Learning Plan
              </h3>
            </div>
            <div className={panelBody}>
              <p className={sectionIntro}>Here’s a simple place to start. Work through these suggested tasks at your own pace.</p>
              <DashboardSectionAside>Choose one task to begin with. When you finish, move to the next one rather than trying to do everything at once.</DashboardSectionAside>
              <div className={listGrid}>
                {todayTasks.map((task, index) => (
                  <Link key={task.key} to={task.to} className={listItemLink}>
                    <span className={itemText}>
                      <strong className="font-semibold">{index + 1}. {task.label}</strong>
                      <small>{task.detail}</small>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <main className="min-w-0 space-y-6">
            <div className={cardPrimary} id="platform-stats-section">
              <div className={panelHeader}>
                <h3 className={panelTitle}>
                  Platform Stats
                </h3>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>A quick snapshot of your learning so far, including progress and practice activity.</p>
                <DashboardSectionAside>Pick one measure you want to improve this week, then use quizzes or revision to work towards it.</DashboardSectionAside>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" id="top-stats">
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary-100 bg-white p-4 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 [&_svg]:h-6 [&_svg]:w-6"><Icon name="rocket" /></span>
                    <span className="text-2xl font-extrabold text-primary-900">
                      {platform.total_xp?.toLocaleString?.() ?? platform.total_xp}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">{t('common.totalXp')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary-100 bg-white p-4 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 [&_svg]:h-6 [&_svg]:w-6"><Icon name="fire" /></span>
                    <span className="text-2xl font-extrabold text-primary-900">{platform.current_streak}</span>
                    <span className="text-xs font-semibold text-slate-600">{t('common.dayStreak')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary-100 bg-white p-4 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 [&_svg]:h-6 [&_svg]:w-6"><Icon name="trophy" /></span>
                    <span className="text-2xl font-extrabold text-primary-900">{achievements.earned_count}</span>
                    <span className="text-xs font-semibold text-slate-600">{t('common.badges')}</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 rounded-2xl border border-primary-100 bg-white p-4 text-center">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700 [&_svg]:h-6 [&_svg]:w-6"><Icon name="microscope" /></span>
                    <span className="text-2xl font-extrabold text-primary-900">{quiz.blocks_completed ?? 0}</span>
                    <span className="text-xs font-semibold text-slate-600">Quiz Blocks Done</span>
                  </div>
                  <div className="col-span-2 space-y-2 lg:col-span-4">
                    <div className="flex justify-between text-xs font-bold text-slate-600">
                      <span id="xp-current">{platform.xp_progress.xpIntoLevel} XP</span>
                      <span id="xp-next">{platform.xp_progress.nextLevelXp} XP</span>
                    </div>
                    <ProgressBar
                      value={platform.xp_progress.xpIntoLevel}
                      max={platform.xp_progress.nextLevelXp}
                      variant="gradient"
                    />
                    <p className="text-sm text-slate-600" id="xp-progress-text">
                      {platform.xp_progress.xpIntoLevel}/{platform.xp_progress.nextLevelXp} XP to next level
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className={cardPrimary} id="quiz-performance-section" aria-labelledby="quiz-performance-title">
              <div className={panelHeader}>
                <h3 className={panelTitle} id="quiz-performance-title">Quiz performance</h3>
                <Link to="/quiz" className={sectionLink}>Practice quizzes</Link>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>See how you’re doing in scored quizzes and use your results to guide your next revision.</p>
                <DashboardSectionAside>Open a quiz and try a short practice round. Review any questions you miss before attempting them again.</DashboardSectionAside>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className={metricBox}>
                    <span className={metricValue}>{quiz.total_attempts ?? 0}</span>
                    <span className={metricLabel}>Attempts recorded</span>
                  </div>
                  <div className={metricBoxPass}>
                    <span className={metricValue}>{quiz.passed_count ?? 0}</span>
                    <span className={metricLabel}>Passed</span>
                  </div>
                  <div className={metricBoxFail}>
                    <span className={metricValue}>{quiz.failed_count ?? 0}</span>
                    <span className={metricLabel}>Not passed</span>
                  </div>
                  <div className={metricBox}>
                    <span className={metricValue}>{quiz.average_score ?? 0}%</span>
                    <span className={metricLabel}>Average score</span>
                  </div>
                </div>
                {Number(quiz.total_attempts) > 0 && quizOutcomeChart.some((item) => item.value > 0) && (
                  <div className={insightChart}>
                    <ChartBlock><DonutChart data={quizOutcomeChart.map((item) => item.value)} labels={quizOutcomeChart.map((item) => item.label)} title="Quiz outcomes" subtitle="Passed versus not-passed recorded attempts." height={220} /></ChartBlock>
                    <p className={graphGuide}>Each slice shows the share of quiz attempts that passed or did not pass. Compare the slices to see your recent quiz results.</p>
                  </div>
                )}
                <div className="space-y-3" aria-label="Quiz pass and not-passed comparison">
                  <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                    <span>Pass rate</span>
                    <strong className="text-primary-900">{quiz.recent_pass_rate ?? 0}%</strong>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-200" role="img" aria-label={`${quiz.recent_pass_rate ?? 0}% recent pass rate`}>
                    <span className="block h-full rounded-full bg-gradient-to-r from-primary-600 to-secondary-500" style={{ width: `${Math.max(0, Math.min(100, Number(quiz.recent_pass_rate) || 0))}%` }} />
                  </div>
                  {Array.isArray(quiz.score_trend) && quiz.score_trend.length > 0 ? (
                    <div className="space-y-3 rounded-xl bg-white p-3 sm:p-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm text-slate-600">
                        <strong className="text-primary-900">Recent score trend</strong>
                        <span>Last {quiz.score_trend.length} recorded attempts</span>
                      </div>
                      <div className="scrollbar-hidden flex items-end gap-2 overflow-x-auto pb-1" role="img" aria-label="Recent quiz scores from oldest to newest">
                        {quiz.score_trend.map((attempt, index) => {
                          const score = Math.max(0, Math.min(100, Number(attempt.score) || 0));
                          return (
                            <div className="flex min-w-10 flex-1 flex-col items-center gap-1" key={`${attempt.completed_at || 'attempt'}-${index}`} title={`${attempt.topic || 'Quiz'}: ${score}%`}>
                              <span className="text-xs font-bold text-primary-900">{score}%</span>
                              <div className="flex h-24 w-full items-end overflow-hidden rounded-lg bg-slate-100">
                                <span className={`block w-full rounded-lg ${attempt.passed ? 'bg-emerald-600' : 'bg-red-500'}`} style={{ height: `${Math.max(4, score)}%` }} />
                              </div>
                              <small className="text-[0.7rem] text-slate-500">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `#${index + 1}`}</small>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className={noteText}>Complete a scored quiz to start your score trend graph.</p>
                  )}
                  <p className={noteText}>Based on your recorded quiz attempts. Use the unit mastery and weak-area sections to decide what to revise next.</p>
                </div>
              </div>
            </section>

            <section className={cardSecondary} id="recall-progress-section" aria-labelledby="recall-progress-title">
              <div className={panelHeader}>
                <h3 className={panelTitle} id="recall-progress-title">Recall progress</h3>
                <Link to="/recall" className={sectionLink}>Open BioRecall</Link>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>Track the memory practice you’ve completed with BioRecall and keep building what you remember.</p>
                <DashboardSectionAside>Spend a few minutes recalling answers without looking at your notes, then revisit the concepts that feel difficult.</DashboardSectionAside>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  <div className={statCell}><strong>{recall.total_sessions ?? 0}</strong><span>Sessions</span></div>
                  <div className={statCell}><strong>{recall.total_questions ?? 0}</strong><span>Questions practiced</span></div>
                  <div className={statCell}><strong>{recall.accuracy ?? 0}%</strong><span>Recall accuracy</span></div>
                  <div className={statCell}><strong>{recall.best_mastery ?? 0}%</strong><span>Best mastery</span></div>
                  <div className={`${statCell} col-span-2 sm:col-span-1`}><strong>{Number(recall.total_xp ?? 0).toLocaleString()}</strong><span>Recall XP earned</span></div>
                </div>
                {Number(recall.total_sessions) > 0 && (
                  <div className={insightChart}>
                    <ChartBlock><BarChart data={recallComparisonChart} labels={['Recall accuracy', 'Best mastery']} label="Score" title="Recall performance" subtitle="Your recall accuracy and best recorded mastery, shown as percentages." height={220} /></ChartBlock>
                    <p className={graphGuide}>Compare your recall accuracy with your highest recorded mastery. The percentages show how closely they match.</p>
                  </div>
                )}
                <p className={noteText}>Recall is tracked separately from scored quiz attempts so your memory practice and assessment results stay distinct.</p>
              </div>
            </section>

            {heatmapValues.length > 0 && (
              <section className={cardPrimary} id="learning-activity-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Learning Activity
                  </h3>
                  <div className="inline-flex rounded-xl bg-slate-100 p-1" role="group" aria-label="Learning activity period">
                    {['day', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={activityRange === range
                          ? 'min-h-9 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-primary-900 shadow-sm transition'
                          : 'min-h-9 rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:text-primary-800'}
                        aria-pressed={activityRange === range}
                        onClick={() => setActivityRange(range)}
                      >
                        {range[0].toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>See how regularly you’ve been studying and spot the habits that help you make progress.</p>
                  <DashboardSectionAside>Aim for a steady study routine. A short, focused session today is a useful start.</DashboardSectionAside>
                  <p className={graphGuide}>The area chart compares recorded quiz and recall activity across the selected period. Peaks indicate days with more activity; flat periods may indicate time away from practice.</p>
                  <ChartBlock><DualAreaTrend
                    embedded
                    activities={recentActivity}
                    days={activityDays}
                  /></ChartBlock>
                  <p className={graphGuide}>This activity view summarizes the number of learning events recorded on each date. Use it to identify consistent study periods and days when you may want to resume practice.</p>
                  <ChartBlock><TotalLearningActivity
                    embedded
                    data={heatmapValues.map((item) => ({
                      label: new Date(item.activity_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                      value: Math.max(0, Number(item.count) || 0)
                    }))}
                  /></ChartBlock>
                </div>
              </section>
            )}

            {masteryMap.length > 0 && (
              <section className={cardPrimary} id="mastery-map-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Your Mastery
                  </h3>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-primary-800">{overallMastery}% assessed mastery</span>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Explore the topics you’ve practised and see which areas may need another review.</p>
                  <DashboardSectionAside>Choose one topic with a lower mastery level and revise it before testing yourself again.</DashboardSectionAside>
                  {assessedMastery.length > 0 ? (
                    <>
                      <p className={graphGuide}>Each segment represents a curriculum unit with an assessed mastery score. Compare the segments to review your results across units and identify topics that need further study.</p>
                      <ChartBlock><MasteryDonut
                        embedded
                        data={assessedMastery.map((item) => ({
                          label: item.unit_name,
                          value: Math.max(0, Number(item.mastery) || 0)
                        }))}
                      /></ChartBlock>
                    </>
                  ) : (
                    <p className={graphGuide}>No unit mastery scores are available yet. Complete a scored assessment to see your results here and identify topics for further study.</p>
                  )}
                  <div className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
                    <ProgressRing value={overallMastery} size="lg" tone="mastery" ariaLabel={`${overallMastery}% assessed mastery`} />
                    <div>
                      <strong className="text-primary-900">{overallMastery}% Overall Mastery</strong>
                      <p className="text-sm text-slate-600">Based on your assessed curriculum units.</p>
                    </div>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {masteryMap.slice(0, 8).map((unit) => (
                      <Link
                        key={unit.unit_id}
                        to={unit.group_id && unit.slug ? `/curriculum/${encodeURIComponent(unit.group_id)}/${encodeURIComponent(unit.slug)}` : `/quiz?unit_id=${encodeURIComponent(unit.unit_id)}`}
                        className={listItemLink}
                      >
                        <span className={itemText}>
                          <strong className="font-semibold">{unit.unit_name}</strong>
                          <small>{unit.assessed ? unit.status : 'Not assessed'}</small>
                        </span>
                        <span className="font-bold text-primary-800">{unit.assessed ? `${unit.mastery}%` : '—'}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className={cardPrimary} id="pdf-downloads-section" aria-labelledby="pdf-downloads-title">
              <div className={panelHeader}>
                <h3 className={panelTitle} id="pdf-downloads-title">PDF downloads</h3>
                <Link to="/past-papers" className={sectionLink}>Browse past papers</Link>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>Keep track of your past-paper downloads and find help if a file doesn’t open.</p>
                <DashboardSectionAside>Choose a paper for your level and practise under timed conditions when you feel ready.</DashboardSectionAside>
                <div className="flex items-baseline gap-2 rounded-xl border border-slate-200 bg-white p-4">
                  <strong className="text-3xl font-extrabold text-primary-900">{downloadHistory.total}</strong>
                  <span className="text-sm text-slate-600">Recorded download-link events</span>
                </div>
                {downloadOutcomeChart.some((value) => value > 0) && (
                  <div className={insightChart}>
                    <ChartBlock><DonutChart data={downloadOutcomeChart} labels={['Links issued', 'Premium blocked', 'Request/network failures']} title="Download request outcomes" subtitle="Breakdown of recorded PDF download attempts." height={220} /></ChartBlock>
                    <p className={graphGuide}>The slices show the outcomes of download requests, including successful links, premium restrictions, and failed requests. Use them to understand what happened when you tried to download content.</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-3">
                  <div className={statCell}><strong>{downloadAttempts.counts.links_issued ?? 0}</strong><span>Links issued</span></div>
                  <div className={statCell}><strong>{downloadAttempts.counts.premium_blocked ?? 0}</strong><span>Premium blocked</span></div>
                  <div className={statCell}><strong>{(Number(downloadAttempts.counts.request_failed) || 0) + (Number(downloadAttempts.counts.network_error) || 0)}</strong><span>Request/network failures</span></div>
                </div>
                {downloadHistory.papers.length > 0 ? (
                  <div className={listGrid}>
                    {downloadHistory.papers.slice(0, 5).map((paper, index) => (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white p-3" key={paper.id || `${paper.title}-${paper.downloaded_at}-${index}`}>
                        <span className={itemText}>
                          <strong className="font-semibold text-primary-900">{paper.title || 'Past paper PDF'}</strong>
                          <small>{paper.subject || 'Study resource'}{paper.year ? ` · ${paper.year}` : ''}</small>
                        </span>
                        <span className="shrink-0 text-xs text-slate-500">
                          {paper.downloaded_at ? new Date(paper.downloaded_at).toLocaleDateString() : 'Recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={noteText}>No completed downloads yet. Browse past papers to find a paper to practise with.</p>
                )}
                {downloadAttempts.recent.length > 0 && (
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-primary-900">Recent download attempts</h4>
                    {downloadAttempts.recent.slice(0, 5).map((attempt) => {
                      const statusLabel = attempt.status === 'link_issued'
                        ? 'Ready to download'
                        : attempt.status === 'premium_blocked'
                          ? 'Premium access needed'
                          : attempt.status === 'network_error'
                            ? 'Connection issue'
                            : 'Please try again';
                      const statusStyle = downloadStatusStyles[attempt.status] || downloadStatusStyles.request_failed;
                      return (
                        <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 py-3" key={attempt.id}>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusStyle}`}>{statusLabel}</span>
                          <span className={`${itemText} flex-1`}>
                            <strong className="font-semibold text-primary-900">{attempt.paper_title || 'Past paper PDF'}</strong>
                            {attempt.reason && <small>{attempt.reason}</small>}
                          </span>
                          <time className="text-xs text-slate-500" dateTime={attempt.created_at}>{new Date(attempt.created_at).toLocaleDateString()}</time>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="rounded-xl border border-primary-100 bg-white p-4 text-sm text-slate-700">
                  <strong className="text-primary-900">Having trouble downloading?</strong>
                  <ul className="mt-2 list-disc space-y-1 pl-5">
                    <li>Check your internet connection and try again.</li>
                    <li>If a paper needs premium access, choose an available paper or review its access options.</li>
                    <li>If the PDF doesn't appear, open Past Papers and start the download again.</li>
                  </ul>
                </div>
              </div>
            </section>

            {Array.isArray(notes.reading_analytics?.recent_progress) && notes.reading_analytics.recent_progress.length > 0 && (
              <section className={cardPrimary} id="notes-reading-analytics">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>Notes Reading Progress</h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Track how far you've progressed through notes in your active curriculum.</p>
                  <div className="grid grid-cols-3 gap-3" aria-label="Notes reading summary">
                    <div className={statCell}><strong>{Number(notes.reading_analytics.notes_started) || 0}</strong><span>Notes started</span></div>
                    <div className={statCell}><strong>{Number(notes.reading_analytics.notes_completed) || 0}</strong><span>Notes completed</span></div>
                    <div className={statCell}><strong>{Number(notes.reading_analytics.average_progress) || 0}%</strong><span>Average progress</span></div>
                  </div>
                  <div className={insightChart}>
                    <ChartBlock><BarChart data={notes.reading_analytics.recent_progress.map((item) => Math.max(0, Math.min(100, Number(item.progress_percentage) || 0)))} labels={notes.reading_analytics.recent_progress.map((item) => item.title || 'Study note')} label="Reading progress (%)" title="Progress by note" subtitle="Latest saved reading progress for notes you've opened." horizontal height={Math.max(220, notes.reading_analytics.recent_progress.length * 42)} /></ChartBlock>
                    <p className={graphGuide}>Each bar shows your saved reading progress for a note. Start with notes showing less progress if you want to continue unfinished reading.</p>
                  </div>
                </div>
              </section>
            )}

            {continueReading.length > 0 && (
              <div className={cardPrimary} id="continue-reading-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Continue Reading
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Continue where you left off without having to search for your study materials.</p>
                  <DashboardSectionAside>Open the item you were reading and continue from your last saved progress.</DashboardSectionAside>
                  <div className="grid gap-3" id="continue-reading-list">
                    {continueReading.map((item) => {
                      const progress = Math.round(item.progress_percentage);
                      return (
                        <Link
                          key={item.note_id}
                          to={`/notes/read?id=${item.note_id}`}
                          className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 no-underline transition hover:border-primary-300 hover:shadow-md"
                        >
                          <div className="min-w-0">
                            <h4 className="break-words text-base font-bold text-primary-900">{item.title}</h4>
                            <p className="text-sm text-slate-600">{progress}% completed</p>
                          </div>
                          <ProgressRing
                            value={progress}
                            tone={item.topic_id || item.unit_id || item.note_id}
                            variant="segmented"
                            ariaLabel={`${progress}% completed`}
                          />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {recommendations.length > 0 && (
              <div className={cardPrimary} id="recommendations-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Recommended For You
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>These suggestions can help you decide what to study next.</p>
                  <DashboardSectionAside>Choose the recommendation that matches what you want to improve, and start with that one.</DashboardSectionAside>
                  <div className="grid gap-3 sm:grid-cols-2" id="recommendations-list">
                    {recommendations.slice(0, 4).map((item, index) => {
                      const link = item.type === 'due_review'
                        ? (item.unit_id ? `/recall?unit_id=${encodeURIComponent(item.unit_id)}` : '/recall')
                        : item.type === 'weak_topic'
                          ? (item.unit_id ? `/quiz?unit_id=${encodeURIComponent(item.unit_id)}` : '/quiz')
                          : (item.unit_id ? `/quiz?unit_id=${encodeURIComponent(item.unit_id)}` : '/flashcards');
                      const typeLabel = item.type === 'due_review'
                        ? 'Due Review'
                        : item.type === 'weak_topic'
                          ? 'Weak Topic'
                          : 'Flashcards';

                      return (
                        <Link key={index} to={link} className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-4 no-underline transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
                          <span className="w-fit rounded-full bg-secondary-50 px-2.5 py-1 text-xs font-bold text-secondary-800">{typeLabel}</span>
                          <h4 className="text-base font-bold text-primary-900">{item.title}</h4>
                          <p className="text-sm text-slate-600">{item.reason}</p>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {quiz.recent_pass_rate > 0 && (
              <Link
                to="/quiz"
                className={`${cardPrimary} block no-underline`}
                id="continue-practicing"
              >
                <div className={`${panelBody} flex items-center justify-between gap-4`}>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary-700">{t('common.continuePracticing')}</span>
                    <span className="text-lg font-bold text-primary-900" id="quiz-pass-rate-text">
                      Recent quiz pass rate: {quiz.recent_pass_rate}%
                    </span>
                  </div>
                  <Icon name="arrow-right" className="h-6 w-6 shrink-0 text-primary-700" />
                </div>
              </Link>
            )}
          </main>

          <aside className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card" aria-labelledby="weekly-activity-title">
              <div className="space-y-3">
                <h3 id="weekly-activity-title" className="text-xl font-bold text-primary-900 sm:text-2xl">{activityPeriodLabel} Activity</h3>
                <p className="text-sm text-slate-600">Your recent study activity, grouped by the time period you choose.</p>
                <DashboardSectionAside>Use the daily, weekly, or monthly view to notice your study rhythm and plan your next session.</DashboardSectionAside>
                <button
                  type="button"
                  className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary-200 bg-white px-3 py-2 text-sm font-bold text-primary-800 transition hover:border-primary-400 hover:bg-primary-50"
                  onClick={() => document.getElementById('learning-activity-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                >
                  Full {activityRange} stats
                  <svg
                    className="h-4 w-4 shrink-0"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>

              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-primary-900">
                  {activityMin}–{activityMaxRaw}
                </span>
                <span className="text-sm text-slate-600">sessions</span>
              </div>

              <div className="mt-1 text-sm text-slate-500">
                {new Date(heatmapValues[0]?.activity_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                {' – '}
                {new Date(heatmapValues[heatmapValues.length - 1]?.activity_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
              </div>

              <div className="relative mt-5" aria-label="Weekly learning activity">
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-slate-300"
                  style={{ bottom: `calc(1.5rem + ${activityAverageOffset}px)` }}
                />
                <div className="absolute -top-5 right-0 text-xs font-bold text-slate-500">
                  Avg. {activityAverage}
                </div>
                <div className="flex items-end gap-1.5">
                  {heatmapValues.map((item) => {
                    const value = Math.max(0, Number(item.count) || 0);
                    const height = Math.max(12, Math.round((value / activityMax) * 62));
                    const dayLabel = new Date(item.activity_date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);
                    const isHighest = value > 0 && value === activityMax;
                    const isLowest = value < activityMax && value === activityMin;

                    return (
                      <div className="flex min-w-0 flex-1 flex-col items-center gap-1" key={item.activity_date}>
                        <div className="flex h-[62px] w-full items-end justify-center">
                          <div
                            className={`relative w-full max-w-4 min-w-1 rounded-full ${isHighest ? 'bg-primary-700' : 'bg-primary-300'}`}
                            style={{ height: `${height}px` }}
                            title={`${value} learning sessions on ${new Date(item.activity_date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`}
                            role="img"
                            aria-label={`${dayLabel}: ${value} learning sessions`}
                          >
                            {isHighest && <span className="absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-secondary-500 bg-white" aria-hidden="true" />}
                            {isLowest && <span className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border-2 border-secondary-500 bg-white" aria-hidden="true" />}
                          </div>
                        </div>
                        <span className="h-5 text-xs text-slate-500">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex flex-col rounded-xl bg-primary-50 p-3 text-sm text-slate-600 [&_strong]:text-primary-900">
                  <span>{new Date().toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <strong>{heatmapValues[heatmapValues.length - 1]?.count || 0} sessions</strong>
                </div>
                <div className="flex flex-col rounded-xl bg-primary-50 p-3 text-sm text-slate-600 [&_strong]:text-primary-900">
                  <span>{activityRange === 'day' ? 'Daily average' : activityRange === 'month' ? 'Monthly average' : 'Weekly average'}</span>
                  <strong>{activityAverage} sessions</strong>
                </div>
              </div>
            </section>

            {recall?.best_mastery > 0 && (
              <div className={cardSecondary} id="personal-records-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Personal Records
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Here are some of the learning milestones you've reached so far.</p>
                  <DashboardSectionAside>Use your best result as encouragement, then set a small goal for your next session.</DashboardSectionAside>
                  <div className={listGrid} id="personal-records-stats">
                    <div className={listItem}>
                      <span className="min-w-0 text-slate-700">{t('common.bestRecallMastery')}</span>
                      <span className="font-bold text-primary-800">{recall.best_mastery}%</span>
                    </div>
                    <div className={listItem}>
                      <span className="min-w-0 text-slate-700">{t('common.recallTopics')}</span>
                      <span className="font-bold text-primary-800">{recall.topics_practiced}</span>
                    </div>
                    <div className={listItem}>
                      <span className="min-w-0 text-slate-700">{t('common.quizBlocksDone')}</span>
                      <span className="font-bold text-primary-800">{quiz.blocks_completed}</span>
                    </div>
                    <div className={listItem}>
                      <span className="min-w-0 text-slate-700">{t('common.readingStreak')}</span>
                      <span className="font-bold text-secondary-700">🔥 {notes.reading_streak}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(personalRecords).length > 0 && (
              <div className={cardSecondary} id="learning-records-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Learning Records
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>See the learning milestones you've reached and how your progress has changed.</p>
                  <DashboardSectionAside>Look for a skill you have improved and decide what you would like to strengthen next.</DashboardSectionAside>
                  <div className={listGrid}>
                    {[
                      ['highest_score', 'Highest Score'],
                      ['fastest_completion', 'Fastest Completion'],
                      ['perfect_blocks', 'Perfect Blocks']
                    ]
                      .filter(([key]) => personalRecords[key] !== null && personalRecords[key] !== undefined && personalRecords[key] !== 0)
                      .map(([key, label]) => (
                        <div className={listItem} key={key}>
                          <span className="min-w-0 text-slate-700">{label}</span>
                          <span className="font-bold text-primary-800">{personalRecords[key]}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <section className={cardSecondary} id="learning-community-section" aria-labelledby="learning-community-title">
              <div className={panelHeader}>
                <h3 className={panelTitle} id="learning-community-title">Learning community</h3>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>See how many learners are studying in each programme.</p>
                <DashboardSectionAside>Learn at your own pace with resources matched to your programme.</DashboardSectionAside>
                {levelUserCounts.available ? (
                  <>
                    <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-4">
                      <strong className="text-3xl font-extrabold text-primary-900">{Number(levelUserCounts.total || 0).toLocaleString()}</strong>
                      <span className="text-sm text-slate-600">learners across the programmes</span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 [&_strong]:text-lg [&_strong]:font-extrabold [&_strong]:text-primary-900"><span>O-Level</span><strong>{levelUserCounts.o_level ?? 0}</strong></div>
                      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 [&_strong]:text-lg [&_strong]:font-extrabold [&_strong]:text-primary-900"><span>A-Level</span><strong>{levelUserCounts.a_level ?? 0}</strong></div>
                      <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-white p-3 text-xs text-slate-600 [&_strong]:text-lg [&_strong]:font-extrabold [&_strong]:text-primary-900"><span>Pharmacy</span><strong>{levelUserCounts.pharmacy ?? 0}</strong></div>
                    </div>
                  </>
                ) : (
                  <p className={noteText}>Learner totals aren’t available right now.</p>
                )}
              </div>
            </section>

            <section className={cardSecondary} id="live-classrooms-section" aria-labelledby="live-classrooms-title">
              <div className={panelHeader}>
                <h3 className={panelTitle} id="live-classrooms-title">Your classrooms</h3>
                <Link to="/classroom" className={sectionLink}>View classrooms</Link>
              </div>
              <div className={panelBody}>
                <p className={sectionIntro}>See what's happening in the classrooms linked to your learning group.</p>
                <DashboardSectionAside>Open your classroom to check current discussions, shared work, or upcoming learning activities.</DashboardSectionAside>
                {classroomRooms.length > 0 ? (
                  <div className={listGrid}>
                    {classroomRooms.map((room) => (
                      <Link to={`/classroom/${room.id}`} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 no-underline transition hover:border-primary-200 hover:bg-primary-50" key={room.id}>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${classroomStatusStyles[room.status] || classroomStatusStyles.upcoming}`}>
                          {room.status === 'open_floor' ? 'Open floor' : room.status === 'upcoming' ? 'Upcoming' : 'Live'}
                        </span>
                        <span className={itemText}>
                          <strong className="font-semibold text-primary-900">{room.title || room.topic_name || 'Classroom session'}</strong>
                          <small>{room.class_name || levelName}{room.participant_count != null ? ` · ${room.participant_count} participants` : ''}</small>
                          {room.scheduled_at && room.status === 'upcoming' && (
                            <small>Starts {new Date(room.scheduled_at).toLocaleString()}</small>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-600">
                    <p>There are no live or upcoming classrooms for your class or programme right now.</p>
                    <Link to="/classroom" className={sectionLink}>View classroom schedule</Link>
                  </div>
                )}
              </div>
            </section>

            {weakAreas.length > 0 && (
              <div className={cardSecondary} id="weak-areas-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Weak Areas
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Use these topics to decide what to revise next. Finding a difficult area is a useful first step.</p>
                  <DashboardSectionAside>Start with one topic, review the lesson, and try a few practice questions to check your understanding.</DashboardSectionAside>
                  {weakAreaChart.some((item) => item.value > 0) && (
                    <div className={insightChart}>
                      <ChartBlock><BarChart data={weakAreaChart.map((item) => item.value)} labels={weakAreaChart.map((item) => item.label)} label="Incorrect attempts" title="Concepts to revisit" subtitle="Most frequently missed concepts among your unresolved weak areas." horizontal height={Math.max(220, weakAreaChart.length * 48)} /></ChartBlock>
                      <p className={graphGuide}>Concepts with more incorrect attempts need extra practice. Start with the longest bars, then review those concepts and try again.</p>
                    </div>
                  )}
                  <div className={listGrid} id="weak-areas-list">
                    {weakAreas.map((weak, index) => (
                      <Link
                        key={index}
                        to={weak.unit_id ? `/quiz?unit_id=${encodeURIComponent(weak.unit_id)}` : '/quiz'}
                        className={listItemLink}
                      >
                        <span className="min-w-0 text-slate-700">{weak.concept}</span>
                        <span className="shrink-0 font-bold text-red-700">
                          {weak.incorrect_attempts} incorrect
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {recentActivity.length > 0 && (
              <div className={cardSecondary} id="recent-activity-section">
                <div className={panelHeader}>
                  <h3 className={panelTitle}>
                    Recent Activity
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>Review your recent learning and choose what you'd like to do next.</p>
                  <DashboardSectionAside>Use this recap to return to a recent activity or pick one small task to do next.</DashboardSectionAside>
                  {Array.isArray(flashcards.recent_sessions) && flashcards.recent_sessions.length > 0 && (
                    <div className={insightChart}>
                      <ChartBlock><BarChart data={flashcards.recent_sessions.map((item) => Math.max(0, Number(item.cards_seen) || 0))} labels={flashcards.recent_sessions.map((item) => item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Session')} label="Cards seen" title="Flashcard practice" subtitle="Cards seen in each of your latest completed flashcard sessions." height={Math.max(220, flashcards.recent_sessions.length * 28)} /></ChartBlock>
                      <p className={graphGuide}>Each bar shows the number of cards seen in a completed flashcard session. Compare sessions to track practice volume; use your accuracy and missed cards to decide what to review next.</p>
                      <div className="grid grid-cols-3 gap-2" role="group" aria-label="Flashcard practice summary">
                        <div className={`${statCell} [&_span]:order-1 [&_strong]:order-2`}><span>Completed sessions</span><strong>{Number(flashcards.session_count) || 0}</strong></div>
                        <div className={`${statCell} [&_span]:order-1 [&_strong]:order-2`}><span>Cards seen</span><strong>{Number(flashcards.cards_seen) || 0}</strong></div>
                        <div className={`${statCell} [&_span]:order-1 [&_strong]:order-2`}><span>Accuracy</span><strong>{Number(flashcards.accuracy) || 0}%</strong></div>
                      </div>
                    </div>
                  )}
                  {recentActivityMix.some((item) => item.value > 0) && (
                    <div className={insightChart}>
                      <ChartBlock><DonutChart data={recentActivityMix.map((item) => item.value)} labels={recentActivityMix.map((item) => item.label)} title="Learning Activity Distribution" subtitle="A view of your recent reading, quiz, recall, and flashcard activity." height={220} /></ChartBlock>
                      <p className={graphGuide}>Each segment represents a type of learning activity recorded recently. Compare the segments to see how your recent study time is distributed across reading, quizzes, recall practice, and flashcards.</p>
                    </div>
                  )}
                  <div className={listGrid} id="recent-activity-list">
                    {recentActivity.map((activity, index) => {
                      const progress = Math.max(0, Math.min(100, Math.round(Number(activity.progress_percentage) || 0)));
                      const contentLabel = activity.type === 'recall' ? 'Recall' : activity.type === 'quiz' ? 'Quiz' : activity.type === 'flashcards' ? 'Flashcards' : 'Reading';
                      const iconName = activity.type === 'recall' ? 'brain' : activity.type === 'quiz' ? 'graduation-cap' : activity.type === 'flashcards' ? 'layers' : 'book-open';
                      const iconStyle = activityIconStyles[activity.type] || activityIconStyles.reading;

                      const activityLink = activity.type === 'reading' && activity.note_id
                        ? `/notes/read?id=${encodeURIComponent(activity.note_id)}`
                        : activity.type === 'quiz' && activity.unit_id
                          ? `/quiz?unit_id=${encodeURIComponent(activity.unit_id)}`
                          : activity.type === 'recall' && activity.unit_id
                            ? `/recall?unit_id=${encodeURIComponent(activity.unit_id)}`
                            : activity.type === 'flashcards'
                              ? '/flashcards'
                              : null;

                      const activityContent = (
                        <>
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl [&_svg]:h-5 [&_svg]:w-5 ${iconStyle}`}>
                            <Icon name={iconName} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex min-w-0 flex-col">
                                <span className="text-xs font-bold uppercase tracking-wide text-primary-700">{contentLabel}</span>
                                <span className="break-words text-sm font-semibold text-slate-800">{activity.details}</span>
                                <span className="text-xs text-slate-500">
                                  {new Date(activity.date).toLocaleDateString(undefined, {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              </div>
                              <ProgressRing
                                value={progress}
                                size="md"
                                variant="chunky"
                                tone={activity.topic_id || activity.unit_id || activity.details}
                                ariaLabel={`${contentLabel} progress: ${progress}%`}
                              />
                            </div>
                          </div>
                        </>
                      );

                      return activityLink ? (
                        <Link key={index} to={activityLink} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 no-underline transition hover:border-primary-200 hover:bg-primary-50">
                          {activityContent}
                        </Link>
                      ) : (
                        <div key={index} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3">
                          {activityContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {unitXp.length > 0 && (
              <div className={cardSecondary} id="unit-xp-section">
                <div className={panelHeader}>
                  <h3 className={`${panelTitle} flex items-center gap-2 [&_svg]:h-6 [&_svg]:w-6`}>
                    <Icon name="chart-line" /> Unit XP
                  </h3>
                </div>
                <div className={panelBody}>
                  <p className={sectionIntro}>See where you’ve earned learning points and which course units you’ve been practising.</p>
                  <DashboardSectionAside>Choose a course unit you want to strengthen and practise it regularly; points are a record of activity, not a measure of your worth.</DashboardSectionAside>
                  <div className="grid gap-5">
                    <div className={listGrid} id="unit-xp-list">
                      {unitXp.map((unit, index) => (
                        <Link
                          key={index}
                          to={unitPath(unit, unit.unit_id ? `/quiz?unit_id=${encodeURIComponent(unit.unit_id)}` : '/quiz')}
                          className={listItemLink}
                        >
                          <span className="min-w-0 break-words font-semibold text-slate-700">{unit.unit_name || 'Unit'}</span>
                          <span className="shrink-0 whitespace-nowrap font-bold text-primary-800">{unit.xp.toLocaleString()} XP</span>
                        </Link>
                      ))}
                    </div>
                    <div className="space-y-3" aria-label="XP earned by learning unit">
                      <ChartBlock><XpBars embedded data={unitXpChart} /></ChartBlock>
                      <p className={graphGuide}>The bars compare experience points earned in each learning unit. Higher values indicate more recorded activity, while assessment results provide a better measure of subject understanding.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
}
