import { Star } from 'lucide-react';
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
    <LiquidCard className="ab-testimonial-card">
      <CardContent className="ab-testimonial-card__content">
        <div className="ab-testimonial-card__person">
          {avatar ? <img src={avatar} alt="" className="ab-testimonial-card__avatar" loading="lazy" /> : <span className="ab-testimonial-card__avatar ab-testimonial-card__avatar--initials" aria-hidden="true">{getInitials(name)}</span>}
          <div className="ab-testimonial-card__identity">
            <h3>{name}</h3>
            {role && <p>{role}</p>}
          </div>
        </div>
        <blockquote>{content}</blockquote>
        {rating > 0 && (
          <div className="ab-testimonial-card__rating" aria-label={`Rated ${rating} out of 5`}>
            {Array.from({ length: rating }, (_, index) => <Star key={index} aria-hidden="true" />)}
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
    <div className={['ab-testimonial-marquee', className].filter(Boolean).join(' ')}>
      <Marquee pauseOnHover repeat={2} speed="slow" aria-label="Student testimonials">
        {repeatedTestimonials.map((testimonial, index) => (
          <TestimonialCard key={testimonial.id || `${testimonial.author || testimonial.name || 'testimonial'}-${index}`} testimonial={testimonial} />
        ))}
      </Marquee>
    </div>
  );
}

export default Component;
