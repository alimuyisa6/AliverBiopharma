import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const learningStages = [
  { number: '01', title: 'Topic / Course Unit', detail: 'Choose your curriculum starting point', icon: 'book-open' },
  { number: '02', title: 'Sub-unit', detail: 'Narrow the area you are studying', icon: 'layer-group' },
  { number: '03', title: 'Theme', detail: 'Focus on a connected concept', icon: 'atom' },
  { number: '04', title: 'Lesson', detail: 'Open the lesson and its resources', icon: 'graduation-cap', current: true }
];

const lessonResources = [
  { label: 'Notes', icon: 'book-open' },
  { label: 'Flashcards', icon: 'layers' },
  { label: 'Quizzes', icon: 'clipboard-check' },
  { label: 'Recall', icon: 'brain' },
  { label: 'Past papers', icon: 'file-lines' }
];

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName, activeGroupId }) {
  const name = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  const learningPath = [activeLevelName, activeGroupName].filter(Boolean).join(' · ');
  const curriculumHref = activeGroupId
    ? `/curriculum/${encodeURIComponent(activeGroupId)}`
    : '/resources';

  return (
    <section className="ab-home-hero" aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-main">
        <div className="ab-home-hero-copy">
          <p className="ab-home-hero-kicker">
            <span className="ab-home-hero-kicker-mark"><Icon name="microscope" /></span>
            Biology and pharmaceutical science
          </p>

          <p className="ab-home-hero-welcome">
            {name ? `Welcome back, ${name}` : 'A focused place to learn life sciences'}
          </p>

          <h1 id="ab-home-hero-title">
            Learn the science.
            <span>Understand every step.</span>
            Apply what you know.
          </h1>

          <p className="ab-home-hero-description">
            Follow your curriculum from the first topic or course unit to each lesson. Then move directly into the notes, flashcards, quizzes, recall practice and examination resources connected to what you are studying.
          </p>

          <div className="ab-home-hero-actions">
            <Link className="ab-home-hero-primary" to={curriculumHref}>
              {activeGroupId ? 'Continue your curriculum' : 'Find your learning pathway'}
              <span><Icon name="arrow-right" /></span>
            </Link>
            <a className="ab-home-hero-secondary" href="#how">
              How learning works <Icon name="chevron-down" />
            </a>
          </div>

          {learningPath && (
            <div className="ab-home-hero-path">
              <span className="ab-home-hero-path-icon"><Icon name="graduation-cap" /></span>
              <span>Selected programme</span>
              <strong>{learningPath}</strong>
            </div>
          )}

          <div className="ab-home-hero-proof" aria-label="Learning platform features">
            <span><Icon name="book-open" /> Curriculum-linked learning</span>
            <span><Icon name="brain" /> Active recall</span>
            <span><Icon name="clipboard-check" /> Exam preparation</span>
          </div>
        </div>

        <div className="ab-home-hero-visual" aria-label="Four stages of curriculum learning, followed by lesson resources">
          <div className="ab-home-hero-visual-heading">
            <span className="ab-home-hero-visual-eyebrow">Your learning pathway</span>
            <strong>From curriculum to confident practice</strong>
          </div>

          <ol className="ab-home-hero-stages">
            {learningStages.map((stage) => (
              <li className={stage.current ? 'is-current' : ''} key={stage.number}>
                <span className="ab-home-hero-stage-number">{stage.number}</span>
                <span className="ab-home-hero-stage-icon"><Icon name={stage.icon} /></span>
                <span className="ab-home-hero-stage-copy">
                  <strong>{stage.title}</strong>
                  <small>{stage.detail}</small>
                </span>
                {stage.current && <span className="ab-home-hero-stage-status">Resources</span>}
              </li>
            ))}
          </ol>

          <div className="ab-home-hero-resource-panel">
            <div className="ab-home-hero-resource-heading">
              <span><Icon name="bookmark" /></span>
              <div><strong>At the lesson</strong><small>Choose the way you want to study</small></div>
            </div>
            <div className="ab-home-hero-resource-list">
              {lessonResources.map((resource) => (
                <span key={resource.label}><Icon name={resource.icon} /> {resource.label}</span>
              ))}
            </div>
          </div>
          <p className="ab-home-hero-visual-note"><Icon name="circle-check" /> Your resources stay connected to the lesson you open.</p>
        </div>
      </div>

      <div className="ab-home-hero-bottom">
        <span className="ab-home-hero-bottom-label">Explore your programme</span>
        <div className="ab-home-hero-programmes">
          <span><Icon name="microscope" /> O-Level Biology</span>
          <span><Icon name="atom" /> A-Level Biology</span>
          <span><Icon name="capsules" /> Pharmacy programmes</span>
        </div>
        <Link to={curriculumHref} className="ab-home-hero-bottom-link">
          {activeGroupId ? 'Open your curriculum' : 'Browse resources'} <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}
