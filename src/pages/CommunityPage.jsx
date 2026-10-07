 /* pages/CommunityPage.jsx */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import { getCommunityActivity, getWeeklyChallengeStatus, submitMood, submitWeeklyChallenge } from '../api/cachedClient';
import { MoodCheckSection } from '../features/mood/MoodCheckSection';
import { CommunitySection } from '../features/community/CommunitySection';

export default function CommunityPage() {
  const { user } = useAuth();
  const { level } = useLayout();
  const [sections, setSections] = useState({});
  const [communityActivity, setCommunityActivity] = useState([]);
  const [moodSelected, setMoodSelected] = useState(null);
  const [moodMessage, setMoodMessage] = useState('');
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [weeklyChallengeAnswer, setWeeklyChallengeAnswer] = useState(null);

  useEffect(() => {
    if (level?.id) {
      getSections(level.id).then(setSections).catch(() => {});
    }

    getCommunityActivity().then(setCommunityActivity).catch(() => {});
    getWeeklyChallengeStatus().then((result) => {
      if (result?.progress?.answered) {
        setWeeklyChallengeAnswer({
          correct: result.progress.correct === true,
          explanation: result.progress.explanation || ''
        });
      } else {
        setWeeklyChallengeAnswer(null);
      }
    }).catch(() => {});
  }, [level]);

  const [moodSubmitting, setMoodSubmitting] = useState(false);
  const [challengeSubmitting, setChallengeSubmitting] = useState(null);

  const handleMoodSubmit = useCallback(async () => {
    if (!moodSelected) return;

    setMoodSubmitting(true);
    try {
      await submitMood(moodSelected, moodMessage);
      setMoodSubmitted(true);
    } catch {}
  }, [moodSelected, moodMessage]);

  const handleWeeklyChallengeSubmit = useCallback(async (index) => {
    setChallengeSubmitting(index);
    if (!user) return;

    try {
      const result = await submitWeeklyChallenge(
        new Date().toISOString().slice(0, 10),
        index
      );

      setWeeklyChallengeAnswer({
        correct: result.correct === true,
        explanation: result.explanation || explanation
      });
    } catch {
      setWeeklyChallengeAnswer(null);
    } finally {
      setChallengeSubmitting(null);
    }
  }, [user]);

  return (
    <div className="home-page">
      <MoodCheckSection
        moodSelected={moodSelected}
        moodMessage={moodMessage}
        moodSubmitted={moodSubmitted}
        onMoodSelect={setMoodSelected}
        onMessageChange={setMoodMessage}
        onSubmit={handleMoodSubmit} submitting={moodSubmitting}
      />

      <CommunitySection
        activity={communityActivity}
        weeklyChallenge={sections?.weekly_challenge}
        weeklyChallengeAnswer={weeklyChallengeAnswer}
        onWeeklySubmit={handleWeeklyChallengeSubmit} challengeSubmitting={challengeSubmitting}
      />
    </div>
  );
}
