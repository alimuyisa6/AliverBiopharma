import React, { useEffect, useRef } from 'react';

/** Animated, flat illustration of the AliverBiopharm learning cycle. */
export default function WhyChooseIllustration() {
  const svgRef = useRef(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return undefined;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let isInView = false;

    const syncAnimationState = () => {
      const shouldPause = reducedMotion.matches || !isInView;
      svg.classList.toggle('is-visible', !shouldPause);
      if (shouldPause) svg.pauseAnimations?.();
      else svg.unpauseAnimations?.();
    };

    const observer = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
          isInView = entry.isIntersecting;
          syncAnimationState();
        }, { rootMargin: '120px 0px' })
      : null;

    observer?.observe(svg);
    reducedMotion.addEventListener?.('change', syncAnimationState);
    syncAnimationState();

    return () => {
      observer?.disconnect();
      reducedMotion.removeEventListener?.('change', syncAnimationState);
      svg.pauseAnimations?.();
    };
  }, []);

  return (
    <svg ref={svgRef} className="why-choose-science-art" viewBox="0 0 520 270" role="img"
      aria-labelledby="why-art-title why-art-description" xmlns="http://www.w3.org/2000/svg">
      <title id="why-art-title">A connected learning journey</title>
      <desc id="why-art-description">Notes, active recall, quizzes and progress connect in a learning cycle. Cards and progress indicators animate gently.</desc>
      <style>{`
        .why-art-flow { stroke-dasharray: 7 8; animation: why-art-flow 8s linear infinite; }
        .why-art-note { transform-box: fill-box; transform-origin: center; animation: why-art-float 4.4s ease-in-out infinite; }
        .why-art-recall { transform-box: fill-box; transform-origin: center; animation: why-art-float 4.4s ease-in-out -1.5s infinite; }
        .why-art-quiz { transform-box: fill-box; transform-origin: center; animation: why-art-float 4.4s ease-in-out -2.7s infinite; }
        .why-art-progress { stroke-dasharray: 90; stroke-dashoffset: 90; animation: why-art-progress 3.5s ease-in-out infinite alternate; }
        .why-art-check { transform-box: fill-box; transform-origin: center; animation: why-art-check 2.8s ease-in-out infinite; }
        .why-choose-science-art:not(.is-visible) .why-art-flow,
        .why-choose-science-art:not(.is-visible) .why-art-note,
        .why-choose-science-art:not(.is-visible) .why-art-recall,
        .why-choose-science-art:not(.is-visible) .why-art-quiz,
        .why-choose-science-art:not(.is-visible) .why-art-progress,
        .why-choose-science-art:not(.is-visible) .why-art-check { animation-play-state: paused; }
        @keyframes why-art-flow { to { stroke-dashoffset: -120; } }
        @keyframes why-art-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes why-art-progress { to { stroke-dashoffset: 0; } }
        @keyframes why-art-check { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
        @media (prefers-reduced-motion: reduce) {
          .why-art-flow,.why-art-note,.why-art-recall,.why-art-quiz,.why-art-progress,.why-art-check { animation: none; }
          .why-art-progress { stroke-dashoffset: 0; }
        }
      `}</style>

      {/* Clear connectors run only through the gaps between the three learning cards. */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M145 125H174" stroke="#93c5fd" strokeWidth="5"/>
        <path className="why-art-flow" d="M145 125H170" stroke="#2563eb" strokeWidth="2.5"/>
        <path d="m167 120 7 5-7 5" stroke="#2563eb" strokeWidth="2.5"/>
        <path d="M290 125H323" stroke="#93c5fd" strokeWidth="5"/>
        <path className="why-art-flow" d="M290 125H319" stroke="#2563eb" strokeWidth="2.5"/>
        <path d="m316 120 7 5-7 5" stroke="#2563eb" strokeWidth="2.5"/>
      </g>

      {/* Notes: a structured study card, not a book stack. */}
      <g className="why-art-note">
        <rect x="36" y="62" width="108" height="124" rx="13" fill="#dbeafe" stroke="#2563eb" strokeWidth="2.5"/>
        <rect x="48" y="75" width="84" height="24" rx="6" fill="#2563eb"/>
        <path d="M58 87h42" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
        <path d="M51 115h67M51 128h55M51 141h62" stroke="#60a5fa" strokeWidth="4" strokeLinecap="round"/>
        <path d="M51 158h35" stroke="#0d9488" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="120" cy="158" r="7" fill="#10b981"/>
        <path d="m116 158 3 3 5-6" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Recall: a prompt and a thought-response mark. */}
      <g className="why-art-recall">
        <rect x="177" y="92" width="112" height="103" rx="13" fill="#ccfbf1" stroke="#0f766e" strokeWidth="2.5"/>
        <path d="M195 113h76" stroke="#0f766e" strokeWidth="4" strokeLinecap="round"/>
        <path d="M195 126h59M195 139h68" stroke="#5eead4" strokeWidth="4" strokeLinecap="round"/>
        <path d="M197 162c0-9 8-16 17-16s17 7 17 16-8 16-17 16h-7l-8 6 2-10c-3-3-4-7-4-12Z" fill="#0d9488"/>
        <path d="m208 162 5 5 9-11" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Quiz: selected answer and question structure. */}
      <g className="why-art-quiz">
        <rect x="326" y="62" width="108" height="124" rx="13" fill="#fef3c7" stroke="#b45309" strokeWidth="2.5"/>
        <path d="M342 81h76" stroke="#b45309" strokeWidth="4" strokeLinecap="round"/>
        <rect x="342" y="95" width="76" height="23" rx="7" fill="#fde68a" stroke="#d97706" strokeWidth="1.5"/>
        <circle cx="354" cy="106.5" r="5" fill="#d97706"/>
        <path d="M366 107h39" stroke="#b45309" strokeWidth="3" strokeLinecap="round"/>
        <rect x="342" y="126" width="76" height="23" rx="7" fill="#fff" stroke="#d97706" strokeWidth="1.5"/>
        <circle cx="354" cy="137.5" r="5" fill="none" stroke="#d97706" strokeWidth="2"/>
        <path d="M366 138h32" stroke="#d97706" strokeWidth="3" strokeLinecap="round"/>
        <path d="M342 163h42" stroke="#d97706" strokeWidth="3" strokeLinecap="round"/>
      </g>

      {/* Learning progress: the ring fills and the check gently pulses. */}
      <g>
        <circle cx="469" cy="132" r="25" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="7"/>
        <circle cx="469" cy="132" r="25" fill="none" stroke="#059669" strokeWidth="7"
          strokeLinecap="round" transform="rotate(-90 469 132)" className="why-art-progress"/>
        <path className="why-art-check" d="m457 132 8 8 16-18" fill="none" stroke="#047857" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
      </g>

      {/* Labels clarify how the pieces work together. */}
      <g fontFamily="Inter, Arial, sans-serif" fontSize="12" fontWeight="600" textAnchor="middle">
        <text x="90" y="207" fill="currentColor">Study</text>
        <text x="233" y="216" fill="currentColor">Recall</text>
        <text x="380" y="207" fill="currentColor">Practise</text>
        <text x="469" y="174" fill="currentColor">Progress</text>
      </g>
      <path d="M37 237H483" fill="none" stroke="currentColor" strokeOpacity=".15" strokeWidth="1.5" strokeLinecap="round"/>
      <text x="260" y="258" fill="currentColor" opacity=".8" fontFamily="Inter, Arial, sans-serif" fontSize="12" textAnchor="middle">Learn · Recall · Practise · Improve</text>
    </svg>
  );
}
