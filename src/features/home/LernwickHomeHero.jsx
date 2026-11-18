import { Link } from 'react-router-dom';

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
  const imageSrc = heroContent.imageSrc || '/images/aliver-hero-student-drop.webp';
  const imageAlt = heroContent.imageAlt || 'A smiling Black female healthcare student in a white coat';

  return (
    <section className="w-full overflow-hidden bg-primary-50 text-foreground" aria-labelledby="ab-home-hero-title">
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12 lg:py-24">
        <div className="order-2 min-w-0 lg:order-1">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.18em] text-secondary-700">{eyebrow}</p>
          {name && <p className="mb-3 text-sm font-semibold text-primary-700">Welcome back, {name}</p>}

          <h1 id="ab-home-hero-title" className="max-w-2xl text-4xl font-bold leading-[1.08] tracking-tight text-primary-900 sm:text-5xl lg:text-6xl">
            {headingLead}
            <span className="mt-1 block text-secondary-600">{headingAccent}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-base leading-8 text-slate-700 sm:text-lg">{description}</p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Learning benefits">
            {benefits.map((benefit, index) => (
              <div className="flex min-h-24 flex-col justify-center rounded-xl border border-primary-100 bg-white px-4 py-4 shadow-sm" key={benefit.id || benefit.title || index}>
                <strong className="text-base font-bold text-primary-900">{benefit.title}</strong>
                <span className="mt-1 text-xs font-medium text-slate-600">{benefit.detail}</span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary-600 px-6 py-3 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-primary-700" to={primaryHref}>
              {primaryLabel}
            </Link>
            <Link className="inline-flex min-h-12 items-center justify-center rounded-xl border border-primary-300 bg-white px-6 py-3 text-sm font-bold text-primary-800 transition hover:border-primary-500 hover:bg-primary-100" to={secondaryHref}>
              {secondaryLabel}
            </Link>
          </div>

          {learningPath && (
            <p className="mt-6 text-sm text-slate-600">
              Your current programme: <strong>{learningPath}</strong>
            </p>
          )}
        </div>

        <div className="order-1 mx-auto w-full max-w-xl lg:order-2">
          <div className="ab-home-hero-photo-frame relative min-h-[320px] overflow-hidden rounded-[2rem] border-[10px] border-white bg-primary-100 shadow-2xl shadow-primary-900/15 sm:min-h-[440px]">
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
          </div>
        </div>
      </div>
    </section>
  );
}
