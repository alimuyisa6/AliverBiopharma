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

  return (
    <section className={UI.hero.section} aria-labelledby="ab-home-hero-title">
      <div className="ab-home-hero-background" aria-hidden="true" />
      <div className="ab-home-hero-vignette" aria-hidden="true" />
      <div className={`${UI.hero.container} ab-home-hero-layout`}>
        <div className="mx-auto w-full max-w-6xl min-w-0 ab-home-hero-copy text-center">
          
          {name && <p className="mb-3 text-sm font-semibold text-primary-700">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title" className={`${UI.hero.heading} mx-auto max-w-5xl`}>
            {headingLead}
            <span className={UI.hero.accent}>{headingAccent}</span>
          </h1>

          <p className={`${UI.hero.description} mx-auto max-w-3xl`}>{description}</p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className={UI.primaryButton} to={primaryHref}>
              {primaryLabel}
              <Icon name="arrowUpRight" size="sm" aria-hidden="true" />
            </Link>
            <Link className={UI.secondaryButton} to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          <div className="mx-auto mt-9 grid w-full max-w-5xl grid-cols-2 gap-x-5 gap-y-4 border-t border-primary-200/80 pt-6 text-center sm:grid-cols-4" aria-label="Learning benefits">
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

      </div>
    </section>
  );
}
