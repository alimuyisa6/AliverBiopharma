import { useState, useEffect } from 'react';
import { TotalLearningActivity, MasteryDonut, XpBars } from '../components/charts/AnalyticsCharts';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getUserDashboard } from '../api/cachedClient';
import { listClassrooms as fetchClassrooms } from '../api/client';
import { getDownloadHistory, getDownloadAttemptSummary } from '../api/client';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import EmptyState from '../components/EmptyState/EmptyState';
import Icon from '../components/Icon/Icon';
import Container from '../components/Container/Container';
import ProgressBar, { ProgressRing } from '../components/ProgressBar/ProgressBar';
import { useI18n } from '../contexts/I18nContext';

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { level, bootstrap } = useLayout();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityRange, setActivityRange] = useState('week');
  const [downloadHistory, setDownloadHistory] = useState({ papers: [], total: 0 });
  const [downloadAttempts, setDownloadAttempts] = useState({ counts: {}, recent: [] });
  const [classroomRooms, setClassroomRooms] = useState([]);

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const refreshDashboard = () => {
      getUserDashboard()
        .then((data) => {
          if (mounted) {
            setSummary(data);
            setError(null);
          }
        })
        .catch(() => {
          if (mounted && !summary) {
            setError('Unable to load your dashboard right now. Please try again later.');
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
  }, [access.canAccess, user?.id]);

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

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  if (!access.canAccess) {
    return (
      <Container>
        <div className="dashboard-wrapper dashboard-content">
          <EmptyState
            image={getEmptyStateImage('dashboard')}
            title="Access Restricted"
            description="Your account does not have access to this area."
          />
        </div>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="dashboard-wrapper dashboard-content">
          <div className="dashboard-loading-skeleton">
            <div className="dashboard-skeleton-heading">
              <div className="skeleton dashboard-skeleton-title" />
              <div className="skeleton dashboard-skeleton-subtitle" />
            </div>
            <div className="dashboard-skeleton-grid">
              <div className="skeleton dashboard-skeleton-block" />
              <div className="skeleton dashboard-skeleton-block" />
              <div className="skeleton dashboard-skeleton-block" />
              <div className="skeleton dashboard-skeleton-block" />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (locked) {
    return (
      <Container>
        <div className="dashboard-wrapper dashboard-content">
          <EmptyState
            icon="lock"
            title="Action temporarily disabled"
            description={reason || 'Suspicious activity detected. Please try again later.'}
          />
        </div>
      </Container>
    );
  }

  if (error || !summary) {
    return (
      <Container>
        <div className="dashboard-wrapper dashboard-content">
          <EmptyState
            image={getEmptyStateImage('error')}
            title="Something went wrong"
            description={error || 'Dashboard unavailable.'}
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
    analytics,
    level_user_counts: levelUserCounts = {}
  } = summary;

  const levelName = level?.display_name || 'No Level';
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
          label: 'Review due Recall',
          detail: `${planner.due_reviews} review${planner.due_reviews === 1 ? '' : 's'} ready`,
          to: '/recall',
          icon: 'brain'
        }
      : null,
    weakAreas[0]
      ? {
          key: 'weak',
          label: `Practice ${weakAreas[0].concept}`,
          detail: 'Target your current learning gap',
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
  const todayKey = new Date().toISOString().slice(0, 10);
  const activityMap = new Map((heatmap || []).map((item) => [item.activity_date, item]));
  const heatmapValues = Array.from({ length: activityDays }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (activityDays - 1 - index));
    const key = date.toISOString().slice(0, 10);
    return activityMap.get(key) || { activity_date: key, count: 0 };
  });

  return (
    <Container>
      <div className="dashboard-wrapper dashboard-content">
        <section className="panel dashboard-card dashboard-welcome-card" aria-labelledby="welcome-title">
          <div className="dashboard-header">
            <div className="header-info">
              <h1 id="welcome-title">
                Welcome back{userName ? `, ${userName}` : ''}
              </h1>
              <p id="welcome-subtitle">
                {platform.rank_title} · {levelName}
              </p>
            </div>
          </div>
        </section>

        {todayTasks.length > 0 && (
          <section className="panel dashboard-card dashboard-card-primary" id="today-plan-section" aria-labelledby="today-plan-title">
            <div className="panel-header">
              <h3 className="panel-title">
                Today's Learning Plan
              </h3>
            </div>
            <div className="panel-body">
              <div className="sidebar-list">
                {todayTasks.map((task, index) => (
                  <Link key={task.key} to={task.to} className="sidebar-item sidebar-item-link">
                    <span className="item-text">
                      <strong>{index + 1}. {task.label}</strong>
                      <small>{task.detail}</small>
                    </span>
                    <Icon name="arrow-right" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <div className="dashboard-grid">
          <main className="main-column">
            <div className="panel dashboard-card dashboard-card-primary" id="platform-stats-section">
              <div className="panel-header">
                <h3 className="panel-title">
                  Platform Stats
                </h3>
              </div>
              <div className="panel-body">
                <div className="platform-stats-grid" id="top-stats">
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="rocket" /></span>
                    <span className="stat-value">
                      {platform.total_xp?.toLocaleString?.() ?? platform.total_xp}
                    </span>
                    <span className="stat-label">{t('common.totalXp')}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="fire" /></span>
                    <span className="stat-value">{platform.current_streak}</span>
                    <span className="stat-label">{t('common.dayStreak')}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="trophy" /></span>
                    <span className="stat-value">{achievements.earned_count}</span>
                    <span className="stat-label">{t('common.badges')}</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="microscope" /></span>
                    <span className="stat-value">{quiz.blocks_completed ?? 0}</span>
                    <span className="stat-label">Quiz Blocks Done</span>
                  </div>
                  <div className="xp-progress-container">
                    <div className="xp-labels">
                      <span id="xp-current">{platform.xp_progress.xpIntoLevel} XP</span>
                      <span id="xp-next">{platform.xp_progress.nextLevelXp} XP</span>
                    </div>
                    <ProgressBar
                      value={platform.xp_progress.xpIntoLevel}
                      max={platform.xp_progress.nextLevelXp}
                      variant="gradient"
                    />
                    <p className="xp-progress-text" id="xp-progress-text">
                      {platform.xp_progress.xpIntoLevel}/{platform.xp_progress.nextLevelXp} XP to next level
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <section className="panel dashboard-card dashboard-card-primary" id="quiz-performance-section" aria-labelledby="quiz-performance-title">
              <div className="panel-header">
                <h3 className="panel-title" id="quiz-performance-title">Quiz performance</h3>
                <Link to="/quiz" className="dashboard-section-link">Practice quizzes</Link>
              </div>
              <div className="panel-body">
                <div className="dashboard-quiz-metrics">
                  <div className="dashboard-quiz-metric">
                    <span className="dashboard-quiz-metric-value">{quiz.total_attempts ?? 0}</span>
                    <span className="dashboard-quiz-metric-label">Attempts recorded</span>
                  </div>
                  <div className="dashboard-quiz-metric dashboard-quiz-metric-pass">
                    <span className="dashboard-quiz-metric-value">{quiz.passed_count ?? 0}</span>
                    <span className="dashboard-quiz-metric-label">Passed</span>
                  </div>
                  <div className="dashboard-quiz-metric dashboard-quiz-metric-fail">
                    <span className="dashboard-quiz-metric-value">{quiz.failed_count ?? 0}</span>
                    <span className="dashboard-quiz-metric-label">Not passed</span>
                  </div>
                  <div className="dashboard-quiz-metric">
                    <span className="dashboard-quiz-metric-value">{quiz.average_score ?? 0}%</span>
                    <span className="dashboard-quiz-metric-label">Average score</span>
                  </div>
                </div>
                <div className="dashboard-quiz-outcome" aria-label="Quiz pass and not-passed comparison">
                  <div className="dashboard-quiz-outcome-labels">
                    <span>Pass rate</span>
                    <strong>{quiz.recent_pass_rate ?? 0}%</strong>
                  </div>
                  <div className="dashboard-quiz-outcome-track" role="img" aria-label={`${quiz.recent_pass_rate ?? 0}% recent pass rate`}>
                    <span style={{ width: `${Math.max(0, Math.min(100, Number(quiz.recent_pass_rate) || 0))}%` }} />
                  </div>
                  {Array.isArray(quiz.score_trend) && quiz.score_trend.length > 0 ? (
                    <div className="dashboard-quiz-trend-wrap">
                      <div className="dashboard-quiz-trend-heading">
                        <strong>Recent score trend</strong>
                        <span>Last {quiz.score_trend.length} recorded attempts</span>
                      </div>
                      <div className="dashboard-quiz-trend" role="img" aria-label="Recent quiz scores from oldest to newest">
                        {quiz.score_trend.map((attempt, index) => {
                          const score = Math.max(0, Math.min(100, Number(attempt.score) || 0));
                          return (
                            <div className="dashboard-quiz-trend-column" key={`${attempt.completed_at || 'attempt'}-${index}`} title={`${attempt.topic || 'Quiz'}: ${score}%`}>
                              <span className="dashboard-quiz-trend-score">{score}%</span>
                              <div className="dashboard-quiz-trend-bar-track">
                                <span className={attempt.passed ? 'is-pass' : 'is-fail'} style={{ height: `${Math.max(4, score)}%` }} />
                              </div>
                              <small>{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : `#${index + 1}`}</small>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="dashboard-quiz-note">Complete a scored quiz to start your score trend graph.</p>
                  )}
                  <p className="dashboard-quiz-note">Based on your recorded quiz attempts. Use the unit mastery and weak-area sections to decide what to revise next.</p>
                </div>
              </div>
            </section>

            <section className="panel dashboard-card dashboard-card-secondary" id="recall-progress-section" aria-labelledby="recall-progress-title">
              <div className="panel-header">
                <h3 className="panel-title" id="recall-progress-title">Recall progress</h3>
                <Link to="/recall" className="dashboard-section-link">Open BioRecall</Link>
              </div>
              <div className="panel-body">
                <div className="dashboard-recall-grid">
                  <div><strong>{recall.total_sessions ?? 0}</strong><span>Sessions</span></div>
                  <div><strong>{recall.total_questions ?? 0}</strong><span>Questions practiced</span></div>
                  <div><strong>{recall.accuracy ?? 0}%</strong><span>Recall accuracy</span></div>
                  <div><strong>{recall.best_mastery ?? 0}%</strong><span>Best mastery</span></div>
                  <div className="dashboard-recall-xp"><strong>{Number(recall.total_xp ?? 0).toLocaleString()}</strong><span>Recall XP earned</span></div>
                </div>
                <p className="dashboard-quiz-note">Recall is tracked separately from scored quiz attempts so your memory practice and assessment results stay distinct.</p>
              </div>
            </section>

            {heatmapValues.length > 0 && (
              <section className="panel dashboard-card dashboard-card-primary" id="learning-activity-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Learning Activity
                  </h3>
                  <div className="segmented" role="group" aria-label="Learning activity period">
                    {['day', 'week', 'month'].map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={`seg ${activityRange === range ? 'active' : ''}`}
                        aria-pressed={activityRange === range}
                        onClick={() => setActivityRange(range)}
                      >
                        {range[0].toUpperCase() + range.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="panel-body">
                  <TotalLearningActivity
                    embedded
                    data={heatmapValues.map((item) => ({
                      label: new Date(item.activity_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                      value: Math.max(0, Number(item.count) || 0)
                    }))}
                  />
                </div>
              </section>
            )}

            {masteryMap.length > 0 && (
              <section className="panel dashboard-card dashboard-card-primary" id="mastery-map-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Your Mastery
                  </h3>
                  <span className="panel-meta">{overallMastery}% assessed mastery</span>
                </div>
                <div className="panel-body">
                  {assessedMastery.length > 0 ? (
                    <>
                      <p className="mastery-chart-explainer">This chart compares your assessed mastery across curriculum units. Larger segments represent higher mastery scores.</p>
                      <MasteryDonut
                        embedded
                        data={assessedMastery.map((item) => ({
                          label: item.unit_name,
                          value: Math.max(0, Number(item.mastery) || 0)
                        }))}
                      />
                    </>
                  ) : (
                    <p className="mastery-chart-explainer">Complete an assessment to see your mastery distribution.</p>
                  )}
                  <div className="mastery-summary">
                    <ProgressRing value={overallMastery} size="lg" tone="mastery" ariaLabel={`${overallMastery}% assessed mastery`} />
                    <div>
                      <strong>{overallMastery}% Overall Mastery</strong>
                      <p>Based on your assessed curriculum units.</p>
                    </div>
                  </div>
                  <div className="mastery-list">
                    {masteryMap.slice(0, 8).map((unit) => (
                      <Link
                        key={unit.unit_id}
                        to={unit.group_id && unit.slug ? `/curriculum/${encodeURIComponent(unit.group_id)}/${encodeURIComponent(unit.slug)}` : `/quiz?unit_id=${encodeURIComponent(unit.unit_id)}`}
                        className="mastery-item"
                      >
                        <span className="mastery-item-copy">
                          <strong>{unit.unit_name}</strong>
                          <small>{unit.assessed ? unit.status : 'Not assessed'}</small>
                        </span>
                        <span className="mastery-item-value">{unit.assessed ? `${unit.mastery}%` : '—'}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            )}

            <section className="panel dashboard-card dashboard-card-primary" id="pdf-downloads-section" aria-labelledby="pdf-downloads-title">
              <div className="panel-header">
                <h3 className="panel-title" id="pdf-downloads-title">PDF downloads</h3>
                <Link to="/past-papers" className="dashboard-section-link">Browse past papers</Link>
              </div>
              <div className="panel-body">
                <div className="dashboard-download-summary">
                  <strong>{downloadHistory.total}</strong>
                  <span>Recorded download-link events</span>
                </div>
                <div className="dashboard-download-attempt-metrics">
                  <div><strong>{downloadAttempts.counts.links_issued ?? 0}</strong><span>Links issued</span></div>
                  <div><strong>{downloadAttempts.counts.premium_blocked ?? 0}</strong><span>Premium blocked</span></div>
                  <div><strong>{(Number(downloadAttempts.counts.request_failed) || 0) + (Number(downloadAttempts.counts.network_error) || 0)}</strong><span>Request/network failures</span></div>
                </div>
                {downloadHistory.papers.length > 0 ? (
                  <div className="dashboard-download-list">
                    {downloadHistory.papers.slice(0, 5).map((paper, index) => (
                      <div className="dashboard-download-item" key={paper.id || `${paper.title}-${paper.downloaded_at}-${index}`}>
                        <span className="dashboard-download-file">
                          <strong>{paper.title || 'Past paper PDF'}</strong>
                          <small>{paper.subject || 'Study resource'}{paper.year ? ` · ${paper.year}` : ''}</small>
                        </span>
                        <span className="dashboard-download-date">
                          {paper.downloaded_at ? new Date(paper.downloaded_at).toLocaleDateString() : 'Recorded'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="dashboard-quiz-note">No successful download links have been recorded yet. Browse past papers to get started.</p>
                )}
                {downloadAttempts.recent.length > 0 && (
                  <div className="dashboard-download-attempts">
                    <h4>Recent download attempts</h4>
                    {downloadAttempts.recent.slice(0, 5).map((attempt) => {
                      const statusLabel = attempt.status === 'link_issued'
                        ? 'Link issued'
                        : attempt.status === 'premium_blocked'
                          ? 'Premium restricted'
                          : attempt.status === 'network_error'
                            ? 'Network problem'
                            : 'Request failed';
                      return (
                        <div className="dashboard-download-attempt" key={attempt.id}>
                          <span className={`dashboard-download-status dashboard-download-status-${attempt.status}`}>{statusLabel}</span>
                          <span className="dashboard-download-attempt-copy">
                            <strong>{attempt.paper_title || 'Past paper PDF'}</strong>
                            {attempt.reason && <small>{attempt.reason}</small>}
                          </span>
                          <time dateTime={attempt.created_at}>{new Date(attempt.created_at).toLocaleDateString()}</time>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="dashboard-download-help">
                  <strong>Having trouble downloading?</strong>
                  <ul>
                    <li><b>Premium restriction:</b> open the paper's access details or choose an unlocked paper.</li>
                    <li><b>Network failure:</b> check your connection, retry the download, and avoid refreshing until the request finishes.</li>
                    <li><b>Link issued:</b> the site created a short-lived link; if the file did not save, try again from Past Papers.</li>
                  </ul>
                </div>
                <p className="dashboard-quiz-note">Download events are recorded from the app. A browser cannot reliably confirm that the PDF finished saving, and a total network outage can prevent a failure event from reaching the server.</p>
              </div>
            </section>

            {continueReading.length > 0 && (
              <div className="panel dashboard-card dashboard-card-primary" id="continue-reading-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Continue Reading
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="reading-list" id="continue-reading-list">
                    {continueReading.map((item) => {
                      const progress = Math.round(item.progress_percentage);
                      return (
                        <Link
                          key={item.note_id}
                          to={`/notes/read?id=${item.note_id}`}
                          className="reading-item"
                        >
                          <div className="reading-info">
                            <h4>{item.title}</h4>
                            <p>{progress}% completed</p>
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
              <div className="panel dashboard-card dashboard-card-primary" id="recommendations-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Recommended For You
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="recommendation-grid" id="recommendations-list">
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
                        <Link key={index} to={link} className="rec-card">
                          <span className="rec-type">{typeLabel}</span>
                          <h4>{item.title}</h4>
                          <p>{item.reason}</p>
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
                className="dashboard-continue-link dashboard-card dashboard-card-primary"
                id="continue-practicing"
              >
                <div className="panel-body">
                  <div>
                    <span className="sec-label">{t('common.continuePracticing')}</span>
                    <span className="dashboard-continue-text" id="quiz-pass-rate-text">
                      Recent quiz pass rate: {quiz.recent_pass_rate}%
                    </span>
                  </div>
                  <Icon name="arrow-right" className="dashboard-continue-icon" />
                </div>
              </Link>
            )}
          </main>

          <aside className="sidebar-column">
            <section className="dashboard-activity-card" aria-labelledby="weekly-activity-title">
              <div className="dashboard-activity-header">
                <div>
                  <h3 id="weekly-activity-title">{activityRange === 'day' ? 'Daily Activity' : activityRange === 'month' ? 'Monthly Activity' : 'Weekly Activity'}</h3>
                  <button
                    type="button"
                    className="dashboard-activity-stats-btn"
                    onClick={() => document.getElementById('learning-activity-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                  >
                    Full {activityRange} stats
                    <svg
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
              </div>

              <div className="dashboard-activity-range">
                <span className="dashboard-activity-range-value">
                  {Math.min(...heatmapValues.map((item) => Number(item.count) || 0))}–{Math.max(...heatmapValues.map((item) => Number(item.count) || 0))}
                </span>
                <span className="dashboard-activity-range-unit">sessions</span>
              </div>

              <div className="dashboard-activity-date">
                {new Date(heatmapValues[0]?.activity_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                {' – '}
                {new Date(heatmapValues[heatmapValues.length - 1]?.activity_date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
              </div>

              <div className="dashboard-activity-chart" aria-label="Weekly learning activity">
                <div className="dashboard-activity-avg-line" />
                <div className="dashboard-activity-avg-label">
                  Avg. {Math.round(heatmapValues.reduce((sum, item) => sum + (Number(item.count) || 0), 0) / heatmapValues.length)}
                </div>
                <div className="dashboard-activity-bars">
                  {heatmapValues.map((item, index) => {
                    const value = Math.max(0, Number(item.count) || 0);
                    const maxValue = Math.max(...heatmapValues.map((day) => Number(day.count) || 0), 1);
                    const height = Math.max(12, Math.round((value / maxValue) * 62));
                    const dayLabel = new Date(item.activity_date).toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 2);

                    return (
                      <div className="dashboard-activity-bar-wrapper" key={item.activity_date}>
                        <div className="dashboard-activity-bar-container">
                          <div
                            className="dashboard-activity-bar"
                            style={{ height: `${height}px` }}
                            title={`${value} learning sessions`}
                          />
                        </div>
                        <span className="dashboard-activity-day">{dayLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="dashboard-activity-readings">
                <div className="dashboard-activity-reading">
                  <span>{new Date().toLocaleDateString(undefined, { weekday: 'short' })}</span>
                  <strong>{heatmapValues[heatmapValues.length - 1]?.count || 0} sessions</strong>
                </div>
                <div className="dashboard-activity-reading">
                  <span>{activityRange === 'day' ? 'Daily average' : activityRange === 'month' ? 'Monthly average' : 'Weekly average'}</span>
                  <strong>{Math.round(heatmapValues.reduce((sum, item) => sum + (Number(item.count) || 0), 0) / heatmapValues.length)} sessions</strong>
                </div>
              </div>
            </section>
            {recall?.best_mastery > 0 && (
              <div className="panel dashboard-card dashboard-card-secondary" id="personal-records-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Personal Records
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list" id="personal-records-stats">
                    <div className="sidebar-item">
                      <span className="item-text">{t('common.bestRecallMastery')}</span>
                      <span className="item-meta item-meta-accent">{recall.best_mastery}%</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">{t('common.recallTopics')}</span>
                      <span className="item-meta">{recall.topics_practiced}</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">{t('common.quizBlocksDone')}</span>
                      <span className="item-meta">{quiz.blocks_completed}</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">{t('common.readingStreak')}</span>
                      <span className="item-meta item-meta-warm">🔥 {notes.reading_streak}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(personalRecords).length > 0 && (
              <div className="panel dashboard-card dashboard-card-secondary" id="learning-records-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Learning Records
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list">
                    {[
                      ['highest_score', 'Highest Score'],
                      ['fastest_completion', 'Fastest Completion'],
                      ['perfect_blocks', 'Perfect Blocks']
                    ]
                      .filter(([key]) => personalRecords[key] !== null && personalRecords[key] !== undefined && personalRecords[key] !== 0)
                      .map(([key, label]) => (
                        <div className="sidebar-item" key={key}>
                          <span className="item-text">{label}</span>
                          <span className="item-meta">{personalRecords[key]}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            <section className="panel dashboard-card dashboard-card-secondary" id="learning-community-section" aria-labelledby="learning-community-title">
              <div className="panel-header">
                <h3 className="panel-title" id="learning-community-title">Learning community</h3>
              </div>
              <div className="panel-body">
                {levelUserCounts.available ? (
                  <>
                    <div className="dashboard-community-total">
                      <strong>{Number(levelUserCounts.total || 0).toLocaleString()}</strong>
                      <span>learners across all three levels</span>
                    </div>
                    <div className="dashboard-community-levels">
                      <div><span>O-Level</span><strong>{levelUserCounts.o_level ?? 0}</strong></div>
                      <div><span>A-Level</span><strong>{levelUserCounts.a_level ?? 0}</strong></div>
                      <div><span>Pharmacy</span><strong>{levelUserCounts.pharmacy ?? 0}</strong></div>
                    </div>
                  </>
                ) : (
                  <p className="dashboard-quiz-note">Learner totals are temporarily unavailable.</p>
                )}
              </div>
            </section>

            <section className="panel dashboard-card dashboard-card-secondary" id="live-classrooms-section" aria-labelledby="live-classrooms-title">
              <div className="panel-header">
                <h3 className="panel-title" id="live-classrooms-title">Your classrooms</h3>
                <Link to="/classroom" className="dashboard-section-link">View classrooms</Link>
              </div>
              <div className="panel-body">
                {classroomRooms.length > 0 ? (
                  <div className="dashboard-classroom-list">
                    {classroomRooms.map((room) => (
                      <Link to={`/classroom/${room.id}`} className="dashboard-classroom-item" key={room.id}>
                        <span className={`dashboard-classroom-status dashboard-classroom-status-${room.status}`}>
                          {room.status === 'open_floor' ? 'Open floor' : room.status === 'upcoming' ? 'Upcoming' : 'Live'}
                        </span>
                        <span className="dashboard-classroom-copy">
                          <strong>{room.title || room.topic_name || 'Classroom session'}</strong>
                          <small>{room.class_name || levelName}{room.participant_count != null ? ` · ${room.participant_count} participants` : ''}</small>
                          {room.scheduled_at && room.status === 'upcoming' && (
                            <small>Starts {new Date(room.scheduled_at).toLocaleString()}</small>
                          )}
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="dashboard-classroom-empty">
                    <p>No live or upcoming classrooms are available for your current class or programme right now.</p>
                    <Link to="/classroom" className="dashboard-section-link">Check classroom schedule</Link>
                  </div>
                )}
              </div>
            </section>

            {weakAreas.length > 0 && (
              <div className="panel dashboard-card dashboard-card-secondary" id="weak-areas-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Weak Areas
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list" id="weak-areas-list">
                    {weakAreas.map((weak, index) => (
                      <Link
                        key={index}
                        to={weak.unit_id ? `/quiz?unit_id=${encodeURIComponent(weak.unit_id)}` : '/quiz'}
                        className="sidebar-item sidebar-item-link"
                      >
                        <span className="item-text">{weak.concept}</span>
                        <span className="item-meta item-meta-danger">
                          {weak.incorrect_attempts} incorrect
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {recentActivity.length > 0 && (
              <div className="panel dashboard-card dashboard-card-secondary" id="recent-activity-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    Recent Activity
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list" id="recent-activity-list">
                    {recentActivity.map((activity, index) => {
                      const progress = Math.max(0, Math.min(100, Math.round(Number(activity.progress_percentage) || 0)));
                      const contentLabel = activity.type === 'recall' ? 'Recall' : activity.type === 'quiz' ? 'Quiz' : 'Reading';
                      const iconName = activity.type === 'recall' ? 'brain' : activity.type === 'quiz' ? 'graduation-cap' : 'book-open';

                      const activityLink = activity.type === 'reading' && activity.note_id
                        ? `/notes/read?id=${encodeURIComponent(activity.note_id)}`
                        : activity.type === 'quiz' && activity.unit_id
                          ? `/quiz?unit_id=${encodeURIComponent(activity.unit_id)}`
                          : activity.type === 'recall' && activity.unit_id
                            ? `/recall?unit_id=${encodeURIComponent(activity.unit_id)}`
                            : null;

                      const activityContent = (
                        <>
                          <div className={`activity-icon activity-icon-${activity.type}`}>
                            <Icon name={iconName} />
                          </div>
                          <div className="activity-details">
                            <div className="activity-content-row">
                              <div className="activity-copy">
                                <span className="activity-type">{contentLabel}</span>
                                <span className="act-text">{activity.details}</span>
                                <span className="act-date">
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
                        <Link key={index} to={activityLink} className="activity-item activity-item-link">
                          {activityContent}
                        </Link>
                      ) : (
                        <div key={index} className="activity-item">
                          {activityContent}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {unitXp.length > 0 && (
              <div className="panel dashboard-card dashboard-card-secondary" id="unit-xp-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="chart-line" /> Unit XP
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="unit-xp-layout">
                  <div className="unit-xp-grid" id="unit-xp-list">
                    {unitXp.map((unit, index) => (
                      <Link
                        key={index}
                        to={unitPath(unit, unit.unit_id ? `/quiz?unit_id=${encodeURIComponent(unit.unit_id)}` : '/quiz')}
                        className="unit-xp-item unit-xp-item-link"
                      >
                        <span className="unit-name">{unit.unit_name || 'Unit'}</span>
                        <span className="unit-value">{unit.xp.toLocaleString()} XP</span>
                      </Link>
                    ))}
                  </div>
                  <div className="unit-xp-chart" aria-label="XP earned by learning unit">
                    <XpBars embedded data={unitXpChart} />
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
