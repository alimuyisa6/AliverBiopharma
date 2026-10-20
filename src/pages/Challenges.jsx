import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { getPersonalizedDailyChallenge } from '../api/client';
import './challenges.css';
import ThreeDButton from '../components/buttons/ThreeDButton';

const challengeMeta = {
  recall: { label: 'Recall practice', route: '/challenges/recall', icon: 'brain', accent: 'cyan', animation: 'recall' },
  flashcards: { label: 'Flashcard practice', route: '/challenges/flashcards', icon: 'layers', accent: 'amber', animation: 'flashcards' },
  quiz: { label: 'Quiz practice', route: '/challenges/quiz', icon: 'clipboard-check', accent: 'blue', animation: 'quiz' }
};

function ChallengeCharacter({ type }) {
  const meta = challengeMeta[type] || challengeMeta.quiz;
  return <div className={"challenge-character challenge-character-" + meta.animation} aria-hidden="true">
    <div className="challenge-character-orbit" />
    <div className="challenge-character-body"><div className="challenge-character-face"><span /><span /></div><div className="challenge-character-smile" /></div>
    <div className="challenge-character-book"><span /><span /></div>
    <div className="challenge-character-spark challenge-character-spark-one" />
    <div className="challenge-character-spark challenge-character-spark-two" />
  </div>;
}

function ChallengeCard({ challenge, onOpen }) {
  const type = challenge.challenge_type || challenge.type;
  const targetCount = Number(challenge.target_count ?? challenge.target ?? 0);
  const meta = challengeMeta[type] || challengeMeta.quiz;
  const progress = targetCount ? Math.min(100, (challenge.progress / targetCount) * 100) : 0;
  const completed = challenge.passed === true || challenge.status === 'completed';
  return <article className={"challenge-showcase-card challenge-accent-" + meta.accent}>
    <div className="challenge-showcase-visual"><ChallengeCharacter type={type} /><span className="challenge-showcase-badge"><Icon name={meta.icon} /> {meta.label}</span></div>
    <div className="challenge-showcase-content">
      <span className="eyebrow">Today’s challenge</span><h1>{challenge.title}</h1><p>{challenge.description}</p>
      <div className="challenge-scope"><span>{challenge.unit_name || 'Your selected topic'}</span><span>{targetCount} {targetCount === 1 ? 'task' : 'tasks'}</span><span>+{challenge.reward_xp} XP</span></div>
      <div className="challenge-progress"><div className="challenge-progress-head"><span>{completed ? 'Completed' : 'Your progress'}</span><strong>{Math.round(progress)}%</strong></div><div className="challenge-progress-track"><span style={{ width: progress + '%' }} /></div></div>
      <ThreeDButton type="button" variant="solid" iconRight="arrow-right" className="challenge-open-button" onClick={() => onOpen(meta.route, challenge.id)}>{completed ? 'Review challenge' : 'Start practising'}</ThreeDButton>
    </div>
  </article>;
}

export default function Challenges() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { getPersonalizedDailyChallenge().then(setData).catch(() => setData(null)).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="section challenges-loading"><Spinner size="lg" /></div>;
  if (!data?.challenge) return <div className="section challenges-empty"><div className="challenge-empty-card"><ChallengeCharacter type="quiz" /><span className="eyebrow">Daily challenge</span><h1>Your next challenge isn’t ready yet</h1><p>We couldn’t prepare a challenge for your selected programme just yet. Check your learning level and topic, then try again.</p><button className="btn btn-secondary" type="button" onClick={() => navigate('/settings/scope')}>Check learning level</button></div></div>;
  return <main className="challenges-page"><section className="section challenges-hero"><div className="challenges-heading"><span className="eyebrow">AliverBiopharm challenges</span><h1>Your daily challenge</h1><p>Practise with a short challenge based on your selected programme and recent progress.</p>{data.scope?.level_name && <div className="challenge-context"><span>{data.scope.level_name}</span>{data.scope.group_name && <span>{data.scope.group_name}</span>}</div>}</div><ChallengeCard challenge={data.challenge} onOpen={(route, id) => navigate(route + '?challenge_id=' + encodeURIComponent(id))} /></section></main>;
}
