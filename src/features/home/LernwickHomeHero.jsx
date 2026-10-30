import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const HERO_IMAGES = {
  portrait: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=900&h=1000&fit=crop',
  study: 'https://images.pexels.com/photos/8199759/pexels-photo-8199759.jpeg?auto=compress&cs=tinysrgb&w=500&h=560&fit=crop',
  notes: 'https://images.pexels.com/photos/7972949/pexels-photo-7972949.jpeg?auto=compress&cs=tinysrgb&w=500&h=360&fit=crop',
  learning: 'https://images.pexels.com/photos/16420473/pexels-photo-16420473.jpeg?auto=compress&cs=tinysrgb&w=500&h=360&fit=crop'
};

function formatMetric(value) {
  return Number(value || 0).toLocaleString();
}

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName, stats = {} }) {
  const learningPath = [activeLevelName, activeGroupName].filter(Boolean).join(' · ');
  const greeting = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  const courseLabel = learningPath || 'Biology and Pharmacy';
  const metrics = [
    { label: 'Learning resources', value: stats.resources_count },
    { label: 'Recall questions', value: stats.recall_questions },
    { label: 'Total downloads', value: stats.downloads_count }
  ];

  return (
    <section className="lernwick-hero" aria-labelledby="lernwick-hero-title">
      <div className="container lernwick-hero__grid">
        <div className="lernwick-hero__copy">
          <span className="lernwick-hero__vlabel" aria-hidden="true">BIOLOGY · PHARMACY</span>
          <p className="lernwick-hero__note">
            {greeting ? `Welcome back, ${greeting}` : 'A focused place to learn life sciences'}
          </p>
          <h1 id="lernwick-hero-title">
            Learn science.<br />
            <span className="lernwick-hero__highlight">Understand more.</span>
          </h1>
          <p className="lernwick-hero__lede">
            Explore Biology and Pharmacy through structured learning resources, clear explanations, quizzes, flashcards and active recall.
          </p>
          {learningPath && (
            <p className="lernwick-hero__path">
              <Icon name="graduation-cap" />
              <span>Your learning path: <strong>{learningPath}</strong></span>
            </p>
          )}
          <div className="lernwick-hero__ctas">
            <Link className="lernwick-hero__button lernwick-hero__button--primary" to="/resources">
              Explore learning resources <Icon name="arrow-right" />
            </Link>
            <Link className="lernwick-hero__how" to="/classroom">
              <span className="lernwick-hero__play"><Icon name="play" /></span>
              Explore the classroom
            </Link>
          </div>
        </div>

        <div className="lernwick-hero__media">
          <figure className="lernwick-hero__blob">
            <img src={HERO_IMAGES.portrait} alt="Student studying beside a laptop" width="900" height="1000" fetchPriority="high" />
          </figure>
          <span className="lernwick-hero__badge" aria-hidden="true">
            <Icon name="microscope" />
            Biology
          </span>
          <div className="lernwick-hero__feature-card">
            <p className="lernwick-hero__feature-title">{courseLabel}</p>
            <p className="lernwick-hero__feature-detail">
              <span className="lernwick-hero__feature-icon"><Icon name="book-open" /></span>
              <span><strong>Structured learning</strong><small>Resources for your programme</small></span>
            </p>
          </div>
          <div className="lernwick-hero__feature-chip">
            <span className="lernwick-hero__chip-icon"><Icon name="brain" /></span>
            <span><strong>Active recall</strong><small>Strengthen long-term memory</small></span>
          </div>
          <span className="lernwick-hero__vscroll" aria-hidden="true">Explore</span>
        </div>
      </div>

      <div className="container lernwick-hero__lower">
        <div className="lernwick-hero__collage" aria-hidden="true">
          <img src={HERO_IMAGES.study} alt="" width="500" height="560" />
          <img src={HERO_IMAGES.notes} alt="" width="500" height="360" />
          <img src={HERO_IMAGES.learning} alt="" width="500" height="360" />
        </div>
        <Link className="lernwick-hero__process" to="/resources">
          <span className="lernwick-hero__process-icon"><Icon name="play" /></span>
          <span className="lernwick-hero__process-label">LEARN AT YOUR PACE</span>
          <strong>Move from learning to confident understanding.</strong>
          <span className="lernwick-hero__process-go"><Icon name="arrow-right" /></span>
        </Link>
        <dl className="lernwick-hero__metrics">
          {metrics.map((metric) => (
            <div key={metric.label}>
              <dd>{formatMetric(metric.value)}<sup>+</sup></dd>
              <dt>{metric.label}</dt>
            </div>
          ))}
          <div className="lernwick-hero__scope">
            <dd>{activeLevelName || 'All levels'}</dd>
            <dt>{activeGroupName || 'O-Level · A-Level · Pharmacy'}</dt>
          </div>
        </dl>
      </div>
    </section>
  );
}
