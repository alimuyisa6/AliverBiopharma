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
      className="w-full overflow-hidden bg-white"
      aria-labelledby="ab-home-hero-title"
    >
      <div className="mx-auto w-full max-w-7xl px-5 pb-10 pt-14 sm:px-8 sm:pb-12 sm:pt-20 lg:px-12 lg:pb-14 lg:pt-24">
        {name && (
          <p className="mb-4 text-sm font-semibold text-primary-700">
            Welcome back, {name}
          </p>
        )}

        <h1
          id="ab-home-hero-title"
          className="max-w-4xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-primary-900 sm:text-5xl lg:text-6xl xl:text-7xl"
        >
          {headingLead}
          <span className="mt-2 block text-secondary-600">{headingAccent}</span>
        </h1>

        <p className="mt-6 max-w-3xl text-base leading-8 text-slate-700 sm:text-lg">
          {description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-900 bg-primary-900 px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700"
            to={primaryHref}
          >
            {primaryLabel}
            <Icon name="arrowUpRight" size="sm" aria-hidden="true" />
          </Link>
          <Link
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-primary-200 bg-white px-5 py-3 text-sm font-bold text-primary-900 transition hover:-translate-y-0.5 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-700"
            to={secondaryHref}
          >
            {secondaryLabel}
          </Link>
        </div>

        <div
          className="mt-9 grid grid-cols-2 gap-x-5 gap-y-4 border-t border-slate-200 pt-6 sm:grid-cols-4"
          aria-label="Learning benefits"
        >
          {benefits.map((benefit, index) => (
            <div className="min-w-0" key={benefit.id || benefit.title || index}>
              <strong className="block text-sm font-bold text-primary-900">{benefit.title}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{benefit.detail}</span>
            </div>
          ))}
        </div>

        {learningPath && (
          <p className="mt-6 text-sm text-slate-600">
            Your current programme:{' '}
            <strong className="font-semibold text-primary-900">{learningPath}</strong>
          </p>
        )}
      </div>

      <div
        className="h-[300px] w-full bg-cover bg-center sm:h-[420px] lg:h-[520px]"
        style={{ backgroundImage: `url("${heroBackgroundImage}")`, backgroundPosition: 'center 42%' }}
        role="img"
        aria-label="Students collaborating while studying together"
      />
    </section>
  );
}
