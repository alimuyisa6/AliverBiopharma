import { Icon } from '../../design-system.jsx';

function getInitials(name = '') {
  return name.trim().split(/\\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AB';
}

export function TestimonialSlider({ quotes = [] }) {
  if (!Array.isArray(quotes) || quotes.length === 0) return null;

  return (
    <section className="w-full bg-slate-100 px-5 py-16 sm:px-8 sm:py-20 lg:px-12" aria-labelledby="testimonials-heading">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto mb-10 max-w-3xl text-center">
          <h2 id="testimonials-heading" className="text-3xl font-bold text-primary-900 sm:text-4xl">Experiences shared by our learners</h2>
        </header>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {quotes.slice(0, 6).map((quote, index) => {
            const name = quote.name || quote.author || 'AliverBiopharm learner';
            const content = quote.content || quote.text || '';
            const role = quote.role || quote.program || '';
            const avatar = quote.avatar || quote.avatar_url || '';
            const rating = Math.max(0, Math.min(5, Number(quote.rating) || 0));
            if (!content) return null;
            return (
              <figure className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={quote.id || `${name}-${index}`}>
                <span className="text-5xl font-bold leading-none text-secondary-400" aria-hidden="true">“</span>
                <blockquote className="mt-3 flex-1 text-base leading-7 text-slate-700">{content}</blockquote>
                {rating > 0 && <div className="mt-5 flex gap-1 text-secondary-500" aria-label={`Rated ${rating} out of 5`}>{Array.from({ length: rating }, (_, star) => <Icon key={star} name="star" size={16} className="fill-current" aria-hidden="true" />)}</div>}
                <figcaption className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
                  {avatar ? <img src={avatar} alt="" className="h-11 w-11 rounded-full object-cover" loading="lazy" /> : <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-800" aria-hidden="true">{getInitials(name)}</span>}
                  <span className="flex min-w-0 flex-col"><strong className="truncate text-sm font-bold text-primary-900">{name}</strong>{role && <small className="mt-0.5 text-xs text-slate-500">{role}</small>}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
