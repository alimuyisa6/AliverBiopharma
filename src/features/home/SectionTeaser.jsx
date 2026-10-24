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
          <div className={`section-teaser-image-wrap${illustrationType ? ' section-teaser-illustration-wrap' : ''}`}>
            {illustrationType === 'tutor' ? (
              <div className="section-teaser-css-art section-teaser-css-art--tutor" role="img" aria-label={imageAlt || 'Tutor and student learning together'}>
                <span className="teaser-art-person teaser-art-person--tutor"><i /><b /></span>
                <span className="teaser-art-person teaser-art-person--student"><i /><b /></span>
                <span className="teaser-art-book" aria-hidden="true" />
                <span className="teaser-art-chat" aria-hidden="true">+</span>
              </div>
            ) : illustrationType ? (
              <ResourceIllustration type={illustrationType} />
            ) : imageUrl ? (
              <img src={imageUrl} alt={imageAlt || ''} className="section-teaser-image" loading="lazy" />
            ) : null}
          </div>
          <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
        </div>
      </div>
    </section>
  );
}
