import { useEffect, useId, useRef } from 'react';
import './GlobalLoader.css';

const BASE_PAIRS = { A: 'T', T: 'A', G: 'C', C: 'G' };

function buildHelix(group, options) {
  if (!group) return () => {};

  const NS = 'http://www.w3.org/2000/svg';
  const make = (tag, attrs = {}) => {
    const node = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
    group.appendChild(node);
    return node;
  };

  const sequence = options.sequence || 'ATGC';
  const backboneA = make('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-width': options.strokeWidth });
  const backboneB = make('path', { fill: 'none', 'stroke-linecap': 'round', 'stroke-width': options.strokeWidth });
  backboneA.style.stroke = 'var(--loader-accent)';
  backboneB.style.stroke = 'var(--loader-accent-secondary)';

  const rungs = [];
  for (let index = 0; index < options.count; index += 1) {
    const base = sequence.charAt(index % sequence.length) || 'A';
    const pair = BASE_PAIRS[base] || 'T';
    const first = make('line', { 'stroke-width': options.rungWidth });
    const second = make('line', { 'stroke-width': options.rungWidth });
    first.style.stroke = `var(--loader-base-${base})`;
    second.style.stroke = `var(--loader-base-${pair})`;
    let firstText = null;
    let secondText = null;

    if (options.showLetters) {
      firstText = make('text', { 'text-anchor': 'middle', 'font-size': 6, 'font-weight': 700, fill: 'var(--loader-letter)' });
      secondText = make('text', { 'text-anchor': 'middle', 'font-size': 6, 'font-weight': 700, fill: 'var(--loader-letter)' });
      firstText.textContent = base;
      secondText.textContent = pair;
    }
    rungs.push({ first, second, firstText, secondText });
  }

  return (phase) => {
    const points = 48;
    const turnAngle = Math.PI * 2 * options.turns;
    const pathA = [];
    const pathB = [];

    for (let index = 0; index < points; index += 1) {
      const fraction = index / (points - 1);
      const x = options.x + options.width * fraction;
      const wave = Math.sin(phase + fraction * turnAngle);
      pathA.push(`${index ? 'L' : 'M'}${x.toFixed(1)} ${(options.centerY + options.amplitude * wave).toFixed(1)}`);
      pathB.push(`${index ? 'L' : 'M'}${x.toFixed(1)} ${(options.centerY - options.amplitude * wave).toFixed(1)}`);
    }
    backboneA.setAttribute('d', pathA.join(' '));
    backboneB.setAttribute('d', pathB.join(' '));

    rungs.forEach((rung, index) => {
      const fraction = (index + 0.5) / options.count;
      const x = options.x + options.width * fraction;
      const angle = phase + fraction * turnAngle;
      const wave = Math.sin(angle);
      const upperY = options.centerY + options.amplitude * wave;
      const lowerY = options.centerY - options.amplitude * wave;
      const xValue = x.toFixed(1);
      rung.first.setAttribute('x1', xValue);
      rung.first.setAttribute('x2', xValue);
      rung.first.setAttribute('y1', upperY.toFixed(1));
      rung.first.setAttribute('y2', options.centerY);
      rung.second.setAttribute('x1', xValue);
      rung.second.setAttribute('x2', xValue);
      rung.second.setAttribute('y1', options.centerY);
      rung.second.setAttribute('y2', lowerY.toFixed(1));
      const opacity = Math.min(1, 0.35 + Math.abs(Math.cos(angle)) * 0.65);
      rung.first.style.opacity = opacity;
      rung.second.style.opacity = opacity;

      if (rung.firstText && rung.secondText) {
        const letterOpacity = Math.min(1, Math.max(0, (Math.abs(wave) - 0.45) * 3));
        rung.firstText.setAttribute('x', xValue);
        rung.firstText.setAttribute('y', ((upperY + options.centerY) / 2 + 2).toFixed(1));
        rung.secondText.setAttribute('x', xValue);
        rung.secondText.setAttribute('y', ((options.centerY + lowerY) / 2 + 2).toFixed(1));
        rung.firstText.style.opacity = letterOpacity;
        rung.secondText.style.opacity = letterOpacity;
      }
    });
  };
}

export default function GlobalLoader({
  tagline = 'Welcome to biology & pharmacy',
  onAnimationComplete
}) {
  const dnaRef = useRef(null);
  const miniDnaRef = useRef(null);
  const reactId = useId();
  const idPrefix = `aliver-loader-${reactId.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    const drawLarge = buildHelix(dnaRef.current, {
      x: 30, width: 200, centerY: 70, amplitude: 30, count: 15, turns: 1.5,
      strokeWidth: 2.6, rungWidth: 7, showLetters: true, sequence: 'ATGCGCTAGTCAACG'
    });
    const drawMini = buildHelix(miniDnaRef.current, {
      x: -30, width: 60, centerY: 0, amplitude: 9, count: 8, turns: 1,
      strokeWidth: 1.6, rungWidth: 2.2, showLetters: false, sequence: 'ATGCGCTA'
    });

    let frameId = 0;
    let startTime = null;
    let disposed = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const renderFrame = (time) => {
      if (disposed) return;
      if (startTime === null) startTime = time;
      const phase = ((time - startTime) / 1000) * 1.6;
      drawLarge(phase);
      drawMini(phase);
      if (!reduceMotion) frameId = window.requestAnimationFrame(renderFrame);
    };

    frameId = window.requestAnimationFrame(renderFrame);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  useEffect(() => {
    onAnimationComplete?.();
  }, [onAnimationComplete]);

  return (
    <div className="aliver-global-loader" role="status" aria-live="polite" aria-label="Loading AliverBiopharm">
      <div className="aliver-loader-stage">
        <div className="aliver-loader-card">
          <svg viewBox="0 0 260 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <defs>
              <linearGradient id={`${idPrefix}-teal`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--loader-accent-light)" />
                <stop offset=".45" stopColor="var(--loader-accent)" />
                <stop offset="1" stopColor="var(--loader-accent-deep)" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-white`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--loader-pill-light)" />
                <stop offset=".5" stopColor="var(--loader-pill-mid)" />
                <stop offset="1" stopColor="var(--loader-pill-deep)" />
              </linearGradient>
              <radialGradient id={`${idPrefix}-brain`} cx=".38" cy=".28" r=".85">
                <stop offset="0" stopColor="var(--loader-brain-light)" />
                <stop offset=".55" stopColor="var(--loader-brain-mid)" />
                <stop offset="1" stopColor="var(--loader-brain-deep)" />
              </radialGradient>
              <linearGradient id={`${idPrefix}-cerebellum`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="var(--loader-brain-mid)" />
                <stop offset="1" stopColor="var(--loader-brain-deep)" />
              </linearGradient>
              <linearGradient id={`${idPrefix}-stem`} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0" stopColor="var(--loader-brain-mid)" />
                <stop offset=".5" stopColor="var(--loader-brain-light)" />
                <stop offset="1" stopColor="var(--loader-brain-deep)" />
              </linearGradient>
            </defs>

            <g ref={dnaRef} className="aliver-loader-dna" />
            <ellipse className="aliver-loader-pill-shadow" cx="130" cy="106" rx="40" ry="5" />
            <g transform="translate(130 70)">
              <g className="aliver-loader-pill">
                <g className="aliver-loader-pill-left">
                  <path d="M0 -14H-26A14 14 0 0 0 -26 14H0Z" fill={`url(#${idPrefix}-teal)`} />
                  <rect x="-34" y="-11.5" width="30" height="5" rx="2.5" fill="var(--loader-highlight)" opacity=".6" />
                </g>
                <g className="aliver-loader-pill-right">
                  <path d="M0 -14H26A14 14 0 0 1 26 14H0Z" fill={`url(#${idPrefix}-white)`} />
                  <rect x="-3" y="-14.4" width="7" height="28.8" rx="2" fill={`url(#${idPrefix}-white)`} stroke="var(--loader-pill-outline)" strokeWidth=".6" />
                  <rect x="6" y="-11.5" width="28" height="5" rx="2.5" fill="var(--loader-highlight)" opacity=".75" />
                </g>
              </g>
            </g>

            <g className="aliver-loader-brand">
              <text className="aliver-loader-tagline" x="130" y="106" textAnchor="middle">{tagline}</text>
            </g>
            <image
              className="aliver-loader-logo"
              href="/images/logo.png"
              x="101"
              y="111"
              width="58"
              height="27"
              preserveAspectRatio="xMidYMid meet"
              aria-label="AliverBiopharm logo"
            />
            <rect className="aliver-loader-progress" x="40" y="145" width="180" height="2" rx="1" />
          </svg>
        </div>
        <div className="aliver-loader-shadow" />
      </div>
    </div>
  );
}
