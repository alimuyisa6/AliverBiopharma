import { Icon } from '../../design-system.jsx';
import { LiquidCard, CardContent } from './liquid-glass-card';
import { Marquee } from './marquee';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AB';
}

function TestimonialCard({ testimonial }) {
  const name = testimonial.name || testimonial.author || 'AliverBiopharm learner';
  const content = testimonial.content || testimonial.text || '';
  const role = testimonial.role || testimonial.program || '';
  const avatar = testimonial.avatar || testimonial.avatar_url || '';
  const rating = Number.isFinite(Number(testimonial.rating)) ? Math.max(0, Math.min(5, Number(testimonial.rating))) : 0;

  return (
    <LiquidCard className="w-[min(20rem,85vw)] shrink-0">
      <CardContent className="flex flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-center gap-3">
          {avatar ? <img src={avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover" loading="lazy" /> : <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-extrabold text-primary-800" aria-hidden="true">{getInitials(name)}</span>}
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-slate-900">{name}</h3>
            {role && <p className="mt-0.5 text-xs text-slate-500">{role}</p>}
          </div>
        </div>
        <blockquote className="text-sm leading-6 text-slate-700">{content}</blockquote>
        {rating > 0 && (
          <div className="flex items-center gap-1 text-amber-500" aria-label={`Rated ${rating} out of 5`}>
            {Array.from({ length: rating }, (_, index) => <Icon key={index} name="star" size={16} className="fill-current" aria-hidden="true" />)}
          </div>
        )}
      </CardContent>
    </LiquidCard>
  );
}

export function Component({ testimonials = [], className = '' }) {
  if (!Array.isArray(testimonials) || testimonials.length === 0) return null;
  const repeatedTestimonials = testimonials.length === 1 ? [...testimonials, ...testimonials] : testimonials;

  return (
    <div className={['w-full overflow-hidden py-3', className].filter(Boolean).join(' ')}>
      <Marquee pauseOnHover repeat={2} speed="slow" aria-label="Student testimonials">
        {repeatedTestimonials.map((testimonial, index) => (
          <TestimonialCard key={testimonial.id || `${testimonial.author || testimonial.name || 'testimonial'}-${index}`} testimonial={testimonial} />
        ))}
      </Marquee>
    </div>
  );
}

export default Component;
