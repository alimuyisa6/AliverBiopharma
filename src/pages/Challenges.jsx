import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import StorysetIllustration from '../components/StorysetIllustration';
import Spinner from '../components/Spinner/Spinner';
import { getPersonalizedDailyChallenge } from '../api/client';
import { getChallengeMeta, getChallengeProgress, isChallengeCompleted } from '../utils/challengeConfig';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

function ChallengeCard({ challenge, onOpen }) {
  const type = challenge.challenge_type || challenge.type;
  const targetCount = Number(challenge.target_count ?? challenge.target ?? 0);
  const meta = getChallengeMeta(type);
  const progress = getChallengeProgress(challenge);
  const completed = isChallengeCompleted(challenge);

  return (
    <article className={UI.challengeCard}>
      <div className={UI.challengeVisual}>
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border border-white/10" />
        <div className="absolute -bottom-20 -left-16 h-56 w-56 rounded-full border border-white/10" />
        <div className={UI.challengeVisualIcon}>
          <Icon name={meta.icon} className="h-14 w-14 sm:h-20 sm:w-20" />
        </div>
        <span className={UI.challengeBadge}>
          <Icon name="clipboard-check" className="h-4 w-4" /> {meta.label}
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-5 p-5 sm:p-8 lg:p-10">
        <div>
          <span className={UI.quizKicker}>Today's challenge</span>
          <h2 className={`${UI.sectionHeadingTitle} mt-3 break-words`}>{challenge.title}</h2>
          <p className="mt-3 text-base leading-7 text-muted">{challenge.description}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className={UI.challengeMeta}>
            <Icon name="book-open" className="mt-0.5 h-5 w-5 shrink-0 text-primary-700" />
            <div className="min-w-0">
              <p className={UI.challengeMetaLabel}>Learning area</p>
              <p className={UI.challengeMetaValue}>{challenge.unit_name || 'Selected learning area'}</p>
            </div>
          </div>
          <div className={UI.challengeMeta}>
            <Icon name="list-check" className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
            <div>
              <p className={UI.challengeMetaLabel}>Tasks</p>
              <p className={UI.challengeMetaValue}>{targetCount} {targetCount === 1 ? 'task' : 'tasks'}</p>
            </div>
          </div>
          <div className={UI.challengeMeta}>
            <Icon name="star" className="mt-0.5 h-5 w-5 shrink-0 text-secondary-700" />
            <div>
              <p className={UI.challengeMetaLabel}>Reward</p>
              <p className={UI.challengeMetaValue}>+{challenge.reward_xp} XP</p>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-3 text-sm">
            <span className="font-medium text-muted">{completed ? 'Challenge completed' : 'Your progress'}</span>
            <span className="font-bold tabular-nums text-primary-950">{Math.round(progress)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-primary-600 transition-all duration-500" style={{ width: progress + '%' }} />
          </div>
        </div>

        <button type="button" onClick={() => onOpen(meta.route, challenge.id)} className={`${UI.primaryButton} w-full sm:w-auto sm:self-start`}>
          {completed ? 'Review your challenge' : 'Start your challenge'}
          <Icon name="arrow-right" className="h-5 w-5" />
        </button>
      </div>
    </article>
  );
}

function EmptyState({ onScope }) {
  return (
    <div className={UI.challengeEmptyCard}>
      <StorysetIllustration name="onlineTest" alt="Learner preparing for a challenge" className="mb-5 w-full max-w-[220px] object-contain" />
      <span className={UI.quizKicker}>Daily challenge</span>
      <h2 className={`${UI.sectionHeadingTitle} mt-2`}>Your next challenge isn’t ready yet</h2>
      <p className="mt-3 text-base leading-7 text-muted">We couldn’t prepare a challenge for your selected programme just yet. Check your learning level and topic, then try again.</p>
      <button type="button" onClick={onScope} className={`${UI.secondaryButton} mt-6`}>Check learning level</button>
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
    return <main className="flex min-h-[60vh] items-center justify-center bg-background px-4 py-12"><Spinner size="lg" /></main>;
  }

  if (!data?.challenge) {
    return <main className="min-h-screen bg-background px-4 py-10 sm:px-6"><EmptyState onScope={() => navigate('/settings/scope')} /></main>;
  }

  return (
    <main className="min-h-screen bg-background">
      <PageHeader
        label="AliverBiopharm challenges"
        title="Your daily challenge"
        subtitle="Build your skills with a short challenge matched to your selected programme and recent progress."
        className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8"
      />
      {(data.scope?.level_name || data.scope?.group_name) && (
        <div className="mx-auto mb-7 flex w-full max-w-7xl flex-wrap gap-2 px-4 sm:px-6 lg:px-8">
          {[data.scope.level_name, data.scope.group_name].filter(Boolean).map((label, index) => (
            <span key={index} className="inline-flex max-w-full items-center rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-slate-700">{label}</span>
          ))}
        </div>
      )}
      <section className="w-full bg-secondary-50 py-6 sm:py-8">
        <div className={UI.container}>
          <ChallengeCard challenge={data.challenge} onOpen={(route, id) => navigate(route + '?challenge_id=' + encodeURIComponent(id))} />
        </div>
      </section>
    </main>
  );
}
