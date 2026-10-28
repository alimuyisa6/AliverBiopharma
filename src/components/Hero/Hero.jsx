import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';

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

const NS = 'http://www.w3.org/2000/svg';
const TWO_PI = Math.PI * 2;
const SAMPLES = 56;
const SLOPE = 0.375;

const EDGE_CONFIG = [
  { base: -0.03, amplitude: 0.05, frequency: 1.25, phase: 0.4, motion: 0.032, motionFrequency: 1.6, motionPhase: 0.2, speed: 0.55, secondaryMotion: 0.014, secondaryFrequency: 3.1, secondarySpeed: -0.8, gradient: 'wave-line-one', fill: 'wave-fill-one', width: 3 },
  { base: 0.24, amplitude: 0.055, frequency: 1.15, phase: 1.9, motion: 0.036, motionFrequency: 1.45, motionPhase: 1.4, speed: 0.48, secondaryMotion: 0.016, secondaryFrequency: 2.9, secondarySpeed: -0.7, gradient: 'wave-line-two', fill: 'wave-fill-two', width: 3.2 },
  { base: 0.5, amplitude: 0.058, frequency: 1.05, phase: 3.4, motion: 0.04, motionFrequency: 1.35, motionPhase: 2.6, speed: 0.42, secondaryMotion: 0.018, secondaryFrequency: 2.7, secondarySpeed: -0.65, gradient: 'wave-line-three', fill: 'wave-fill-three', width: 3.4 },
  { base: 0.76, amplitude: 0.06, frequency: 0.95, phase: 4.8, motion: 0.044, motionFrequency: 1.25, motionPhase: 3.8, speed: 0.36, secondaryMotion: 0.02, secondaryFrequency: 2.5, secondarySpeed: -0.6, gradient: 'wave-line-four', fill: 'wave-fill-four', width: 3.6 }
];

const SMALL_CONFIG = [
  { base: 0.07, amplitude: 0.035, frequency: 1.9, phase: 0.5, speed: -0.9, width: 1.6, opacity: 0.9 },
  { base: 0.11, amplitude: 0.03, frequency: 2.4, phase: 2.4, speed: 1.1, width: 1.2, opacity: 0.75 },
  { base: 0.34, amplitude: 0.04, frequency: 1.8, phase: 1.2, speed: -0.8, width: 1.6, opacity: 0.9 },
  { base: 0.38, amplitude: 0.032, frequency: 2.3, phase: 3.6, speed: 1, width: 1.2, opacity: 0.75 },
  { base: 0.6, amplitude: 0.042, frequency: 1.7, phase: 0.2, speed: -0.7, width: 1.6, opacity: 0.9 },
  { base: 0.64, amplitude: 0.034, frequency: 2.2, phase: 2.9, speed: 0.95, width: 1.2, opacity: 0.75 },
  { base: 0.18, amplitude: 0.026, frequency: 3, phase: 4.4, speed: 1.25, width: 1, opacity: 0.55 },
  { base: 0.52, amplitude: 0.028, frequency: 2.8, phase: 5.3, speed: -1.2, width: 1, opacity: 0.55 }
];

function createSvgElement(name, attributes = {}) {
  const element = document.createElementNS(NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  return element;
}

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

function WaveArtwork() {
  const heroRef = useRef(null);
  const svgRef = useRef(null);
  const layersRef = useRef(null);
  const bordersRef = useRef(null);
  const smallsRef = useRef(null);

  useEffect(() => {
    const hero = heroRef.current;
    const svg = svgRef.current;
    const layers = layersRef.current;
    const borders = bordersRef.current;
    const smalls = smallsRef.current;
    if (!hero || !svg || !layers || !borders || !smalls) return undefined;

    const fillNodes = [];
    const borderNodes = [];
    const smallNodes = [];
    let width = hero.clientWidth || 1440;
    let height = hero.clientHeight || 900;
    let visible = true;
    let running = false;
    let frameId = 0;
    let lastFrame = 0;
    const startTime = performance.now();
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const envelope = (u, power) => Math.pow(Math.sin(Math.PI * u), power);

    const edgeX = (edge, u, time) => {
      const base = edge.base + SLOPE * u + edge.amplitude * Math.sin(TWO_PI * edge.frequency * u + edge.phase);
      const motion = envelope(u, 1.3) * (
        edge.motion * Math.sin(TWO_PI * edge.motionFrequency * u + edge.motionPhase + time * edge.speed) +
        edge.secondaryMotion * Math.sin(TWO_PI * edge.secondaryFrequency * u + time * edge.secondarySpeed)
      );
      return (base + motion) * width;
    };

    const smallX = (line, u, time) => {
      const base = line.base + SLOPE * u;
      const motion = envelope(u, 0.9) * line.amplitude * Math.sin(TWO_PI * line.frequency * u + line.phase + time * line.speed);
      return (base + motion) * width;
    };

    const buildPath = (pointAt, time, offset = 0, close = false) => {
      let path = '';
      for (let index = 0; index <= SAMPLES; index += 1) {
        const u = index / SAMPLES;
        path += `${index ? 'L' : 'M'}${(pointAt(u, time) + offset).toFixed(1)} ${(u * height).toFixed(1)} `;
      }
      if (close) path += `L-80 ${height} L-80 0 Z`;
      return path;
    };

    EDGE_CONFIG.slice().reverse().forEach((edge) => {
      const fill = createSvgElement('path', { fill: `url(#${edge.fill})`, stroke: 'none' });
      layers.appendChild(fill);
      fillNodes.unshift(fill);
    });

    EDGE_CONFIG.forEach((edge) => {
      const band = createSvgElement('path', { fill: 'none', stroke: 'var(--white)', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.07 });
      const haloWide = createSvgElement('path', { fill: 'none', stroke: `url(#${edge.gradient})`, 'stroke-width': edge.width * 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.1 });
      const halo = createSvgElement('path', { fill: 'none', stroke: `url(#${edge.gradient})`, 'stroke-width': edge.width * 4.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.22 });
      const line = createSvgElement('path', { fill: 'none', stroke: `url(#${edge.gradient})`, 'stroke-width': edge.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      const core = createSvgElement('path', { fill: 'none', stroke: 'var(--white)', 'stroke-width': edge.width * 0.35, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.85 });
      const shine = createSvgElement('path', { fill: 'none', stroke: 'var(--white)', 'stroke-width': 1.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.3 });
      [band, haloWide, halo, line, core, shine].forEach((node) => borders.appendChild(node));
      borderNodes.push({ band, haloWide, halo, line, core, shine });
    });

    SMALL_CONFIG.forEach((line) => {
      const halo = createSvgElement('path', { fill: 'none', stroke: 'url(#wave-small-gradient)', 'stroke-width': line.width * 5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: 0.12 });
      const path = createSvgElement('path', { fill: 'none', stroke: 'url(#wave-small-gradient)', 'stroke-width': line.width, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', opacity: line.opacity });
      smalls.appendChild(halo);
      smalls.appendChild(path);
      smallNodes.push({ halo, path });
    });

    const resize = () => {
      width = hero.clientWidth || 1440;
      height = hero.clientHeight || 900;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
    };

    const draw = (time) => {
      EDGE_CONFIG.forEach((edge, index) => {
        const pointAt = (u, t) => edgeX(edge, u, t);
        const path = buildPath(pointAt, time);
        const nodes = borderNodes[index];
        fillNodes[index].setAttribute('d', buildPath(pointAt, time, 0, true));
        nodes.band.setAttribute('d', buildPath(pointAt, time, -9));
        nodes.haloWide.setAttribute('d', path);
        nodes.halo.setAttribute('d', path);
        nodes.line.setAttribute('d', path);
        nodes.core.setAttribute('d', path);
        nodes.shine.setAttribute('d', buildPath(pointAt, time, 7));
      });

      SMALL_CONFIG.forEach((line, index) => {
        const path = buildPath((u, t) => smallX(line, u, t), time);
        smallNodes[index].halo.setAttribute('d', path);
        smallNodes[index].path.setAttribute('d', path);
      });
    };

    const stop = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      running = false;
    };

    const animate = (now) => {
      if (!visible || document.hidden) {
        stop();
        return;
      }
      if (now - lastFrame >= 33) {
        lastFrame = now;
        draw((now - startTime) / 1000);
      }
      frameId = requestAnimationFrame(animate);
    };

    const start = () => {
      if (running || reduceMotion || !visible || document.hidden) return;
      running = true;
      frameId = requestAnimationFrame(animate);
    };

    resize();
    draw(0);
    const resizeObserver = window.ResizeObserver ? new ResizeObserver(resize) : null;
    resizeObserver?.observe(hero);
    if (!resizeObserver) window.addEventListener('resize', resize);

    const intersectionObserver = 'IntersectionObserver' in window
      ? new IntersectionObserver((entries) => {
          visible = entries[0]?.isIntersecting ?? true;
          if (visible) start();
          else stop();
        })
      : null;
    intersectionObserver?.observe(hero);

    const onVisibilityChange = () => {
      if (document.hidden) stop();
      else start();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    if (!reduceMotion) start();

    return () => {
      stop();
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      [layers, borders, smalls].forEach((group) => {
        while (group.firstChild) group.removeChild(group.firstChild);
      });
    };
  }, []);

  return (
    <div className="hero-wave-art" ref={heroRef} aria-hidden="true">
      <svg className="hero-wave-svg" ref={svgRef} preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-fill-four" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--secondary)" stopOpacity="0.42" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="wave-fill-three" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--primary)" stopOpacity="0.45" />
            <stop offset="1" stopColor="var(--secondary)" stopOpacity="0.16" />
          </linearGradient>
          <linearGradient id="wave-fill-two" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--accent)" stopOpacity="0.58" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="wave-fill-one" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--text)" stopOpacity="0.9" />
            <stop offset="1" stopColor="var(--text)" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="wave-line-one" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="0.5" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--secondary)" />
          </linearGradient>
          <linearGradient id="wave-line-two" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--secondary)" />
            <stop offset="0.5" stopColor="var(--accent)" />
            <stop offset="1" stopColor="var(--primary)" />
          </linearGradient>
          <linearGradient id="wave-line-three" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--primary)" />
            <stop offset="0.5" stopColor="var(--secondary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient id="wave-line-four" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--secondary)" />
            <stop offset="0.5" stopColor="var(--primary)" />
            <stop offset="1" stopColor="var(--accent)" />
          </linearGradient>
          <linearGradient id="wave-small-gradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="var(--accent)" />
            <stop offset="0.5" stopColor="var(--white)" />
            <stop offset="1" stopColor="var(--secondary)" />
          </linearGradient>
        </defs>
        <g ref={layersRef} />
        <g ref={bordersRef} />
        <g ref={smallsRef} />
      </svg>
    </div>
  );
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

  return (
    <section className="hero hero-aero" aria-labelledby="hero-title">
      <WaveArtwork />
      <div className="hero-aero-shade" aria-hidden="true" />
      <div className="hero-aero-content">
        <div className="hero-aero-inner">
          <div className="hero-aero-badge">
            <span className="hero-aero-badge-dot" aria-hidden="true" />
            Biology &amp; Pharmacy Learning Platform
          </div>

          <h1 id="hero-title" className="hero-aero-title">
            Master the science of <span>life and medicine</span>
          </h1>

          <p className="hero-aero-description">
            {isAuthenticated && groupName
              ? `Your ${groupName} journey continues. Explore structured notes, adaptive quizzes, BioRecall spaced repetition, and learning resources tailored to your level.`
              : 'From O-Level biology to A-Level and pharmacy programmes, learn with adaptive quizzes, spaced repetition and structured curriculum built around your level.'}
          </p>

          <div className="hero-aero-actions">
            {isAuthenticated ? (
              resume && resumeAllowed ? (
                <Link to={resumeHref(resume)} className="hero-aero-button hero-aero-button-primary">
                  <span>Continue to {MODULE_LABELS[resume.module] || 'Learning'}</span>
                  <span className="hero-aero-button-icon" aria-hidden="true"><ArrowUpRight size={21} strokeWidth={1.8} /></span>
                </Link>
              ) : (
                <Link to="/notes" className="hero-aero-button hero-aero-button-primary">
                  <span>Continue Learning</span>
                  <span className="hero-aero-button-icon" aria-hidden="true"><ArrowUpRight size={21} strokeWidth={1.8} /></span>
                </Link>
              )
            ) : (
              <>
                <Link to="/register" className="hero-aero-button hero-aero-button-primary">
                  <span>Start Learning</span>
                  <span className="hero-aero-button-icon" aria-hidden="true"><ArrowUpRight size={21} strokeWidth={1.8} /></span>
                </Link>
                <Link to="/notes" className="hero-aero-button hero-aero-button-ghost">Explore Modules</Link>
              </>
            )}
          </div>

          <div className="hero-aero-stats" aria-label="Platform highlights">
            <div><strong>3</strong><span>Learning levels</span></div>
            <div><strong>BioRecall</strong><span>Spaced repetition</span></div>
            <div><strong>Adaptive</strong><span>Quizzes &amp; practice</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}
