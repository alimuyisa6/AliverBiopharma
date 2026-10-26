import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import './Hero.css';

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

  if (module === 'quiz') {
    if (payload.unit_id) params.set('unit_id', payload.unit_id);
    if (payload.session_id) params.set('session_id', payload.session_id);
    if (payload.block_number !== undefined && payload.block_number !== null) {
      params.set('block_number', String(payload.block_number));
    }
  }

  if (module === 'flashcards') {
    if (payload.deck_id) params.set('deck_id', payload.deck_id);
    if (payload.unit_id) params.set('unit_id', payload.unit_id);
  }

  if (module === 'recall') {
    if (payload.unit_id) params.set('unit_id', payload.unit_id);
    if (payload.session_id) params.set('session_id', payload.session_id);
    params.set('resume', '1');
  }

  if (module === 'notes') {
    const noteId = payload.note_id ?? payload.content_id ?? payload.id;
    if (noteId) {
      params.set('id', noteId);
      if (payload.return_to) params.set('return_to', payload.return_to);
      return `/notes/read?${params.toString()}`;
    }
    return '/notes';
  }

  const route = MODULE_ROUTES[module];
  if (!route) return '/';

  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export default function Hero() {
  const { isAuthenticated } = useAuth();
  const { level, groups, features } = useLayout();
  const [resume, setResume] = useState(null);

  const levelName = level?.display_name || '';
  const groupName = groups?.length > 0 ? groups[0].name : '';
  const resumeFeatureKey = resume ? MODULE_FEATURE_KEYS[resume.module] : null;
  const resumeAllowed =
    !resume ||
    !resumeFeatureKey ||
    (features?.[resumeFeatureKey] ?? true);

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
        if (!cancelled) setResume(data?.resume || null);
      })
      .catch(() => {
        if (!cancelled) setResume(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  return (
    <section className="hero hero-aero" aria-labelledby="hero-title">
      <div className="hero-aero-image" aria-hidden="true" />
      <div className="hero-aero-shade" aria-hidden="true" />
      <div className="hero-aero-grid" aria-hidden="true">
        {Array.from({ length: 12 }, (_, index) => (
          <span key={index} />
        ))}
      </div>

      <div className="hero-aero-content">
        <p className="hero-aero-eyebrow">
          <span>Welcome to</span>
          <span className="hero-aero-brand">AliverBiopharm</span>
        </p>

        <h1 id="hero-title" className="hero-aero-title">
          {isAuthenticated && levelName ? (
            <>
              <span>Master</span>
              <span>{levelName}</span>
            </>
          ) : (
            <>
              <span>Master Biology</span>
              <span>and Pharmacy</span>
            </>
          )}
        </h1>

        <p className="hero-aero-description">
          {isAuthenticated && groupName
            ? `Your ${groupName} journey continues. Notes, quizzes, flashcards, and live classrooms, all matched to your level.`
            : 'Structured notes, adaptive quizzes, and spaced repetition flashcards, built for every level you study.'}
        </p>

        {!isAuthenticated && (
          <div className="hero-aero-actions">
            <Link to="/register" className="hero-aero-button">
              <span>Start Learning</span>
              <span className="hero-aero-button-icon" aria-hidden="true">
                <ArrowUpRight size={21} strokeWidth={1.8} />
              </span>
            </Link>
            <Link to="/login" className="hero-aero-signin">Sign In</Link>
          </div>
        )}

        {isAuthenticated && resume && resumeAllowed && (
          <div className="hero-aero-actions">
            <Link to={resumeHref(resume)} className="hero-aero-button">
              <span>Continue to {MODULE_LABELS[resume.module] || 'Learning'}</span>
              <span className="hero-aero-button-icon" aria-hidden="true">
                <ArrowUpRight size={21} strokeWidth={1.8} />
              </span>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
