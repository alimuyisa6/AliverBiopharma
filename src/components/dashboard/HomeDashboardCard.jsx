 /* components/dashboard/HomeDashboardCard.jsx */
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDashboard } from '../../api/cachedClient';

export default function HomeDashboardCard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) {
      setSummary(null);
      return;
    }

    let mounted = true;

    getUserDashboard()
      .then((data) => {
        if (mounted) setSummary(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [user]);

  if (!summary) return null;

  const { platform, quiz, achievements } = summary;

  return (
    <section className="section home-learning-snapshot-section">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Your learning</span>
          <h2>Learning snapshot</h2>
        </div>
        <Link
          to="/dashboard"
          className="text-link home-learning-snapshot-dashboard-link"
        >
          <span>View full dashboard</span>
          <svg
            className="home-dashboard-link-arrow"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
          >
            <path
              d="M4 12h15m-6-6 6 6-6 6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
      </div>
      <div className="home-snapshot-stack card-stack">        <div className="card-stack-back" aria-hidden="true" />        <div className="dash-strip card-stack-front">
        <div className="dash-cell">
          <div className="dc-label">Total XP</div>
          <div className="dc-value green">{platform.total_xp.toLocaleString()}</div>
          <div className="dc-sub">{platform.xp_progress.xpToNext} to next level</div>
        </div>
        <div className="dash-cell">
          <div className="dc-label">Day streak</div>
          <div className="dc-value amber">{platform.current_streak}</div>
          <div className="dc-sub">Keep going</div>
        </div>
        <div className="dash-cell">
          <div className="dc-label">Badges</div>
          <div className="dc-value">{achievements.earned_count}</div>
          <div className="dc-sub">of {achievements.total_count}</div>
        </div>
        <div className="dash-cell">
          <div className="dc-label">Quiz blocks</div>
          <div className="dc-value">{quiz.blocks_completed}</div>
          <div className="dc-sub">{quiz.recent_pass_rate}% pass rate</div>
        </div>
        </div>
      </div>
    </section>
  );
}
