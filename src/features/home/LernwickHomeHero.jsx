import { Link } from 'react-router-dom';
import './lernwick-home-hero.css';

const defaultBenefits = [
  { title: 'Learn', detail: 'Step-by-Step' },
  { title: 'Test', detail: 'Your Knowledge' },
  { title: 'Track', detail: 'Your Progress' },
  { title: 'Reach', detail: 'Your Goals' }
];

export default function LernwickHomeHero({
  user,
  activeLevelName,
  activeGroupName,
  activeGroupId,
  heroContent = {}
}) {
  const name = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  const learningPath = [activeLevelName, activeGroupName].filter(Boolean).join(' · ');
  const curriculumHref = activeGroupId
    ? `/curriculum/${encodeURIComponent(activeGroupId)}`
    : '/resources';

  const eyebrow = heroContent.eyebrow || 'Aliver Biopharma';
  const headingLead = heroContent.headingLead || 'Study Smarter.';
  const headingAccent = heroContent.headingAccent || 'Achieve More.';
  const description = heroContent.description
    || 'Expert learning resources, structured curriculum and powerful tools to help you master biopharma and beyond.';
  const benefits = Array.isArray(heroContent.benefits) && heroContent.benefits.length
    ? heroContent.benefits
    : defaultBenefits;
  const primaryLabel = heroContent.primaryLabel || 'Browse Curriculum';
  const secondaryLabel = heroContent.secondaryLabel || 'Explore Resources';
  const primaryHref = heroContent.primaryHref || curriculumHref;
  const secondaryHref = heroContent.secondaryHref || '/resources';
  const imageSrc = heroContent.imageSrc || '/images/aliver-hero-student.webp';
  const imageAlt = heroContent.imageAlt || 'A smiling Black female healthcare student in a white coat';

  return (
    <section className="ab-home-hero" aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-main">
        <div className="ab-home-hero-copy">
          <p className="ab-home-hero-brand">{eyebrow}</p>
          {name && <p className="ab-home-hero-welcome">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title">
            {headingLead}
            <span>{headingAccent}</span>
          </h1>

          <p className="ab-home-hero-description">{description}</p>

          <div className="ab-home-hero-benefits" aria-label="Learning benefits">
            {benefits.map((benefit, index) => (
              <div className="ab-home-hero-benefit" key={benefit.id || benefit.title || index}>
                <strong>{benefit.title}</strong>
                <span>{benefit.detail}</span>
              </div>
            ))}
          </div>

          <div className="ab-home-hero-actions">
            <Link className="ab-home-hero-primary" to={primaryHref}>
              {primaryLabel}
            </Link>
            <Link className="ab-home-hero-secondary" to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          {learningPath && (
            <p className="ab-home-hero-path">
              Your current programme: <strong>{learningPath}</strong>
            </p>
          )}
        </div>

        <div className="ab-home-hero-visual" aria-label="Student portrait">
          <svg className="ab-home-hero-clip-defs" aria-hidden="true" focusable="false">
            <defs>
              <clipPath id="ab-home-hero-drop-clip" clipPathUnits="objectBoundingBox">
                <path d="M .5 0 C .62 .12 .98 .36 .98 .62 C .98 .83 .77 .98 .5 1 C .23 .98 .02 .83 .02 .62 C .02 .36 .38 .12 .5 0 Z" />
              </clipPath>
            </defs>
          </svg>
          <div className="ab-home-hero-photo-frame">
            <img
              className="ab-home-hero-student"
              src={imageSrc}
              alt={imageAlt}
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.hidden = true;
                event.currentTarget.closest('.ab-home-hero-photo-frame')?.classList.add('is-image-missing');
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
