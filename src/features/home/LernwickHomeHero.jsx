import { Link } from 'react-router-dom';
import { Icon } from '../../design-system.jsx';

const defaultBenefits = [
  { title: 'Learn', detail: 'Step-by-step' },
  { title: 'Test', detail: 'Your knowledge' },
  { title: 'Track', detail: 'Your progress' },
  { title: 'Reach', detail: 'Your goals' }
];

const heroBackgroundImage = 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=2400&q=85';

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
    <section
      className="relative isolate w-full overflow-hidden bg-slate-950"
      aria-labelledby="ab-home-hero-title"
    >
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: `url("${heroBackgroundImage}")`, backgroundPosition: 'center 42%' }}
        role="img"
        aria-label="Students collaborating while studying together"
      />
      <div className="absolute inset-0 -z-10 bg-slate-950/65" aria-hidden="true" />

      <div className="mx-auto flex min-h-[680px] w-full max-w-7xl flex-col justify-center px-5 py-16 sm:min-h-[720px] sm:px-8 sm:py-20 lg:min-h-[760px] lg:px-12 lg:py-24">
        {name && (
          <p className="mb-4 text-sm font-semibold text-white/90">
            Welcome back, {name}
          </p>
        )}

        <h1
          id="ab-home-hero-title"
          className="max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-white sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {headingLead}
          <span className="mt-2 block text-secondary-300">{headingAccent}</span>
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-white/90 sm:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-700 bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            to={primaryHref}
          >
            {primaryLabel}
            <Icon name="arrowUpRight" size="sm" aria-hidden="true" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/80 bg-white px-5 py-3 text-sm font-bold text-primary-900 transition hover:-translate-y-0.5 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            to={secondaryHref}
          >
            {secondaryLabel}
          </Link>
        </div>

        <div
          className="mt-10 grid max-w-5xl grid-cols-2 gap-x-5 gap-y-5 border-t border-white/35 pt-6 sm:grid-cols-4"
          aria-label="Learning benefits"
        >
          {benefits.map((benefit, index) => (
            <div className="min-w-0" key={benefit.id || benefit.title || index}>
              <strong className="block text-sm font-bold text-white">{benefit.title}</strong>
              <span className="mt-1 block text-xs leading-5 text-white/80">{benefit.detail}</span>
            </div>
          ))}
        </div>

        {learningPath && (
          <p className="mt-6 text-sm text-white/85">
            Your current programme:{' '}
            <strong className="font-semibold text-white">{learningPath}</strong>
          </p>
        )}
      </div>
    </section>
  );
}
