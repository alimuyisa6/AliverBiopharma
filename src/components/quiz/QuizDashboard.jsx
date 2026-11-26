 /* features/quiz/QuizDashboard.jsx */
import { useEffect, useState } from 'react';
import { getUserDashboard } from '../../api/cachedClient';
import Icon from '../../components/Icon/Icon';
import Skeleton from '../../components/Skeleton/Skeleton';
import { UI } from '../../design-system';

export default function QuizDashboard({ user, level, class_name }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) return;

    getUserDashboard().then(setSummary).catch(() => {});
  }, [user]);

  if (!summary) {
    return (
      <div className={`${UI.container} py-2`}>
        <Skeleton height={100} />
      </div>
    );
  }

  const { platform, quiz, achievements } = summary;
  return (
    <div className={`${UI.container} py-2`}>
      <h3 className={UI.sectionHeadingTitle}>Your learning dashboard</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <div className={UI.compactStatCard}>
          <Icon name="trophy" className="h-8 w-8 text-secondary-700" />
          <div className={UI.compactStatValue}>{platform.rank_title}</div>
          <div className={UI.statCardLabel}>Rank</div>
        </div>

        <div className={UI.compactStatCard}>
          <Icon name="fire" className="h-8 w-8 text-amber-600" />
          <div className={UI.compactStatValue}>{platform.current_streak} days</div>
          <div className={UI.statCardLabel}>Streak</div>
        </div>

        <div className={UI.compactStatCard}>
          <Icon name="medal" className="h-8 w-8 text-primary-700" />
          <div className={UI.compactStatValue}>{achievements?.earned_count || 0}</div>
          <div className={UI.statCardLabel}>Badges</div>
        </div>

        <div className={UI.compactStatCard}>
          <Icon name="microscope" className="h-8 w-8 text-secondary-700" />
          <div className={UI.compactStatValue}>{quiz.blocks_completed}</div>
          <div className={UI.statCardLabel}>Question sets completed</div>
        </div>

        <div className={UI.compactStatCard}>
          <Icon name="bullseye" className="h-8 w-8 text-emerald-700" />
          <div className={UI.compactStatValue}>{quiz.recent_pass_rate}%</div>
          <div className={UI.statCardLabel}>Recent pass rate</div>
        </div>
      </div>
    </div>
  );
}
