 /* features/home/TestimonialSlider.jsx */
import { useEffect, useRef, useState } from 'react';
import '../../styles/testimonials.css';

export function TestimonialSlider({ quotes = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pausedRef = useRef(false);

  useEffect(() => {
    if (quotes.length < 2) return undefined;

    const interval = window.setInterval(() => {
      if (!pausedRef.current) {
        setActiveIndex((current) => (current + 1) % quotes.length);
      }
    }, 5000);

    return () => window.clearInterval(interval);
  }, [quotes.length]);

  if (!quotes.length) return null;

  const activeQuote = quotes[activeIndex] || quotes[0];

  return (
    <section className="section testimonials-section" aria-labelledby="testimonials-heading">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Testimonials</span>
          <h2 id="testimonials-heading">What our students say</h2>
        </div>
      </div>

      <div
        className="testimonial-slider"
        onMouseEnter={() => { pausedRef.current = true; }}
        onMouseLeave={() => { pausedRef.current = false; }}
        onFocus={() => { pausedRef.current = true; }}
        onBlur={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            pausedRef.current = false;
          }
        }}
      >
        <div className="testimonial-card" key={activeIndex}>
          <span className="testimonial-quote-mark" aria-hidden="true">“</span>
          <blockquote>{activeQuote.text}</blockquote>
          <cite>{activeQuote.author}</cite>
        </div>

        {quotes.length > 1 && (
          <div className="testimonial-controls" aria-label="Testimonial navigation">
            {quotes.map((quote, index) => (
              <button
                key={quote.id || `${quote.author || 'testimonial'}-${index}`}
                type="button"
                className={`testimonial-dot ${index === activeIndex ? 'active' : ''}`}
                aria-label={`Show testimonial ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
