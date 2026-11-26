import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StorysetIllustration from '../StorysetIllustration';
import { useAuth } from '../../contexts/AuthContext';
import { getUserDashboard } from '../../api/cachedClient';

export default function HomeDashboardCard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) {
      setSummary(null);
      return undefined;
    }
    let mounted = true;
    getUserDashboard()
      .then((data) => { if (mounted) setSummary(data); })
      .catch(() => {});
    return () => { mounted = false; };
  }, [user]);

  if (!summary) return null;
  const platform = summary.platform || {};
  const quiz = summary.quiz || {};
  const achievements = summary.achievements || {};
  const metrics = [
    { label: 'Total XP', value: Number(platform.total_xp || 0).toLocaleString(), detail: `${platform.xp_progress?.xpToNext ?? 0} to next level`, tone: 'text-emerald-700' },
    { label: 'Day streak', value: platform.current_streak ?? 0, detail: 'Keep going', tone: 'text-secondary-700' },
    { label: 'Badges', value: achievements.earned_count ?? 0, detail: `of ${achievements.total_count ?? 0}`, tone: 'text-primary-800' },
    { label: 'Quiz blocks', value: quiz.blocks_completed ?? 0, detail: `${quiz.recent_pass_rate ?? 0}% pass rate`, tone: 'text-primary-800' }
  ];

  return (
    <section className="mx-auto w-full max-w-7xl py-2" aria-labelledby="home-learning-snapshot-title">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <StorysetIllustration name="personalGoals" alt="Learner tracking study goals" className="w-16 shrink-0 object-contain sm:w-20" />
          <h2 id="home-learning-snapshot-title" className="m-0 text-2xl font-bold text-primary-900 sm:text-3xl">Learning snapshot</h2>
        </div>
        <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-primary-700 hover:text-secondary-700">View full dashboard <span aria-hidden="true">→</span></Link>
      </header>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article key={metric.label} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">{metric.label}</p>
            <strong className={`mt-3 block text-3xl font-extrabold tracking-tight ${metric.tone}`}>{metric.value}</strong>
            <p className="mt-2 text-xs font-medium text-slate-500">{metric.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
