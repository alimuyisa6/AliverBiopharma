 /* features/quiz/QuizChallenges.jsx */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPersonalizedDailyChallenge } from '../../api/client';
import Icon from '../../components/Icon/Icon';
import ProgressBar from '../../components/ProgressBar/ProgressBar';
import { UI } from '../../design-system';

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
    <div className={UI.quizChallengePanel}>
      <Icon name="rocket" className="h-9 w-9 shrink-0 text-secondary-800" />

      <div className="min-w-0 flex-1">
        <h4 className="text-lg font-bold leading-7 text-primary-950">
          {challenge.title}
          {levelName && <span className="block text-sm leading-6 text-slate-600"> — {levelName}{classLabel ? ` · ${classLabel}` : ''}</span>}
        </h4>

        <p className="mt-1 text-sm font-semibold leading-5 text-secondary-800">{challenge.reward_xp} XP reward</p>
        <ProgressBar value={challenge.progress} max={challenge.target} variant="secondary" />
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        {challenge.completed ? (
          <Icon name="circle-check" className="h-7 w-7 text-emerald-700" />
        ) : (
          <>
            <span className="text-sm font-bold tabular-nums text-primary-900">{challenge.progress}/{challenge.target}</span>
            <button
              type="button"
              className={UI.primaryButton}
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
