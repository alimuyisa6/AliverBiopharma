import { ArrowRight, ArrowUpRight, Play } from 'lucide-react';

export default function ResponsiveHeroBanner({
  videoUrl,
  posterUrl,
  badgeLabel = 'AliverBiopharm',
  badgeText = 'Biology & Pharmacy learning, built around you',
  title,
  titleLine2,
  description,
  primaryButtonText,
  primaryButtonHref,
  secondaryButtonText,
  secondaryButtonHref,
  trustItems = ['Structured notes', 'Adaptive quizzes', 'Active recall', 'Flashcards', 'Live classrooms']
}) {
  return (
    <section className="responsive-hero-banner" aria-labelledby="responsive-hero-title">
      <div className="responsive-hero-media" aria-hidden="true">
        {videoUrl ? (
          <video autoPlay muted loop playsInline poster={posterUrl || undefined}>
            <source src={videoUrl} type="video/mp4" />
          </video>
        ) : posterUrl ? (
          <img src={posterUrl} alt="" />
        ) : (
          <div className="responsive-hero-media-placeholder" />
        )}
      </div>

      <div className="responsive-hero-scrim" aria-hidden="true" />

      <div className="responsive-hero-content">
        <div className="responsive-hero-copy">
          <div className="responsive-hero-badge">
            <span className="responsive-hero-badge-label">{badgeLabel}</span>
            <span className="responsive-hero-badge-text">{badgeText}</span>
          </div>

          <h1 id="responsive-hero-title" className="responsive-hero-title">
            <span>{title}</span>
            {titleLine2 && <span className="responsive-hero-title-accent">{titleLine2}</span>}
          </h1>

          <p className="responsive-hero-description">{description}</p>

          <div className="responsive-hero-actions">
            {primaryButtonHref && (
              <a href={primaryButtonHref} className="responsive-hero-primary">
                <span>{primaryButtonText}</span>
                <ArrowUpRight aria-hidden="true" />
              </a>
            )}

            {secondaryButtonHref && (
              <a href={secondaryButtonHref} className="responsive-hero-secondary">
                <span>{secondaryButtonText}</span>
                <Play aria-hidden="true" />
              </a>
            )}
          </div>
        </div>

        {trustItems.length > 0 && (
          <div className="responsive-hero-trust">
            <span className="responsive-hero-trust-label">Everything in one learning space</span>
            <div className="responsive-hero-trust-list">
              {trustItems.map((item) => (
                <span key={item} className="responsive-hero-trust-item">
                  <span className="responsive-hero-trust-dot" aria-hidden="true" />
                  {item}
                  <ArrowRight aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
