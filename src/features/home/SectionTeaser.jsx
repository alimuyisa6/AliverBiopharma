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

.section-teaser-css-art { position: relative; display: grid; min-height: 13rem; place-items: center; overflow: hidden; border: 1px solid color-mix(in srgb, var(--primary) 24%, transparent); border-radius: 1.5rem; background: color-mix(in srgb, var(--secondary) 20%, var(--background)); }
.section-teaser-css-art--tutor::before { position: absolute; width: 11rem; aspect-ratio: 1; border: 1px solid color-mix(in srgb, var(--primary) 35%, transparent); border-radius: 50%; content: ""; }
.teaser-art-person { position: absolute; bottom: 2.1rem; display: grid; justify-items: center; }
.teaser-art-person--tutor { left: 23%; }
.teaser-art-person--student { right: 23%; transform: scale(.82); }
.teaser-art-person i { width: 2.5rem; height: 2.5rem; border: 2px solid var(--text); border-radius: 50%; background: var(--secondary); }
.teaser-art-person b { width: 3.5rem; height: 4.3rem; margin-top: -.1rem; border: 2px solid var(--text); border-radius: 1.5rem 1.5rem .6rem .6rem; background: var(--primary); }
.teaser-art-person--student i { background: var(--accent); }
.teaser-art-person--student b { background: var(--background); }
.teaser-art-book { position: absolute; bottom: 1.1rem; left: calc(50% - 1.2rem); width: 2.4rem; height: 1.7rem; border: 2px solid var(--text); border-radius: .3rem; background: var(--background); box-shadow: inset 1.1rem 0 0 color-mix(in srgb, var(--secondary) 45%, var(--background)); }
.teaser-art-chat { position: absolute; top: 1.5rem; right: 25%; display: grid; width: 2rem; height: 2rem; place-items: center; border: 1px solid var(--primary); border-radius: 50%; background: var(--background); color: var(--text); font-weight: 800; }
