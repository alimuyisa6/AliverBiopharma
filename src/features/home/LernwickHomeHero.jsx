import { Link } from 'react-router-dom';
import { UI, Icon } from '../../design-system.jsx';

const defaultBenefits = [
  { title: 'Learn', detail: 'Step-by-step' },
  { title: 'Test', detail: 'Your knowledge' },
  { title: 'Track', detail: 'Your progress' },
  { title: 'Reach', detail: 'Your goals' }
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

  const headingLead = heroContent.headingLead || 'Study smarter.';
  const headingAccent = heroContent.headingAccent || 'Achieve more.';
  const description = heroContent.description
    || 'Expert learning resources, a structured curriculum and powerful study tools to help you master biopharma with confidence.';
  const benefits = Array.isArray(heroContent.benefits) && heroContent.benefits.length
    ? heroContent.benefits
    : defaultBenefits;
  const primaryLabel = heroContent.primaryLabel || 'Explore curriculum';
  const secondaryLabel = heroContent.secondaryLabel || 'Browse resources';
  const primaryHref = heroContent.primaryHref || curriculumHref;
  const secondaryHref = heroContent.secondaryHref || '/resources';
  const imageSrc = heroContent.imageSrc || '/images/aliver-hero-student-drop.webp';
  const imageAlt = heroContent.imageAlt || 'A smiling healthcare student in a white coat';

  return (
    <section className={UI.hero.section} aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-background" aria-hidden="true" />
      <div className="ab-home-hero-vignette" aria-hidden="true" />
      <div className={`${UI.hero.container} ab-home-hero-layout`}>
        <div className="order-2 min-w-0 lg:order-1 ab-home-hero-copy">
          
          {name && <p className="mb-3 text-sm font-semibold text-primary-700">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title" className={UI.hero.heading}>
            {headingLead}
            <span className={UI.hero.accent}>{headingAccent}</span>
          </h1>

          <p className={UI.hero.description}>{description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className={UI.primaryButton} to={primaryHref}>
              {primaryLabel}
              <Icon name="arrowUpRight" size="sm" aria-hidden="true" />
            </Link>
            <Link className={UI.secondaryButton} to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-primary-200/80 pt-6 sm:grid-cols-4" aria-label="Learning benefits">
            {benefits.map((benefit, index) => (
              <div className="min-w-0" key={benefit.id || benefit.title || index}>
                <strong className="block text-sm font-bold text-primary-900">{benefit.title}</strong>
                <span className="mt-1 block text-xs leading-5 text-muted">{benefit.detail}</span>
              </div>
            ))}
          </div>

          {learningPath && (
            <p className="mt-6 text-sm text-muted">
              Your current programme: <strong className="font-semibold text-primary-800">{learningPath}</strong>
            </p>
          )}
        </div>

        <div className="order-1 mx-auto w-full max-w-xl lg:order-2 ab-home-hero-student">
          <div className={`ab-home-hero-photo-frame ${UI.hero.imageFrame}`}>
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-primary-900/10 via-transparent to-white/20" aria-hidden="true" />
            <img
              className="aspect-[4/5] h-full w-full object-cover object-center"
              src={imageSrc}
              alt={imageAlt}
              fetchPriority="high"
              onError={(event) => {
                event.currentTarget.hidden = true;
                event.currentTarget.closest('.ab-home-hero-photo-frame')?.classList.add('is-image-missing');
              }}
            />
            <div className="pointer-events-none absolute bottom-5 left-5 z-20 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-6 sm:left-6" aria-hidden="true">
              <span className="block text-xs font-semibold uppercase tracking-wider text-primary-600">Learn with purpose</span>
              <span className="mt-1 block text-sm font-bold text-primary-900">Build knowledge. Grow confidence.</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
