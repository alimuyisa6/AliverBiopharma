import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { getPersonalizedDailyChallenge } from '../api/client';
import './challenge-runner.css';

const META = {
  recall: { title: 'Recall Challenge', eyebrow: 'Active recall mission', color: 'cyan', icon: 'brain', route: '/recall' },
  flashcards: { title: 'Flashcard Challenge', eyebrow: 'Flashcard mastery mission', color: 'amber', icon: 'layers', route: '/flashcards' },
  quiz: { title: 'Quiz Challenge', eyebrow: 'Knowledge check mission', color: 'blue', icon: 'clipboard-check', route: '/quiz' }
};

function Cartoon({ type }) {
  return <div className={"challenge-runner-cartoon cartoon-" + type} aria-hidden="true"><div className="runner-cloud c1" /><div className="runner-cloud c2" /><div className="runner-character"><span className="runner-eye e1" /><span className="runner-eye e2" /><span className="runner-mouth" /><span className="runner-book" /></div><span className="runner-star s1">✦</span><span className="runner-star s2">✦</span></div>;
}

export default function ChallengeRunner({ forcedType }) {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const challengeId = params.get('challenge_id');
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const type = forcedType || useParams().type;
  const meta = META[type] || META.quiz;

  useEffect(() => {
    getPersonalizedDailyChallenge().then((result) => {
      const challenge = result?.challenge;
      if (!challenge) throw new Error('No daily challenge is available.');
      if (challengeId && challenge.id !== challengeId) throw new Error('This challenge is no longer the active daily challenge.');
      if (challenge.challenge_type !== type) throw new Error('This challenge belongs to another learning mode.');
      setData(result);
    }).catch((e) => setError(e.message || 'Unable to load challenge.')).finally(() => setLoading(false));
  }, [challengeId, type]);

  if (loading) return <main className="challenge-runner-page"><div className="challenge-runner-loading"><Spinner size="lg" /></div></main>;
  if (error) return <main className="challenge-runner-page"><section className="challenge-runner-error"><Cartoon type={type} /><span className="eyebrow">Challenge unavailable</span><h1>We could not open this mission</h1><p>{error}</p><button className="btn btn-secondary" onClick={() => navigate('/challenges')}>Back to challenges</button></section></main>;

  return <main className={"challenge-runner-page challenge-runner-" + meta.color}>
    <section className="challenge-runner-hero">
      <div className="challenge-runner-visual"><Cartoon type={type} /><span className="challenge-type-badge"><Icon name={meta.icon} /> {meta.title}</span></div>
      <div className="challenge-runner-copy"><span className="eyebrow">{meta.eyebrow}</span><h1>{data.challenge.title}</h1><p>{data.challenge.description}</p><div className="challenge-runner-facts"><span>{data.scope?.level_name || 'Active level'}</span><span>{data.scope?.group_name || 'Active programme'}</span><span>+{data.challenge.reward_xp} XP</span></div><div className="challenge-runner-note"><strong>How it works</strong><span>Complete the challenge in the existing {type} learning system. Your result is verified by the server before the XP reward is issued.</span></div><div className="challenge-runner-actions"><button className="btn btn-primary" onClick={() => navigate(meta.route + '?challenge_id=' + encodeURIComponent(data.challenge.id))}>Begin mission <Icon name="arrow-right" /></button><button className="btn btn-secondary" onClick={() => navigate('/challenges')}>Back</button></div></div>
    </section>
  </main>;
}
