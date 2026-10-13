import React from 'react';

/**
 * Animated circulation illustration for the site footer.
 * Red cells travel from the body through the heart and back out through vessels.
 */
export default function FooterScienceIllustration() {
  return (
    <svg
      className="footer-science-art footer-circulation-art"
      viewBox="0 0 1440 340"
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Animated illustration of blood circulating through blood vessels, the heart, and the body"
      focusable="false"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="circulation-artery" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f87171" />
          <stop offset="1" stopColor="#b91c1c" />
        </linearGradient>
        <linearGradient id="circulation-vein" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#60a5fa" />
          <stop offset="1" stopColor="#1d4ed8" />
        </linearGradient>
        <linearGradient id="circulation-heart" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fb7185" />
          <stop offset="1" stopColor="#be123c" />
        </linearGradient>
        <filter id="circulation-glow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
        <path id="circulation-return-route" d="M180 116 C310 35 470 45 600 126 S760 222 720 171 C682 126 708 95 754 95" />
        <path id="circulation-outbound-route" d="M754 95 C840 30 960 45 1060 104 S1220 195 1320 118" />
      </defs>

      <style>{`
        .circulation-vessel { fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .circulation-flow { fill: none; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 5 17; animation: circulation-flow 1.3s linear infinite; }
        .circulation-heart { transform-box: fill-box; transform-origin: center; animation: circulation-heartbeat 1.05s ease-in-out infinite; }
        .circulation-cell { filter: url(#circulation-glow); }
        @keyframes circulation-flow { to { stroke-dashoffset: -44; } }
        @keyframes circulation-heartbeat { 0%,100% { transform: scale(1); } 12% { transform: scale(1.055); } 24% { transform: scale(1); } 38% { transform: scale(1.025); } 52% { transform: scale(1); } }
        @media (prefers-reduced-motion: reduce) {
          .circulation-flow, .circulation-heart { animation: none; }
        }
      `}</style>

      {/* Simplified body silhouette: the circulation loop connects both sides. */}
      <g opacity=".2" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="180" cy="78" r="24" />
        <path d="M153 111 Q180 99 207 111 L224 176 L210 205 L216 286 M150 286 L156 205 L136 176Z" />
        <path d="M145 126 L92 183 L65 224 M215 126 L270 183 L294 224" />
        <path d="M180 104V151" strokeDasharray="3 7" />
        <circle cx="1320" cy="78" r="24" />
        <path d="M1293 111 Q1320 99 1347 111 L1364 176 L1350 205 L1356 286 M1290 286 L1296 205 L1276 176Z" />
        <path d="M1285 126 L1232 183 L1205 224 M1355 126 L1410 183 L1434 224" />
      </g>

      {/* Veins return blood toward the heart; arteries carry it back out to the body. */}
      <g className="circulation-vessel">
        <path d="M180 119 C300 24 475 35 603 116 S690 167 720 151" stroke="url(#circulation-vein)" strokeWidth="22" opacity=".2" />
        <path d="M180 119 C300 24 475 35 603 116 S690 167 720 151" stroke="url(#circulation-vein)" strokeWidth="8" />
        <path d="M180 119 C300 24 475 35 603 116 S690 167 720 151" className="circulation-flow" stroke="#bfdbfe" strokeWidth="4" />
        <path d="M754 151 C835 48 969 39 1067 106 S1230 192 1320 119" stroke="url(#circulation-artery)" strokeWidth="22" opacity=".2" />
        <path d="M754 151 C835 48 969 39 1067 106 S1230 192 1320 119" stroke="url(#circulation-artery)" strokeWidth="8" />
        <path d="M754 151 C835 48 969 39 1067 106 S1230 192 1320 119" className="circulation-flow" stroke="#fecaca" strokeWidth="4" />
        <path d="M180 119 C270 220 440 268 575 218 S675 167 720 163" stroke="url(#circulation-vein)" strokeWidth="17" opacity=".17" />
        <path d="M180 119 C270 220 440 268 575 218 S675 167 720 163" stroke="url(#circulation-vein)" strokeWidth="6" />
        <path d="M754 163 C835 244 984 274 1092 218 S1255 156 1320 119" stroke="url(#circulation-artery)" strokeWidth="17" opacity=".17" />
        <path d="M754 163 C835 244 984 274 1092 218 S1255 156 1320 119" stroke="url(#circulation-artery)" strokeWidth="6" />
      </g>

      {/* Small vessel branches make the loop read as a body-wide circulation system. */}
      <g fill="none" strokeLinecap="round" strokeWidth="5" opacity=".75">
        <path d="M360 66 Q330 95 341 126 M460 75 Q489 98 486 130" stroke="#3b82f6" />
        <path d="M1020 78 Q1001 103 1014 130 M1150 130 Q1174 148 1165 174" stroke="#ef4444" />
        <path d="M275 191 Q302 178 316 160 M1125 216 Q1105 190 1110 174" stroke="#60a5fa" />
      </g>

      {/* Heart with visible chambers, vessels and a rhythmic pulse. */}
      <g className="circulation-heart" filter="url(#circulation-glow)">
        <path d="M737 205 C720 190 678 162 688 126 C697 93 733 91 752 118 C773 87 812 97 820 127 C829 163 784 192 754 213 Q746 219 737 205Z" fill="url(#circulation-heart)" stroke="#fecdd3" strokeWidth="3" />
        <path d="M751 117 C748 141 751 168 754 207" fill="none" stroke="#7f1d1d" strokeWidth="3" opacity=".8" />
        <path d="M704 131 C716 120 732 127 739 141 M771 132 C785 119 801 127 805 139" fill="none" stroke="#ffe4e6" strokeWidth="4" strokeLinecap="round" opacity=".85" />
        <path d="M727 165 Q740 151 752 165 Q765 151 779 165" fill="none" stroke="#fecdd3" strokeWidth="3" strokeLinecap="round" />
      </g>
      <text x="754" y="248" textAnchor="middle" fill="currentColor" fontSize="17" fontWeight="700" letterSpacing="2">HEART</text>
      <text x="180" y="319" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600" letterSpacing="1.5">BODY</text>
      <text x="1320" y="319" textAnchor="middle" fill="currentColor" fontSize="14" fontWeight="600" letterSpacing="1.5">BODY</text>

      {/* Animated red blood cells travel around both routes in sequence. */}
      <g className="circulation-cell">
        <ellipse rx="9" ry="5.5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.5">
          <animateMotion dur="5.2s" repeatCount="indefinite" path="M180 119 C300 24 475 35 603 116 S690 167 720 151 C835 48 969 39 1067 106 S1230 192 1320 119" />
        </ellipse>
        <ellipse rx="4" ry="2" fill="#991b1b" opacity=".75">
          <animateMotion dur="5.2s" repeatCount="indefinite" path="M180 119 C300 24 475 35 603 116 S690 167 720 151 C835 48 969 39 1067 106 S1230 192 1320 119" />
        </ellipse>
        <ellipse rx="8" ry="5" fill="#dc2626" stroke="#fecaca" strokeWidth="1.3">
          <animateMotion dur="5.2s" begin="-1.7s" repeatCount="indefinite" path="M180 119 C270 220 440 268 575 218 S675 167 720 163 C835 244 984 274 1092 218 S1255 156 1320 119" />
        </ellipse>
        <ellipse rx="8" ry="5" fill="#ef4444" stroke="#fecaca" strokeWidth="1.3">
          <animateMotion dur="5.2s" begin="-3.4s" repeatCount="indefinite" path="M1320 119 C1230 192 1067 106 969 39 S835 48 754 151 C690 167 603 116 475 35 S300 24 180 119" />
        </ellipse>
      </g>
    </svg>
  );
}
