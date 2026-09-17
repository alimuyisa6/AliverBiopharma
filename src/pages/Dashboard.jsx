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
import ProgressBar from '../components/ProgressBar/ProgressBar';

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
            <div className="dashboard-skeleton-layout">
              <div className="dashboard-skeleton-column">
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-stats" />
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-reading" />
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-recommendations" />
              </div>
              <div className="dashboard-skeleton-column">
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-records" />
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-weak" />
                <div className="skeleton dashboard-skeleton-block dashboard-skeleton-block-activity" />
              </div>
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

        <div className="dashboard-grid">
          <main className="main-column">
            <div className="panel">
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
                          <div
                            className="reading-progress-circle"
                            style={{
                              background: `conic-gradient(var(--primary) ${progress}%, var(--border-subtle) 0)`
                            }}
                            data-progress={`${progress}%`}
                            aria-label={`${progress}% completed`}
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
                        ? '/recall'
                        : item.type === 'weak_topic'
                          ? '/quiz'
                          : '/flashcards';
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
                      <div key={index} className="sidebar-item">
                        <span className="item-text">{weak.concept}</span>
                        <span className="item-meta item-meta-danger">
                          {weak.incorrect_attempts} incorrect
                        </span>
                      </div>
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
                    {recentActivity.map((activity, index) => (
                      <div key={index} className="activity-item">
                        <div className="activity-icon">
                          <Icon
                            name={
                              activity.type === 'recall'
                                ? 'brain'
                                : activity.type === 'quiz'
                                  ? 'graduation-cap'
                                  : 'book-open'
                            }
                          />
                        </div>
                        <div className="activity-details">
                          <span className="act-text">{activity.details}</span>
                          <span className="act-date">
                            {new Date(activity.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                    ))}
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
                      <div key={index} className="unit-xp-item">
                        <span className="unit-name">{unit.unit_id}</span>
                        <span className="unit-value">{unit.xp.toLocaleString()} XP</span>
                      </div>
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
