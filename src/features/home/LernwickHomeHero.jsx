import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const learningStages = [
  {
    number: '01',
    label: 'LEARN',
    title: 'Build understanding',
    description: 'Curriculum-linked lessons and study notes.',
    icon: 'book-open',
    tone: 'learn'
  },
  {
    number: '02',
    label: 'REMEMBER',
    title: 'Strengthen recall',
    description: 'Flashcards and focused recall practice.',
    icon: 'brain',
    tone: 'remember'
  },
  {
    number: '03',
    label: 'ASSESS',
    title: 'Check your knowledge',
    description: 'Topic questions and examination practice.',
    icon: 'clipboard-check',
    tone: 'assess'
  },
  {
    number: '04',
    label: 'PROGRESS',
    title: 'Know what comes next',
    description: 'Review your progress and revisit weak areas.',
    icon: 'chart-line',
    tone: 'progress'
  }
];

export default function LernwickHomeHero({
  user,
  activeLevelName,
  activeGroupName,
  activeGroupId
}) {
  const name =
    user?.user_metadata?.full_name ||
    user?.profile?.full_name ||
    user?.email?.split('@')[0];

  const learningPath = [activeLevelName, activeGroupName]
    .filter(Boolean)
    .join(' · ');

  const curriculumHref = activeGroupId
    ? `/curriculum/${encodeURIComponent(activeGroupId)}`
    : '/resources';

  return (
    <section className="ab-home-hero" aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-main">
        <div className="ab-home-hero-copy">
          <div className="ab-home-hero-kicker">
            <span className="ab-home-hero-kicker-mark">
              <Icon name="microscope" />
            </span>
            <span>ALIVER BIOPHARMA · LEARN WITH PURPOSE</span>
          </div>

          <p className="ab-home-hero-welcome">
            {name ? `Welcome back, ${name}` : 'A clearer way to learn Biology and Pharmacy'}
          </p>

          <h1 id="ab-home-hero-title">
            Understand deeply.
            <span>Remember confidently.</span>
            Apply knowledge.
          </h1>

          <p className="ab-home-hero-description">
            Learn through curriculum-linked lessons, clear study notes, active
            recall and focused assessments. Move from understanding a concept
            to using it with confidence.
          </p>

          <div className="ab-home-hero-actions">
            <Link className="ab-home-hero-primary" to="/resources">
              Explore learning resources
              <span><Icon name="arrow-right" /></span>
            </Link>
            <Link className="ab-home-hero-secondary" to={curriculumHref}>
              <span className="ab-home-hero-secondary-icon">
                <Icon name="book-open" />
              </span>
              {activeGroupId ? 'Continue to your curriculum' : 'Browse the curriculum'}
            </Link>
          </div>

          {learningPath && (
            <div className="ab-home-hero-path">
              <span className="ab-home-hero-path-icon">
                <Icon name="graduation-cap" />
              </span>
              <span>Your learning programme</span>
              <strong>{learningPath}</strong>
            </div>
          )}

          <ul className="ab-home-hero-trust" aria-label="Aliver learning features">
            <li><Icon name="circle-check" /><span>Curriculum aligned</span></li>
            <li><Icon name="circle-check" /><span>Active recall</span></li>
            <li><Icon name="circle-check" /><span>Progress focused</span></li>
          </ul>
        </div>

        <div className="ab-home-hero-visual" aria-label="The Aliver learning process">
          <div className="ab-home-hero-visual-panel">
            <div className="ab-home-hero-visual-heading">
              <span>THE ALIVER LEARNING PATH</span>
              <span>01 — 04</span>
            </div>

            <div className="ab-home-hero-flow">
              {learningStages.map((stage) => (
                <div
                  className={`ab-home-hero-flow-card ab-home-hero-flow-card--${stage.tone}`}
                  key={stage.number}
                >
                  <span className="ab-home-hero-flow-number">{stage.number}</span>
                  <span className="ab-home-hero-flow-icon">
                    <Icon name={stage.icon} />
                  </span>
                  <span className="ab-home-hero-flow-copy">
                    <small>{stage.label}</small>
                    <strong>{stage.title}</strong>
                    <span>{stage.description}</span>
                  </span>
                  <Icon name="arrow-right" />
                </div>
              ))}
            </div>

            <div className="ab-home-hero-visual-footer">
              <span className="ab-home-hero-visual-footer-mark">
                <Icon name="check" />
              </span>
              <span>
                <strong>One connected learning experience</strong>
                <small>Learn · Practise · Review · Progress</small>
              </span>
            </div>
          </div>

          <span className="ab-home-hero-orbit-label">
            <Icon name="atom" />
            Biology & pharmaceutical science
          </span>
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
          {activeGroupId ? 'Open your learning path' : 'Find your starting point'}
          <Icon name="arrow-right" />
        </Link>
      </div>
    </section>
  );
}
