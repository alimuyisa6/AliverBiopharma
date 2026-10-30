import { Star } from 'lucide-react';
import './lernwick-testimonials.css';

function getInitials(name = '') {
  return name.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || 'AB';
}

export function TestimonialSlider({ quotes = [] }) {
  if (!Array.isArray(quotes) || quotes.length === 0) return null;

  return (
    <section className="section lernwick-testimonials" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="lernwick-section-heading lernwick-section-heading--center">
          <div>
            <p className="lernwick-note">Learner feedback</p>
            <h2 id="testimonials-heading">Experiences shared by our learners</h2>
          </div>
        </div>
        <div className="lernwick-testimonial-grid">
          {quotes.slice(0, 6).map((quote, index) => {
            const name = quote.name || quote.author || 'AliverBiopharm learner';
            const content = quote.content || quote.text || '';
            const role = quote.role || quote.program || '';
            const avatar = quote.avatar || quote.avatar_url || '';
            const rating = Math.max(0, Math.min(5, Number(quote.rating) || 0));
            if (!content) return null;

            return (
              <figure className={`lernwick-testimonial-card lernwick-testimonial-card--${index % 2 ? 'sage' : 'peach'}`} key={quote.id || `${name}-${index}`}>
                <span className="lernwick-testimonial-mark" aria-hidden="true">“</span>
                <blockquote>{content}</blockquote>
                {rating > 0 && <div className="lernwick-testimonial-rating" aria-label={`Rated ${rating} out of 5`}>{Array.from({ length: rating }, (_, star) => <Star key={star} aria-hidden="true" />)}</div>}
                <figcaption>
                  {avatar ? <img src={avatar} alt="" loading="lazy" /> : <span className="lernwick-testimonial-initials" aria-hidden="true">{getInitials(name)}</span>}
                  <span><strong>{name}</strong>{role && <small>{role}</small>}</span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
