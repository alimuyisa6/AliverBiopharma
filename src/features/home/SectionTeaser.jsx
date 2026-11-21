import Button from '../../components/Button/Button';

const teaserImages = {
  'live-room': 'https://images.pexels.com/photos/8199770/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop',
  tutor: 'https://images.pexels.com/photos/1181742/pexels-photo-5212700.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop'
};

export function SectionTeaser({
  eyebrow, title, intro, imageUrl, imageAlt, illustrationType, ctaLabel, onCtaClick, imageSide = 'right', backgroundColor = '#F3F6F9'
}) {
  const image = imageUrl || teaserImages[illustrationType];
  const reverse = imageSide === 'left';

  return (
    <section className="w-full px-5 py-16 sm:px-8 sm:py-20 lg:px-12" style={{ backgroundColor }} aria-label={eyebrow || title}>
      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-9 lg:grid-cols-2 lg:gap-14 lg:p-12">
        <div className={`min-w-0 ${reverse ? 'lg:order-2' : ''}`}>
          {eyebrow && <p className="mb-3 text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-700">{eyebrow}</p>}
          <h2 className="max-w-xl text-3xl font-bold leading-tight text-primary-900 sm:text-4xl lg:text-5xl">{title}</h2>
          {intro && <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">{intro}</p>}
          <div className="mt-7">
            <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
          </div>
        </div>
        {image && (
          <div className={`min-w-0 ${reverse ? 'lg:order-1' : ''}`}>
            <div className="overflow-hidden rounded-3xl border-[8px] border-slate-100 bg-slate-100 shadow-xl shadow-primary-900/10">
              <img src={image} alt={imageAlt || ''} className="aspect-[5/4] h-full w-full object-cover" loading="lazy" />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
