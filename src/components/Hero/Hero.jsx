import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import ResponsiveHeroBanner from '../ui/ResponsiveHeroBanner';

const MODULE_LABELS = { quiz: 'Quiz', flashcards: 'Flashcards', recall: 'Recall', notes: 'Notes' };
const MODULE_ROUTES = { quiz: '/quiz', flashcards: '/flashcards', recall: '/recall', notes: '/notes' };
const MODULE_FEATURE_KEYS = { quiz: 'quizzes', flashcards: 'flashcards', recall: 'recall', notes: null };

function resumeHref(resume) {
  return MODULE_ROUTES[resume?.module] || '/';
}

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const { level, groups, bootstrap, features } = useLayout();
  const [resume, setResume] = useState(null);

  const levelName = level?.display_name || '';
  const groupName = groups?.length > 0 ? groups[0].name : '';
  const resumeFeatureKey = resume ? MODULE_FEATURE_KEYS[resume.module] : null;
  const resumeAllowed = !resume || !resumeFeatureKey || (features?.[resumeFeatureKey] ?? true);
  const uiComponents = bootstrap?.ui_components || [];
  const featuredVideo = uiComponents.find((item) => item.component_key === 'featured_video')?.properties;
  const heroGallery = uiComponents.find((item) => item.component_key === 'hero_gallery')?.properties;
  const galleryImages = heroGallery?.images || [];
  const galleryTitle = heroGallery?.title || 'Major Learning Materials Tailored For You';
  const galleryRowOne = galleryImages.slice(0, 3);
  const galleryRowTwo = galleryImages.slice(3, 6);

  useEffect(() => {
    if (!isAuthenticated) {
      setResume(null);
      return undefined;
    }

    let cancelled = false;

    fetch('/api/server?module=resume&path=get_resume', { credentials: 'include' })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) setResume(data?.resume || null);
      })
      .catch(() => {
        if (!cancelled) setResume(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  const title = isAuthenticated && levelName ? 'Master' : 'Master Biology';
  const titleLine2 = isAuthenticated && levelName ? levelName : 'and Pharmacy';
  const description = isAuthenticated && groupName
    ? 'Your ' + groupName + ' journey continues with notes, quizzes, flashcards, active recall, and live classrooms matched to your level.'
    : 'Structured notes, adaptive quizzes, active recall, and flashcards for every Biology and Pharmacy level you study.';

  const primaryButtonHref = isAuthenticated && resume && resumeAllowed
    ? resumeHref(resume)
    : isAuthenticated
      ? '/resources'
      : '/register';

  const primaryButtonText = isAuthenticated && resume && resumeAllowed
    ? 'Continue ' + (MODULE_LABELS[resume.module] || 'Learning')
    : isAuthenticated
      ? 'Explore Resources'
      : 'Start Learning Free';

  const secondaryButtonHref = isAuthenticated ? '/quiz' : '/login';
  const secondaryButtonText = isAuthenticated ? 'Try a Quiz' : 'Sign In';

  return (
    <>
      <ResponsiveHeroBanner
        videoUrl={featuredVideo?.video_url}
        posterUrl={featuredVideo?.thumbnail_url}
        badgeLabel="AliverBiopharm"
        badgeText={isAuthenticated ? (levelName || 'Your level') + ' learning space' : 'Biology & Pharmacy learning platform'}
        title={title}
        titleLine2={titleLine2}
        description={description}
        primaryButtonText={primaryButtonText}
        primaryButtonHref={primaryButtonHref}
        secondaryButtonText={secondaryButtonText}
        secondaryButtonHref={secondaryButtonHref}
        trustItems={['Notes', 'Quizzes', 'Flashcards', 'Active recall', 'Live classrooms']}
      />

      {galleryImages.length > 0 && (
        <section className="hero-gallery-section" aria-labelledby="hero-gallery-title">
          <h2 id="hero-gallery-title" className="hero-gallery-title">{galleryTitle}</h2>
          {galleryRowOne.length > 0 && (
            <div className="hero-gallery-row">
              {galleryRowOne.map((image, index) => (
                <div className="hero-gallery-item" key={image.url || 'gallery-one-' + index}>
                  <img src={image.url} alt={image.alt || galleryTitle} loading="lazy" />
                </div>
              ))}
            </div>
          )}
          {galleryRowTwo.length > 0 && (
            <div className="hero-gallery-row">
              {galleryRowTwo.map((image, index) => (
                <div className="hero-gallery-item" key={image.url || 'gallery-two-' + index}>
                  <img src={image.url} alt={image.alt || galleryTitle} loading="lazy" />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
