/* pages/Dashboard.jsx */
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
        <EmptyState
          image={getEmptyStateImage('dashboard')}
          title="Access Restricted"
          description="Your account does not have access to this area."
        />
      </Container>
    );
  }

  if (loading) {
    return (
      <Container>
        <div className="dashboard-wrapper">
          <div className="dashboard-skeleton">
            <div className="dashboard-skeleton-heading">
              <span className="skeleton dashboard-skeleton-title" />
              <span className="skeleton dashboard-skeleton-subtitle" />
            </div>
            <div className="dashboard-skeleton-grid">
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock />
              <SkeletonBlock />
            </div>
          </div>
        </div>
      </Container>
    );
  }

  if (error || !summary) {
    return (
      <Container>
        <EmptyState
          image={getEmptyStateImage('error')}
          title="Something went wrong"
          description={error || 'Dashboard unavailable.'}
        />
      </Container>
    );
  }

  if (locked) {
    return (
      <Container>
        <EmptyState
          icon="lock"
          title="Action temporarily disabled"
          description={reason || 'Suspicious activity detected. Please try again later.'}
        />
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

  const levelColor = level?.id === 'Pharmacy' ? 'accent' : level?.id === 'A-Level' ? 'secondary' : 'primary';

  return (
    <Container>
      <div className="dashboard-wrapper">
        <div className="dashboard-content">
          <header className="dashboard-header">
            <div className="header-info">
              <h1>
                Welcome back{user?.full_name ? `, ${user.full_name}` : ''}
              </h1>
              <p>
                {platform.rank_title} · {level?.display_name || ''}
              </p>
            </div>

            <span className={`dashboard-level-badge dashboard-level-badge-${levelColor}`}>
              {level?.display_name || 'No Level'}
            </span>
          </header>

          <div className="dashboard-grid">
            <main className="main-column">
              <section className="dashboard-panel dashboard-overview-panel">
                <div className="dashboard-panel-body">
                  <div className="platform-stats-grid" id="top-stats">
                    <div className="stat-box">
                      <span className="stat-icon"><Icon name="rocket" /></span>
                      <span className="stat-value">{platform.total_xp?.toLocaleString?.() ?? platform.total_xp}</span>
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
                  </div>

                  <div className="xp-progress-container">
                    <div className="xp-labels">
                      <span>{platform.xp_progress.xpIntoLevel} XP</span>
                      <span>{platform.xp_progress.nextLevelXp} XP</span>
                    </div>

                    <ProgressBar
                      value={platform.xp_progress.xpIntoLevel}
                      max={platform.xp_progress.nextLevelXp}
                      variant="gradient"
                    />

                    <p className="xp-progress-text">
                      {platform.xp_progress.xpIntoLevel}/{platform.xp_progress.nextLevelXp} XP to next level
                    </p>
                  </div>
                </div>
              </section>

              {notes.continue_reading.length > 0 && (
                <section className="dashboard-panel" id="continue-reading-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="book-open" /> Continue Reading
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
                    <div className="reading-list" id="continue-reading-list">
                      {notes.continue_reading.map((item) => {
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
                              style={{ background: `conic-gradient(var(--primary) ${progress}%, var(--border-subtle) 0)` }}
                              data-progress={`${progress}%`}
                            />
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </section>
              )}

              {analytics?.recommendations?.length > 0 && (
                <section className="dashboard-panel" id="recommendations-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="lightbulb" /> Recommended For You
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
                    <div className="recommendation-grid" id="recommendations-list">
                      {analytics.recommendations.slice(0, 4).map((item, index) => {
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
                </section>
              )}

              {quiz.recent_pass_rate > 0 && (
                <Link to="/quiz" className="dashboard-continue-link" id="continue-practicing">
                  <div>
                    <span className="sec-label">Continue Practicing</span>
                    <span className="dashboard-continue-text">
                      Recent quiz pass rate: {quiz.recent_pass_rate}%
                    </span>
                  </div>
                  <Icon name="arrow-right" className="dashboard-continue-icon" />
                </Link>
              )}
            </main>

            <aside className="sidebar-column">
              {recall.best_mastery > 0 && (
                <section className="dashboard-panel" id="personal-records-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="star" /> Personal Records
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
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
                </section>
              )}

              {weak_areas?.length > 0 && (
                <section className="dashboard-panel" id="weak-areas-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="lightbulb" /> Weak Areas
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
                    <div className="sidebar-list" id="weak-areas-list">
                      {weak_areas.map((weak, index) => (
                        <div key={index} className="sidebar-item">
                          <span className="item-text">{weak.concept}</span>
                          <span className="item-meta item-meta-danger">
                            {weak.incorrect_attempts} incorrect
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {recent_activity?.length > 0 && (
                <section className="dashboard-panel" id="recent-activity-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="clock" /> Recent Activity
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
                    <div className="sidebar-list" id="recent-activity-list">
                      {recent_activity.map((activity, index) => (
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
                </section>
              )}

              {unit_xp?.length > 0 && (
                <section className="dashboard-panel" id="unit-xp-section">
                  <div className="dashboard-panel-header">
                    <h3 className="dashboard-panel-title">
                      <Icon name="chart-line" /> Unit XP
                    </h3>
                  </div>

                  <div className="dashboard-panel-body">
                    <div className="unit-xp-grid" id="unit-xp-list">
                      {unit_xp.map((unit, index) => (
                        <div key={index} className="unit-xp-item">
                          <span className="unit-name">{unit.unit_id}</span>
                          <span className="unit-value">{unit.xp.toLocaleString()} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              )}
            </aside>
          </div>
        </div>
      </div>
    </Container>
  );
}

function SkeletonBlock() {
  return <span className="skeleton dashboard-skeleton-block" />;
}
