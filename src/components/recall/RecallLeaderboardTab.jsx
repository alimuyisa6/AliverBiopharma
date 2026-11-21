// components/recall/RecallLeaderboardTab.jsx
import Icon from '../Icon/Icon';

export default function RecallLeaderboardTab({ leaderboard }) {
  function rankClass(index) {
    if (index === 0) return 'bg-amber-100 text-amber-900 ring-1 ring-amber-300';
    if (index === 1) return 'bg-slate-100 text-slate-700 ring-1 ring-slate-300';
    if (index === 2) return 'bg-orange-100 text-orange-900 ring-1 ring-orange-300';
    return 'bg-primary-50 text-primary-800';
  }

  return (
    <div className="w-full min-w-0 space-y-3">
      {leaderboard.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">No data yet. Be the first!</p>
      ) : (
        leaderboard.map((entry, index) => (
          <div key={entry.user_id || index} className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4">
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-extrabold tabular-nums ${rankClass(index)}`}>#{index + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-800">
              {entry.display_name || 'Anonymous Learner'}
            </span>
            <span className="font-mono">{entry.total_xp} XP</span>
            <span className="inline-flex shrink-0 rounded-full bg-primary-50 px-2.5 py-1 text-xs font-bold text-primary-800">Level {entry.recall_level}</span>
          </div>
        ))
      )}
    </div>
  );
}
