import React from 'react';

/** Centered, animated overview of pulmonary and systemic blood circulation. */
export default function FooterScienceIllustration() {
  return (
    <svg
      className="footer-science-art footer-circulation-art"
      viewBox="0 0 1000 300"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Blood circulation: deoxygenated blood returns from the body to the right side of the heart, travels to the lungs, returns oxygenated to the left side of the heart, and is pumped through the aorta back to the body."
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="circ-blue" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" /><stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="circ-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7185" /><stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="circ-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7185" /><stop offset="1" stopColor="#9f1239" />
        </linearGradient>
        <filter id="circ-soft-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <style>{`
        .circ-vessel { fill:none; stroke-linecap:round; stroke-linejoin:round; }
        .circ-flow { fill:none; stroke:#fff; stroke-width:3; stroke-linecap:round; stroke-dasharray:2 13; animation:circ-dash 1.1s linear infinite; }
        .circ-rbc { filter:url(#circ-soft-glow); }
        .circ-heart { transform-box:fill-box; transform-origin:center; animation:circ-beat 1.05s ease-in-out infinite; }
        @keyframes circ-dash { to { stroke-dashoffset:-30; } }
        @keyframes circ-beat { 0%,100% { transform:scale(1); } 13% { transform:scale(1.045); } 25% { transform:scale(1); } 39% { transform:scale(1.02); } 52% { transform:scale(1); } }
        @media (prefers-reduced-motion:reduce) { .circ-flow,.circ-heart { animation:none; } }
      `}</style>

      {/* Body-side capillary beds at the two ends. */}
      <g fill="none" stroke="currentColor" strokeWidth="1.8" opacity=".28" strokeLinecap="round">
        <path d="M45 104 Q25 130 45 156 M58 96 Q38 130 58 164 M71 101 Q51 130 71 159 M84 108 Q64 130 84 152" />
        <path d="M916 104 Q896 130 916 156 M929 96 Q909 130 929 164 M942 101 Q922 130 942 159 M955 108 Q935 130 955 152" />
      </g>
      <text x="64" y="82" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1.2">BODY</text>
      <text x="936" y="82" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1.2">BODY</text>

      {/* Lungs with branching capillaries: gas exchange occurs here. */}
      <g id="circ-lungs" strokeLinecap="round" strokeLinejoin="round">
        <path d="M380 67 C352 44 326 66 320 101 C315 131 326 151 350 148 C370 146 383 126 387 101Z" fill="#fca5a5" fillOpacity=".32" stroke="#f87171" strokeWidth="2.5" />
        <path d="M420 67 C448 44 474 66 480 101 C485 131 474 151 450 148 C430 146 417 126 413 101Z" fill="#fca5a5" fillOpacity=".32" stroke="#f87171" strokeWidth="2.5" />
        {/* Bronchi branch into fine pulmonary capillary networks around alveoli. */}
        <path d="M400 42V90 M400 70L377 91 M400 70L423 91 M377 91L358 113 M377 91L379 124 M423 91L442 113 M423 91L421 124" fill="none" stroke="#f87171" strokeWidth="3" />
        <g fill="#fda4af" fillOpacity=".85" stroke="#be123c" strokeWidth="1">
          <circle cx="348" cy="111" r="4"/><circle cx="354" cy="120" r="4"/><circle cx="362" cy="126" r="4"/>
          <circle cx="371" cy="119" r="4"/><circle cx="375" cy="130" r="4"/><circle cx="442" cy="111" r="4"/>
          <circle cx="448" cy="120" r="4"/><circle cx="456" cy="126" r="4"/><circle cx="465" cy="119" r="4"/>
          <circle cx="469" cy="130" r="4"/>
        </g>
        <text x="400" y="174" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="700" letterSpacing="1">LUNGS</text>
      </g>

      {/* Accurate direction of the main circuits:
          body -> venae cavae -> right heart -> pulmonary artery -> lungs;
          lungs -> pulmonary veins -> left heart -> aorta -> body. */}
      <g className="circ-vessel">
        {/* Deoxygenated return from body to right atrium */}
        <path d="M83 132 H285 Q312 132 334 143 Q349 151 365 151" stroke="url(#circ-blue)" strokeWidth="14" opacity=".22" />
        <path d="M83 132 H285 Q312 132 334 143 Q349 151 365 151" stroke="url(#circ-blue)" strokeWidth="7" />
        <path d="M83 132 H285 Q312 132 334 143 Q349 151 365 151" className="circ-flow" />
        {/* Right ventricle to pulmonary artery, then lungs */}
        <path d="M383 181 C382 169 376 163 374 151 L374 128 Q374 111 389 96" stroke="url(#circ-blue)" strokeWidth="10" />
        <path d="M383 181 C382 169 376 163 374 151 L374 128 Q374 111 389 96" className="circ-flow" />
        {/* Oxygenated blood from lungs to left atrium */}
        <path d="M425 96 L425 113 Q425 126 421 140 L421 151" stroke="url(#circ-red)" strokeWidth="10" />
        <path d="M425 96 L425 113 Q425 126 421 140 L421 151" className="circ-flow" />
        {/* Left ventricle to aorta and systemic body */}
        <path d="M426 181 Q445 174 457 157 Q477 130 492 105 V85 Q492 55 521 55 H694 Q725 55 745 83 L790 132 H917" stroke="url(#circ-red)" strokeWidth="15" opacity=".22" />
        <path d="M426 181 Q445 174 457 157 Q477 130 492 105 V85 Q492 55 521 55 H694 Q725 55 745 83 L790 132 H917" stroke="url(#circ-red)" strokeWidth="7.5" />
        <path d="M456 171 C478 153 492 137 492 111 V85 Q492 55 521 55 H694 Q725 55 745 83 L790 132 H917" className="circ-flow" />
      </g>

      {/* Heart chambers are shown in anatomical flow order. In this front view,
          the right-heart chambers appear on the viewer's left. */}
      <g className="circ-heart" filter="url(#circ-soft-glow)">
        <path d="M400 203 C387 191 350 171 356 145 C362 122 386 120 400 139 C414 120 438 122 444 145 C450 171 413 191 400 203Z" fill="url(#circ-heart)" stroke="#fecdd3" strokeWidth="2.5" />
        <path d="M400 139V197" fill="none" stroke="#7f1d1d" strokeWidth="2.5" />
        <path d="M363 149 Q381 139 396 156 M404 156 Q419 139 437 149" fill="none" stroke="#ffe4e6" strokeWidth="2.5" />
        <path d="M369 169 Q383 159 396 171 M404 171 Q417 159 431 169" fill="none" stroke="#fecdd3" strokeWidth="2" />
        {/* Small valve leaflets between atria and ventricles. */}
        <path d="M379 157l8 6 8-6 M405 157l8 6 8-6" fill="none" stroke="#fff1f2" strokeWidth="1.7" />
      </g>
      <g fill="#fff1f2" fontSize="7.5" fontWeight="800" textAnchor="middle">
        <text x="379" y="147">RA</text><text x="420" y="147">LA</text>
        <text x="380" y="181">RV</text><text x="420" y="181">LV</text>
      </g>
      <text x="400" y="230" textAnchor="middle" fill="currentColor" fontSize="12" fontWeight="700" letterSpacing="1.2">HEART</text>

      {/* Red cells travel along each vessel centreline in physiological order.
          Separate motion paths make them enter the heart and lungs rather than
          jumping across gaps between unrelated vessel segments. */}
      <g className="circ-rbc">
        {/* Systemic venous return: body capillaries into the right heart */}
        <ellipse rx="7" ry="4.5" fill="#2563eb" stroke="#bfdbfe" strokeWidth="1.4">
          <animateMotion dur="2.8s" repeatCount="indefinite" path="M83 132 H285 Q312 132 334 143 Q349 151 365 151" />
        </ellipse>
        <ellipse rx="7" ry="4.5" fill="#2563eb" stroke="#bfdbfe" strokeWidth="1.4">
          <animateMotion dur="2.8s" begin="-1.4s" repeatCount="indefinite" path="M83 132 H285 Q312 132 334 143 Q349 151 365 151" />
        </ellipse>
        {/* Right heart through pulmonary artery into the lungs */}
        <ellipse rx="7" ry="4.5" fill="#2563eb" stroke="#bfdbfe" strokeWidth="1.4">
          <animateMotion dur="2.1s" begin="-0.7s" repeatCount="indefinite" path="M383 181 C382 169 376 163 374 151 L374 128 Q374 111 389 96" />
        </ellipse>
        {/* Pulmonary veins carry oxygenated blood from lungs into left heart */}
        <ellipse rx="7" ry="4.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.4">
          <animateMotion dur="1.9s" begin="-0.4s" repeatCount="indefinite" path="M425 96 L425 113 Q425 126 421 140 L421 151" />
        </ellipse>
        {/* Left heart ejects oxygenated blood through the aorta to body capillaries */}
        <ellipse rx="7" ry="4.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.4">
          <animateMotion dur="3.4s" begin="-1.1s" repeatCount="indefinite" path="M426 181 Q445 174 457 157 Q477 130 492 105 V85 Q492 55 521 55 H694 Q725 55 745 83 L790 132 H917" />
        </ellipse>
        <ellipse rx="7" ry="4.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.4">
          <animateMotion dur="3.4s" begin="-2.8s" repeatCount="indefinite" path="M426 181 Q445 174 457 157 Q477 130 492 105 V85 Q492 55 521 55 H694 Q725 55 745 83 L790 132 H917" />
        </ellipse>
      </g>

      {/* Anatomical vessel labels make the pathway explicit rather than decorative. */}
      <g fill="currentColor" fontSize="9.5" fontWeight="700" opacity=".92">
        <text x="202" y="151" textAnchor="middle">Venae cavae</text>
        <text x="341" y="89" textAnchor="middle">Pulmonary artery</text>
        <text x="464" y="101" textAnchor="middle">Pulmonary veins</text>
        <text x="604" y="76" textAnchor="middle">AORTA</text>
      </g>
      <g fill="currentColor" fontSize="10" fontWeight="600" opacity=".85">
        <text x="180" y="119" textAnchor="middle">BODY RETURN</text>
        <text x="682" y="38" textAnchor="middle">SYSTEMIC OUTFLOW</text>
      </g>
      <g transform="translate(330 263)" fontSize="10" fill="currentColor">
        <path d="M0 0H24" stroke="#2563eb" strokeWidth="5" strokeLinecap="round" />
        <text x="31" y="4">Deoxygenated blood</text>
        <path d="M164 0H188" stroke="#dc2626" strokeWidth="5" strokeLinecap="round" />
        <text x="195" y="4">Oxygenated blood</text>
      </g>
    </svg>
  );
}
