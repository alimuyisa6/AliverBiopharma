/* features/home/SectionTeaser.jsx */
import Button from '../../components/Button/Button';
import ResourceIllustration from '../resources/ResourceIllustration';

export function SectionTeaser({
  title,
  intro,
  imageUrl,
  imageAlt,
  illustrationType,
  ctaLabel,
  onCtaClick,
  imageSide = 'right',
}) {
  return (
    <section className={`section section-teaser teaser-image-${imageSide}`}>
      <div className="section-teaser-inner">
        <div className="section-teaser-content">
          <h2 className="section-teaser-title">{title}</h2>
          {intro && <p className="section-subtitle">{intro}</p>}
          {illustrationType !== 'tutor' && (illustrationType || imageUrl) && (
            <div className={`section-teaser-image-wrap${illustrationType ? ' section-teaser-illustration-wrap' : ''}`}>
              {illustrationType ? (
                <ResourceIllustration type={illustrationType} />
              ) : (
                <img src={imageUrl} alt={imageAlt || ''} className="section-teaser-image" loading="lazy" />
              )}
            </div>
          )}
          <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
        </div>
      </div>
    </section>
  );
}
