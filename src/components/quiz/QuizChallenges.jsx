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
    <div className="card card-surface-tinted card-tone-warning card-elevation-soft card-density-comfortable quiz-challenge-card">
      <Icon name="rocket" className="quiz-challenge-icon" />

      <div className="quiz-challenge-body">
        <h4 className="quiz-challenge-title font-poppins">
          {challenge.title}
          {levelName && <span className="quiz-challenge-sublabel font-maven-pro"> — {levelName}{classLabel ? ` · ${classLabel}` : ''}</span>}
        </h4>

        <p className="quiz-challenge-reward font-comfortaa">{challenge.reward_xp} XP reward</p>
        <ProgressBar value={challenge.progress} max={challenge.target} variant="warm" />
      </div>

      <div className="quiz-challenge-status">
        {challenge.completed ? (
          <Icon name="circle-check" className="icon-complete" />
        ) : (
          <span className="progress-label font-mono">{challenge.progress}/{challenge.target}</span>
        )}
      </div>
    </div>
  );
}
