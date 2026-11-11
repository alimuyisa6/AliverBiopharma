import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const heroImage = 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=1200&h=1300&fit=crop';

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName, activeGroupId }) {
  const name = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  const learningPath = [activeLevelName, activeGroupName].filter(Boolean).join(' · ');
  const curriculumHref = activeGroupId
    ? `/curriculum/${encodeURIComponent(activeGroupId)}`
    : '/resources';

  return (
    <section className="ab-home-hero" aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-glow ab-home-hero-glow-one" aria-hidden="true" />
      <div className="ab-home-hero-glow ab-home-hero-glow-two" aria-hidden="true" />

      <div className="ab-home-hero-main">
        <div className="ab-home-hero-copy">
          <div className="ab-home-hero-kicker">
            <span className="ab-home-hero-kicker-mark"><Icon name="microscope" /></span>
            <span>Biology and pharmaceutical science</span>
          </div>

          <p className="ab-home-hero-welcome">
            {name ? `Welcome back, ${name}` : 'A smarter way to study life sciences'}
          </p>

          <h1 id="ab-home-hero-title">
            Understand deeply.
            <span>Remember confidently.</span>
            Apply knowledge.
          </h1>

          <p className="ab-home-hero-description">
            Move from understanding a concept to using it with confidence. Study through curriculum-linked lessons, notes, active recall and focused question practice, all connected to your learning programme.
          </p>

          <div className="ab-home-hero-actions">
            <Link className="ab-home-hero-primary" to={activeGroupId ? curriculumHref : "/resources"}>
              {activeGroupId ? 'Continue to your curriculum' : 'Explore learning resources'}
              <span><Icon name="arrow-right" /></span>
            </Link>
            <a className="ab-home-hero-secondary" href="#how">
              <span className="ab-home-hero-play"><Icon name="play" /></span>
              See how it works
            </a>
          </div>

          {learningPath && (
            <div className="ab-home-hero-path">
              <span className="ab-home-hero-path-icon"><Icon name="graduation-cap" /></span>
              <span>Your selected programme</span>
              <strong>{learningPath}</strong>
            </div>
          )}

          <div className="ab-home-hero-trust">
            <div className="ab-home-hero-trust-item">
              <span className="ab-home-hero-trust-icon"><Icon name="book-open" /></span>
              <span><strong>Curriculum-led</strong><small>Study by topic and unit</small></span>
            </div>
            <div className="ab-home-hero-trust-divider" aria-hidden="true" />
            <div className="ab-home-hero-trust-item">
              <span className="ab-home-hero-trust-icon"><Icon name="brain" /></span>
              <span><strong>Active recall</strong><small>Make knowledge stick</small></span>
            </div>
            <div className="ab-home-hero-trust-divider" aria-hidden="true" />
            <div className="ab-home-hero-trust-item">
              <span className="ab-home-hero-trust-icon"><Icon name="clipboard-check" /></span>
              <span><strong>Exam practice</strong><small>Build confidence</small></span>
            </div>
          </div>
        </div>

        <div className="ab-home-hero-visual" aria-label="A student studying with digital learning resources">
          <div className="ab-home-hero-visual-orbit ab-home-hero-visual-orbit-one" aria-hidden="true" />
          <div className="ab-home-hero-visual-orbit ab-home-hero-visual-orbit-two" aria-hidden="true" />
          <div className="ab-home-hero-image-frame">
            <img src={heroImage} alt="Student focused on studying at a desk" width="1200" height="1300" fetchPriority="high" />
            <div className="ab-home-hero-image-shade" />
            <div className="ab-home-hero-image-caption">
              <span className="ab-home-hero-caption-icon"><Icon name="atom" /></span>
              <span><strong>Learn beyond memorising</strong><small>Connect concepts to understanding</small></span>
            </div>
          </div>

          <div className="ab-home-hero-floating-card ab-home-hero-progress-card">
            <span className="ab-home-hero-card-icon"><Icon name="chart-no-axes-combined" /></span>
            <span className="ab-home-hero-card-copy"><strong>Progress with purpose</strong><small>One step at a time</small></span>
            <span className="ab-home-hero-card-check"><Icon name="check" /></span>
          </div>

          <div className="ab-home-hero-floating-card ab-home-hero-recall-card">
            <span className="ab-home-hero-recall-symbol"><Icon name="brain" /></span>
            <span className="ab-home-hero-card-copy"><strong>BioRecall</strong><small>Review. Remember. Improve.</small></span>
          </div>

          <div className="ab-home-hero-orbit-label"><Icon name="dna" /> Life sciences</div>
        </div>
      </div>

      <div className="ab-home-hero-bottom">
        <span className="ab-home-hero-bottom-label">Learning pathways</span>
        <div className="ab-home-hero-programmes">
          <span><Icon name="flask-conical" /> O-Level Biology</span>
          <span><Icon name="dna" /> A-Level Biology</span>
          <span><Icon name="pill" /> Pharmacy programmes</span>
        </div>
        <Link to={curriculumHref} className="ab-home-hero-bottom-link">{activeGroupId ? 'Open your curriculum' : 'Find your starting point'} <Icon name="arrow-up-right" /></Link>
      </div>
    </section>
  );
}
