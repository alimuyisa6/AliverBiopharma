 /* features/quiz/QuizChallenges.jsx */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonalizedDailyChallenge } from '../../api/client';
import Icon from '../../components/Icon/Icon';
import ProgressBar from '../../components/ProgressBar/ProgressBar';

export default function QuizChallenges({ user, level, class_name }) {
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);

  useEffect(() => {
    if (!user) return;

    getPersonalizedDailyChallenge()
      .then((data) => {
        const challenge = data?.challenge;
        if (!challenge) {
          setChallenge(null);
          return;
        }
        setChallenge({
          id: challenge.id,
          unit_id: challenge.unit_id,
          title: challenge.title,
          reward_xp: challenge.reward_xp,
          progress: challenge.progress || 0,
          target: challenge.target || 0,
          completed: challenge.passed === true || challenge.status === 'completed'
        });
      })
      .catch(() => setChallenge(null));
  }, [user]);

  if (!challenge || !challenge.title) return null;

  const levelName = level?.display_name || level?.id || '';
  const classLabel = class_name || '';

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
      <Icon name="rocket" className="h-9 w-9 shrink-0 text-secondary-800" />

      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-bold leading-7 text-primary-950">
          {challenge.title}
          {levelName && <span className="block text-sm leading-6 text-slate-600"> — {levelName}{classLabel ? ` · ${classLabel}` : ''}</span>}
        </h4>

        <p className="mt-1 text-sm font-semibold leading-5 text-secondary-800">{challenge.reward_xp} XP reward</p>
        <ProgressBar value={challenge.progress} max={challenge.target} variant="warm" />
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {challenge.completed ? (
          <Icon name="circle-check" className="h-7 w-7 text-green-700" />
        ) : (
          <>
            <span className="text-sm font-bold tabular-nums text-primary-900">{challenge.progress}/{challenge.target}</span>
            <button
              type="button"
              className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600"
              onClick={() => navigate(`/quiz?unit_id=${encodeURIComponent(challenge.unit_id)}&challenge_id=${encodeURIComponent(challenge.id)}`)}
            >
              Start
            </button>
          </>
        )}
      </div>
    </div>
  );
}
