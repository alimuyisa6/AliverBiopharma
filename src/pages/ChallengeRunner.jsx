import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { getPersonalizedDailyChallenge } from '../api/client';
import ThreeDButton from '../components/buttons/ThreeDButton';

const META = {
  recall: { title: 'Recall practice', tone: 'primary', icon: 'brain', route: '/recall' },
  flashcards: { title: 'Flashcard practice', tone: 'secondary', icon: 'layers', route: '/flashcards' },
  quiz: { title: 'Quiz practice', tone: 'primary', icon: 'clipboard-check', route: '/quiz' }
};

export default function ChallengeRunner({ forcedType }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const challengeId = params.get('challenge_id');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const routeParams = useParams();
  const type = forcedType || routeParams.type;
  const meta = META[type] || META.quiz;
  const heroToneClass = meta.tone === 'secondary' ? 'bg-secondary-800' : 'bg-primary-900';

  useEffect(() => {
    getPersonalizedDailyChallenge().then((result) => {
      const challenge = result?.challenge;
      if (!challenge) throw new Error('No daily challenge is available yet. Return to the challenges page and try again.');
      if (challengeId && challenge.id !== challengeId) throw new Error('This challenge is no longer active. Return to the challenges page to see your current challenge.');
      if ((challenge.challenge_type || challenge.type) !== type) throw new Error('This challenge uses a different study mode. Choose the matching challenge to continue.');
      setData(result);
    }).catch((e) => setError(e.message || "We couldn't load this challenge. Please try again.")).finally(() => setLoading(false));
  }, [challengeId, type]);

  if (loading) return <main className="flex min-h-[70vh] items-center justify-center bg-primary-50" aria-busy="true"><Spinner size="lg" /></main>;
  if (error) return (
    <main className="min-h-screen bg-primary-50 px-4 py-12 sm:px-6">
      <section className="mx-auto grid max-w-2xl justify-items-center gap-4 rounded-3xl border border-border bg-white p-7 text-center shadow-sm sm:p-10" role="alert">
        <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700"><Icon name="circle-exclamation" size="2rem" /></span>
        <h1 className="text-2xl font-extrabold text-primary-900">We couldn’t open this challenge</h1>
        <p className="max-w-xl text-sm leading-7 text-muted">{error}</p>
        <button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-800 px-5 py-3 text-sm font-bold text-white hover:bg-primary-900" onClick={() => navigate('/challenges')}>Back to challenges</button>
      </section>
    </main>
  );

  return (
    <main className="min-h-screen bg-background">
      <section className={`w-full ${heroToneClass} px-5 py-12 text-white sm:px-8 sm:py-16`}>
        <div className="mx-auto grid w-full max-w-7xl items-center gap-8 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
          <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-full border border-white/20 bg-white/10 text-secondary-200 shadow-xl sm:h-48 sm:w-48"><Icon name={meta.icon} size="5rem" /></div>
          <div className="min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold uppercase tracking-wide text-primary-100"><Icon name={meta.icon} />{meta.title}</span>
            <h1 className="mt-5 text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">{data.challenge.title}</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-primary-100">{data.challenge.description}</p>
            <div className="mt-6 flex flex-wrap gap-2">{[data.scope?.level_name || 'Selected level', data.scope?.group_name || 'Selected curriculum', `+${data.challenge.reward_xp} XP`].map((fact) => <span key={fact} className="rounded-full border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white">{fact}</span>)}</div>
            <div className="mt-7 max-w-2xl rounded-2xl border border-white/15 bg-white/10 p-4"><strong className="block text-sm font-bold text-white">How it works</strong><p className="mt-2 text-sm leading-6 text-primary-100">Complete this activity in {type} practice. Your result is checked before your XP reward is added.</p></div>
            <div className="mt-7 flex flex-wrap gap-3"><ThreeDButton variant="solid" iconRight="arrow-right" onClick={() => navigate(meta.route + '?unit_id=' + encodeURIComponent(data.challenge.unit_id) + '&challenge_id=' + encodeURIComponent(data.challenge.id))}>Start challenge</ThreeDButton><button type="button" className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/30 bg-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20" onClick={() => navigate('/challenges')}>Back to challenges</button></div>
          </div>
        </div>
      </section>
    </main>
  );
}
