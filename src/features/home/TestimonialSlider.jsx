import { Component as MarqueeTestimonials } from '../../components/ui/marquee-card';
import '../../styles/testimonials.css';

export function TestimonialSlider({ quotes = [] }) {
  if (!Array.isArray(quotes) || quotes.length === 0) return null;

  return (
    <section className="section testimonials-section" aria-labelledby="testimonials-heading">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Testimonials</span>
          <h2 id="testimonials-heading">What our students say</h2>
        </div>
      </div>
      <MarqueeTestimonials testimonials={quotes} />
    </section>
  );
}
