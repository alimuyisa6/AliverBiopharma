 /* pages/CommunityPage.jsx */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { getCommunityActivity, getWeeklyChallengeStatus, submitMood, submitWeeklyChallenge } from '../api/cachedClient';
import { MoodCheckSection } from '../features/mood/MoodCheckSection';
import { CommunitySection } from '../features/community/CommunitySection';
import StorysetIllustration from '../components/StorysetIllustration';

export default function CommunityPage() {
  const { user } = useAuth();
  const { level } = useLayout();
  const [communityActivity, setCommunityActivity] = useState([]);
  const [moodSelected, setMoodSelected] = useState(null);
  const [moodMessage, setMoodMessage] = useState('');
  const [moodSubmitted, setMoodSubmitted] = useState(false);
  const [weeklyChallenge, setWeeklyChallenge] = useState(null);
  const [weeklyChallengeAnswer, setWeeklyChallengeAnswer] = useState(null);

  useEffect(() => {
    getCommunityActivity().then(setCommunityActivity).catch(() => {});
    getWeeklyChallengeStatus().then((result) => {
      if (!result?.available || !result?.challenge?.question) {
        setWeeklyChallenge(null);
        setWeeklyChallengeAnswer(null);
        return;
      }

      setWeeklyChallenge(result.challenge);

      if (result.progress?.answered) {
        setWeeklyChallengeAnswer({
          correct: result.progress.correct === true,
          explanation: result.progress.explanation || result.challenge.explanation || ''
        });
      } else {
        setWeeklyChallengeAnswer(null);
      }
    }).catch(() => {
      setWeeklyChallenge(null);
      setWeeklyChallengeAnswer(null);
    });
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
    if (!user) return;
    setChallengeSubmitting(index);

    try {
      const result = await submitWeeklyChallenge(null, index);

      setWeeklyChallengeAnswer({
        correct: result.correct === true,
        explanation: result.explanation || ''
      });
    } catch {
      setWeeklyChallengeAnswer(null);
    } finally {
      setChallengeSubmitting(null);
    }
  }, [user]);

  return (
    <main className="min-h-screen w-full bg-background">
      <section className="w-full bg-primary-50 px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="community-page-heading">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-8">
          <div className="min-w-0">
            <h1 id="community-page-heading" className="text-3xl font-bold leading-tight text-primary-900 sm:text-4xl">Learning community</h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700">Share learning moments, take on weekly challenges, and connect with fellow learners.</p>
          </div>
          <StorysetIllustration name="teamWork" alt="Learners collaborating as a community" className="hidden w-44 shrink-0 object-contain sm:block lg:w-56" />
        </div>
      </section>
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
        weeklyChallenge={weeklyChallenge}
        weeklyChallengeAnswer={weeklyChallengeAnswer}
        onWeeklySubmit={handleWeeklyChallengeSubmit} challengeSubmitting={challengeSubmitting}
      />
    </main>
  );
}
