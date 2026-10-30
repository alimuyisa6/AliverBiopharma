import Button from '../../components/Button/Button';
import './lernwick-feature.css';

const teaserImages = {
  'live-room': 'https://images.pexels.com/photos/4145190/pexels-photo-4145190.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop',
  tutor: 'https://images.pexels.com/photos/5212700/pexels-photo-5212700.jpeg?auto=compress&cs=tinysrgb&w=900&h=900&fit=crop'
};

export function SectionTeaser({
  eyebrow,
  title,
  intro,
  imageUrl,
  imageAlt,
  illustrationType,
  ctaLabel,
  onCtaClick,
  imageSide = 'right'
}) {
  const image = imageUrl || teaserImages[illustrationType];

  return (
    <section className={`section section-teaser lernwick-feature teaser-image-${imageSide} lernwick-feature--${illustrationType || 'default'}`}>
      <div className="container">
        <div className="section-teaser-inner">
          <div className="section-teaser-content">
            {eyebrow && <p className="lernwick-note">{eyebrow}</p>}
            <h2 className="section-teaser-title">{title}</h2>
            {intro && <p className="section-subtitle">{intro}</p>}
            <Button variant="primary" onClick={onCtaClick}>{ctaLabel}</Button>
          </div>
          {image && (
            <div className="section-teaser-image-wrap">
              <img src={image} alt={imageAlt || ''} className="section-teaser-image" loading="lazy" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
