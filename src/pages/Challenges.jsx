import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { getPersonalizedDailyChallenge } from '../api/client';
import { getChallengeMeta, getChallengeProgress, isChallengeCompleted } from '../utils/challengeConfig';

function ChallengeCard({ challenge, onOpen }) {
  const type = challenge.challenge_type || challenge.type;
  const targetCount = Number(challenge.target_count ?? challenge.target ?? 0);
  const meta = getChallengeMeta(type);
  const progress = getChallengeProgress(challenge);
  const completed = isChallengeCompleted(challenge);

  return (
    <article className="grid min-w-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 lg:grid-cols-[0.85fr_1.15fr]">
      <div className="relative flex min-h-[240px] flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-800 to-indigo-700 p-7 text-white sm:min-h-[300px] sm:p-10">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-white/10" />
        <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm sm:h-36 sm:w-36">
          <Icon name={meta.icon} className="h-14 w-14 sm:h-20 sm:w-20" />
        </div>
        <span className="relative mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur">
          <Icon name="clipboard-check" className="h-4 w-4" /> {meta.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-8 lg:p-10">
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">Today's challenge</span>
          <h2 className="mt-3 break-words text-2xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">{challenge.title}</h2>
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">{challenge.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="flex min-w-0 items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <Icon name="book-open" className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Learning area</p>
              <p className="break-words text-sm font-semibold text-slate-800 dark:text-slate-100">{challenge.unit_name || 'Selected learning area'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <Icon name="list-check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Tasks</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{targetCount} {targetCount === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
            <Icon name="star" className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Reward</p>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">+{challenge.reward_xp} XP</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">{completed ? 'Challenge completed' : 'Your progress'}</span>
            <span className="font-bold tabular-nums text-slate-900 dark:text-white">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-500 transition-all duration-500" style={{ width: progress + '%' }} />
          </div>
        </div>

        <button type="button" onClick={() => onOpen(meta.route, challenge.id)} className="inline-flex w-full items-center justify-center gap-3 rounded-xl bg-blue-700 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-700/20 transition hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 sm:w-auto sm:self-start">
          {completed ? 'Review your challenge' : 'Start your challenge'}
          <Icon name="arrow-right" className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ onScope }) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"><Icon name="clipboard-check" className="h-10 w-10" /></div>
      <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Daily challenge</span>
      <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Your next challenge isn’t ready yet</h2>
      <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">We couldn’t prepare a challenge for your selected programme just yet. Check your learning level and topic, then try again.</p>
      <button type="button" onClick={onScope} className="mt-6 inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Check learning level</button>
    </div>
  );
}

export default function Challenges() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPersonalizedDailyChallenge()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <main className="min-h-[60vh] bg-slate-50 px-4 py-12 dark:bg-slate-950"><div className="flex min-h-[40vh] items-center justify-center"><Spinner size="lg" /></div></main>;
  }

  if (!data?.challenge) {
    return <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6"><EmptyState onScope={() => navigate('/settings/scope')} /></main>;
  }

  return (
    <main className="min-h-screen px-4 py-8 sm:px-6 sm:py-12" style={{ backgroundColor: '#EAF2FA' }}>
      <div className="mx-auto max-w-6xl">
        <header className="mb-7 max-w-3xl sm:mb-10">
          <p className="text-sm font-semibold text-blue-700 dark:text-blue-400">AliverBiopharm challenges</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl">Your daily challenge</h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">Build your skills with a short challenge matched to your selected programme and recent progress.</p>
          {(data.scope?.level_name || data.scope?.group_name) && <div className="mt-4 flex flex-wrap gap-2">{[data.scope.level_name, data.scope.group_name].filter(Boolean).map((label, index) => <span key={index} className="inline-flex max-w-full items-center rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">{label}</span>)}</div>}
        </header>
        <ChallengeCard challenge={data.challenge} onOpen={(route, id) => navigate(route + '?challenge_id=' + encodeURIComponent(id))} />
      </div>
    </main>
  );
}
