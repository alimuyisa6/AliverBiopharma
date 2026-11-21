 /* features/quiz/QuizDashboard.jsx */
import { useEffect, useState } from 'react';
import { getUserDashboard } from '../../api/cachedClient';
import Icon from '../../components/Icon/Icon';
import Skeleton from '../../components/Skeleton/Skeleton';

export default function QuizDashboard({ user, level, class_name }) {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) return;

    getUserDashboard().then(setSummary).catch(() => {});
  }, [user]);

  if (!summary) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <Skeleton height={100} />
      </div>
    );
  }

  const { platform, quiz, achievements } = summary;
  return (
    <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
      <h3 className="mb-5 text-xl font-bold leading-7 tracking-tight text-slate-900 sm:text-2xl">Your learning dashboard</h3>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 xl:grid-cols-5">
        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <Icon name="trophy" className="h-8 w-8 text-orange-600" />
          <div className="break-words text-lg font-extrabold leading-6 tracking-tight text-slate-900 sm:text-xl">{platform.rank_title}</div>
          <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">Rank</div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <Icon name="fire" className="h-8 w-8 text-amber-600" />
          <div className="break-words text-lg font-extrabold leading-6 tracking-tight text-slate-900 sm:text-xl">{platform.current_streak} days</div>
          <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">Streak</div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <Icon name="medal" className="h-8 w-8 text-violet-600" />
          <div className="break-words text-lg font-extrabold leading-6 tracking-tight text-slate-900 sm:text-xl">{achievements?.earned_count || 0}</div>
          <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">Badges</div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <Icon name="microscope" className="h-8 w-8 text-teal-700" />
          <div className="break-words text-lg font-extrabold leading-6 tracking-tight text-slate-900 sm:text-xl">{quiz.blocks_completed}</div>
          <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">Question sets completed</div>
        </div>

        <div className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
          <Icon name="bullseye" className="h-8 w-8 text-violet-600" />
          <div className="break-words text-lg font-extrabold leading-6 tracking-tight text-slate-900 sm:text-xl">{quiz.recent_pass_rate}%</div>
          <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">Recent pass rate</div>
        </div>
      </div>
    </div>
  );
}
