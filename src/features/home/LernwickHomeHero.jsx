import { Link } from 'react-router-dom';
import './lernwick-home-hero.css';

const learningBenefits = [
  { title: 'Learn', detail: 'Step-by-Step' },
  { title: 'Test', detail: 'Your Knowledge' },
  { title: 'Track', detail: 'Your Progress' },
  { title: 'Reach', detail: 'Your Goals' }
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
          <p className="ab-home-hero-brand">Aliver Biopharma</p>

          {name && <p className="ab-home-hero-welcome">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title">
            Study Smarter.
            <span>Achieve More.</span>
          </h1>

          <p className="ab-home-hero-description">
            Expert learning resources, structured curriculum and powerful tools to help you master biopharma and beyond.
          </p>

          <div className="ab-home-hero-benefits" aria-label="Learning benefits">
            {learningBenefits.map((benefit) => (
              <div className="ab-home-hero-benefit" key={benefit.title}>
                <strong>{benefit.title}</strong>
                <span>{benefit.detail}</span>
              </div>
            ))}
          </div>

          <div className="ab-home-hero-actions">
            <Link className="ab-home-hero-primary" to={curriculumHref}>
              Browse Curriculum
            </Link>
            <Link className="ab-home-hero-secondary" to="/resources">
              Explore Resources
            </Link>
          </div>

          {learningPath && (
            <p className="ab-home-hero-path">
              Your current programme: <strong>{learningPath}</strong>
            </p>
          )}
        </div>

        <div className="ab-home-hero-visual">
          <img
            className="ab-home-hero-student"
            src="/images/aliver-hero-student.jpg"
            alt="A smiling female biopharma student studying in a library"
            fetchPriority="high"
          />
        </div>
      </div>
    </section>
  );
}
