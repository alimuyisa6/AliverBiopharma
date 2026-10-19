 /* src/components/Hero/Hero.jsx */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import HeroScienceCanvas from './HeroScienceCanvas';
import { GlassFold } from '../ui/glass-fold';
import AnimatedJoinButton from '../ui/AnimatedJoinButton';

const MODULE_LABELS = {
  quiz: 'Quiz',
  flashcards: 'Flashcards',
  recall: 'Recall',
  notes: 'Notes'
};

const MODULE_ROUTES = {
  quiz: '/quiz',
  flashcards: '/flashcards',
  recall: '/recall',
  notes: '/notes/read'
};

const MODULE_FEATURE_KEYS = {
  quiz: 'quizzes',
  flashcards: 'flashcards',
  recall: 'recall',
  notes: null
};

function resumeHref(resume) {
  const module = resume?.module;
  const payload = resume?.payload || {};
  const params = new URLSearchParams();

  if (module === 'quiz' && payload.unit_id) {
    params.set('unit_id', payload.unit_id);
  }

  if (module === 'flashcards' && payload.deck_id) {
    params.set('deck_id', payload.deck_id);
  }

  if (module === 'recall') {
    if (payload.unit_id) params.set('unit_id', payload.unit_id);
    params.set('resume', '1');
  }

  if (module === 'notes' && payload.note_id) {
    params.set('id', payload.note_id);
  }

  const route = MODULE_ROUTES[module];
  if (!route) return '/';

  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const { level, groups, bootstrap, features } = useLayout();
  const [resume, setResume] = useState(null);

  const levelName = level?.display_name || '';
  const groupName = groups?.length > 0 ? groups[0].name : '';

  const resumeFeatureKey = resume
    ? MODULE_FEATURE_KEYS[resume.module]
    : null;

  const resumeAllowed =
    !resume ||
    !resumeFeatureKey ||
    (features?.[resumeFeatureKey] ?? true);

  const uiComponents = bootstrap?.ui_components || [];

  const heroGallery = uiComponents.find(
    (item) => item.component_key === 'hero_gallery'
  )?.properties;

  const galleryImages = heroGallery?.images || [];

  const galleryTitle =
    heroGallery?.title || 'Major Learning Materials Tailored For You';

  const galleryRowOne = galleryImages.slice(0, 3);
  const galleryRowTwo = galleryImages.slice(3, 6);

  useEffect(() => {
    if (!isAuthenticated) {
      setResume(null);
      return undefined;
    }

    let cancelled = false;

    fetch('/api/server?module=resume&path=get_resume', {
      credentials: 'include'
    })
      .then((response) => response.json())
      .then((data) => {
        if (!cancelled) {
          setResume(data?.resume || null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setResume(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <>
      <section
        className="hero hero-enhanced"
        aria-labelledby="hero-title"
      >
        <div className="hero-image" aria-hidden="true">
          <GlassFold
            color1="#7180FF"
            color2="#111044"
            color3="#00FFD4"
            speed={0.28}
            scale={0.9}
            noise={0.025}
            className="hero-glass-fold"
          />
          <HeroScienceCanvas />
        </div>

        <div className="hero-scrim" aria-hidden="true" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span>Welcome to</span>

            <span className="hero-eyebrow-accent">
              AliverBiopharm
            </span>
          </div>

          <h1 id="hero-title" className="hero-title">
            {isAuthenticated && levelName ? (
              <>
                <span>Master</span>

                <span className="hero-eyebrow-accent">
                  {levelName}
                </span>
              </>
            ) : (
              <>
                <span>Master Biology</span>

                <span>and Pharmacy</span>
              </>
            )}
          </h1>

          <p className="hero-tagline">
            {isAuthenticated && groupName
              ? `Your ${groupName} journey continues. Notes, quizzes, flashcards, and live classrooms, all matched to your level.`
              : 'Structured notes, adaptive quizzes, and spaced repetition flashcards, built for every level you study.'}
          </p>

          {!isAuthenticated && (
            <div className="hero-actions">
              <AnimatedJoinButton />

              <Link
                to="/login"
                className="btn btn-secondary"
              >
                Sign In
              </Link>
            </div>
          )}

          {isAuthenticated && resume && resumeAllowed && (
            <div className="hero-actions">
              <Link
                to={resumeHref(resume)}
                className="btn btn-primary"
              >
                Continue to {MODULE_LABELS[resume.module] || 'Learning'}
              </Link>
            </div>
          )}
        </div>

      </section>

      {galleryImages.length > 0 && (
        <section
          className="hero-gallery-section"
          aria-labelledby="hero-gallery-title"
        >
          <h2
            id="hero-gallery-title"
            className="hero-gallery-title"
          >
            {galleryTitle}
          </h2>

          {galleryRowOne.length > 0 && (
            <div className="hero-gallery-row">
              {galleryRowOne.map((image, index) => (
                <div
                  className="hero-gallery-item"
                  key={image.url || `gallery-one-${index}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || galleryTitle}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}

          {galleryRowTwo.length > 0 && (
            <div className="hero-gallery-row">
              {galleryRowTwo.map((image, index) => (
                <div
                  className="hero-gallery-item"
                  key={image.url || `gallery-two-${index}`}
                >
                  <img
                    src={image.url}
                    alt={image.alt || galleryTitle}
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}
