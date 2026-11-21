import { Link } from 'react-router-dom';

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

  const eyebrow = heroContent.eyebrow || 'Aliver Biopharma';
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
    <section className="relative isolate w-full overflow-hidden bg-primary-50 text-foreground" aria-labelledby="ab-home-hero-title">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary-50 via-white to-primary-100/70" aria-hidden="true" />
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 sm:py-18 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:px-12 lg:py-24">
        <div className="order-2 min-w-0 lg:order-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/80 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.16em] text-primary-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-secondary-500" aria-hidden="true" />
            {eyebrow}
          </p>
          {name && <p className="mb-3 text-sm font-semibold text-primary-700">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title" className="max-w-2xl text-4xl font-extrabold leading-[1.02] tracking-[-0.04em] text-primary-900 sm:text-5xl lg:text-6xl xl:text-7xl">
            {headingLead}
            <span className="mt-2 block text-primary-600">{headingAccent}</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-8 text-foreground sm:text-lg">{description}</p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary-900/10 transition duration-200 hover:-translate-y-0.5 hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-400" to={primaryHref}>
              {primaryLabel}
              <span aria-hidden="true">↗</span>
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary-200 bg-white/90 px-6 py-3 text-sm font-bold text-primary-800 transition duration-200 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-100" to={secondaryHref}>
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

        <div className="order-1 mx-auto w-full max-w-xl lg:order-2">
          <div className="ab-home-hero-photo-frame relative isolate min-h-[320px] overflow-hidden rounded-[2rem] border border-white/80 bg-primary-100 shadow-2xl shadow-primary-900/10 sm:min-h-[440px]">
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
