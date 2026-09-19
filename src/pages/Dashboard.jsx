import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getUserDashboard } from '../api/cachedClient';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import EmptyState from '../components/EmptyState/EmptyState';
import Icon from '../components/Icon/Icon';
import Container from '../components/Container/Container';
import ProgressBar, { ProgressRing } from '../components/ProgressBar/ProgressBar';

export default function Dashboard() {
  const { user } = useAuth();
  const { level, bootstrap } = useLayout();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!access.canAccess) {
      setLoading(false);
      return;
    }

    let mounted = true;

    getUserDashboard()
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {
        if (mounted) setError('Unable to load your dashboard right now. Please try again later.');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [access.canAccess]);

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
    analytics
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

  const heatmapValues = heatmap.slice(0, 42);
  const maxHeatmapCount = Math.max(1, ...heatmapValues.map((item) => Number(item.count) || 0));
  const formatHeatmapDate = (value) => {
    if (!value) return '';
    return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <Container>
      <div className="dashboard-wrapper dashboard-content">
        <header className="dashboard-header">
          <div className="header-info">
            <h1 id="welcome-title">
              Welcome back{userName ? `, ${userName}` : ''}
            </h1>
            <p id="welcome-subtitle">
              {platform.rank_title} · {levelName}
            </p>
          </div>
          <span className="badge" id="level-badge">
            {levelName}
          </span>
        </header>

        {todayTasks.length > 0 && (
          <section className="panel" id="today-plan-section" aria-labelledby="today-plan-title">
            <div className="panel-header">
              <h3 className="panel-title">
                <Icon name="lightbulb" /> Today's Learning Plan
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
            <div className="panel" id="platform-stats-section">
              <div className="panel-header">
                <h3 className="panel-title">
                  <Icon name="chart-line" /> Platform Stats
                </h3>
              </div>
              <div className="panel-body">
                <div className="platform-stats-grid" id="top-stats">
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="rocket" /></span>
                    <span className="stat-value">
                      {platform.total_xp?.toLocaleString?.() ?? platform.total_xp}
                    </span>
                    <span className="stat-label">Total XP</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="fire" /></span>
                    <span className="stat-value">{platform.current_streak}</span>
                    <span className="stat-label">Day Streak</span>
                  </div>
                  <div className="stat-box">
                    <span className="stat-icon"><Icon name="trophy" /></span>
                    <span className="stat-value">{achievements.earned_count}</span>
                    <span className="stat-label">Badges</span>
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

            {heatmapValues.length > 0 && (
              <section className="panel" id="learning-activity-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="clock" /> Learning Activity
                  </h3>
                  <span className="panel-meta">Last {heatmapValues.length} days</span>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list">
                    {heatmapValues.slice(0, 7).map((item) => {
                      const count = Number(item.count) || 0;
                      return (
                        <div className="sidebar-item" key={item.activity_date}>
                          <span className="item-text">{formatHeatmapDate(item.activity_date)}</span>
                          <span className="item-meta">
                            {count} {count === 1 ? 'activity' : 'activities'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            )}

            {masteryMap.length > 0 && (
              <section className="panel" id="mastery-map-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="target" /> Your Mastery
                  </h3>
                  <span className="panel-meta">{overallMastery}% assessed mastery</span>
                </div>
                <div className="panel-body">
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

            {continueReading.length > 0 && (
              <div className="panel" id="continue-reading-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="book-open" /> Continue Reading
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
              <div className="panel" id="recommendations-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="lightbulb" /> Recommended For You
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
                className="dashboard-continue-link"
                id="continue-practicing"
              >
                <div className="panel-body">
                  <div>
                    <span className="sec-label">Continue Practicing</span>
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
            {recall?.best_mastery > 0 && (
              <div className="panel" id="personal-records-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="star" /> Personal Records
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list" id="personal-records-stats">
                    <div className="sidebar-item">
                      <span className="item-text">Best Recall Mastery</span>
                      <span className="item-meta item-meta-accent">{recall.best_mastery}%</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">Recall Topics</span>
                      <span className="item-meta">{recall.topics_practiced}</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">Quiz Blocks Done</span>
                      <span className="item-meta">{quiz.blocks_completed}</span>
                    </div>
                    <div className="sidebar-item">
                      <span className="item-text">Reading Streak</span>
                      <span className="item-meta item-meta-warm">🔥 {notes.reading_streak}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {Object.keys(personalRecords).length > 0 && (
              <div className="panel" id="learning-records-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="trophy" /> Learning Records
                  </h3>
                </div>
                <div className="panel-body">
                  <div className="sidebar-list">
                    {Object.entries(personalRecords)
                      .filter(([, value]) => value !== null && value !== undefined && value !== 0)
                      .slice(0, 4)
                      .map(([key, value]) => (
                        <div className="sidebar-item" key={key}>
                          <span className="item-text">{key.replaceAll('_', ' ')}</span>
                          <span className="item-meta">{value}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {weakAreas.length > 0 && (
              <div className="panel" id="weak-areas-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="lightbulb" /> Weak Areas
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
              <div className="panel" id="recent-activity-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="clock" /> Recent Activity
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
              <div className="panel" id="unit-xp-section">
                <div className="panel-header">
                  <h3 className="panel-title">
                    <Icon name="chart-line" /> Unit XP
                  </h3>
                </div>
                <div className="panel-body">
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
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Container>
  );
}
