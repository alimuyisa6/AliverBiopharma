import React from 'react';

/** Playful dimensional science artwork for the Biology and Pharmacy footer. */
export default function FooterScienceIllustration() {
  return (
    <svg
      className="footer-science-art"
      viewBox="0 0 560 180"
      role="img"
      aria-labelledby="footer-science-title footer-science-desc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="footer-science-title">Biology and Pharmacy learning</title>
      <desc id="footer-science-desc">A colorful dimensional cell, molecular model, bubbling laboratory flask, and growing leaves represent life science and medicine.</desc>
      <defs>
        <linearGradient id="footer-cell-shell" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#a5f3fc" />
          <stop offset=".52" stopColor="#38bdf8" />
          <stop offset="1" stopColor="#2563eb" />
        </linearGradient>
        <linearGradient id="footer-cell-core" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c4b5fd" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="footer-glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#dbeafe" stopOpacity=".92" />
          <stop offset="1" stopColor="#93c5fd" stopOpacity=".48" />
        </linearGradient>
        <linearGradient id="footer-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5eead4" />
          <stop offset="1" stopColor="#0d9488" />
        </linearGradient>
        <linearGradient id="footer-leaf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bbf7d0" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
        <radialGradient id="footer-orb-glow" cx=".3" cy=".2" r=".9">
          <stop offset="0" stopColor="#fff" stopOpacity=".9" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <filter id="footer-soft-shadow" x="-30%" y="-30%" width="160%" height="180%">
          <feDropShadow dx="0" dy="5" stdDeviation="4" floodColor="#16324f" floodOpacity=".18" />
        </filter>
      </defs>

      <ellipse cx="280" cy="157" rx="245" ry="8" fill="currentColor" opacity=".07" />

      {/* Dimensional cell */}
      <g filter="url(#footer-soft-shadow)">
        <path d="M37 85C37 54 62 33 91 38c15-20 49-11 56 9 29 1 43 30 30 52 7 27-20 48-43 39-20 17-48 7-53-9-28 2-48-17-44-44Z" fill="url(#footer-cell-shell)" stroke="#2563eb" strokeOpacity=".6" strokeWidth="2"/>
        <path d="M49 75C53 54 73 47 91 51c16-13 38-7 44 11 20 3 30 20 21 36 3 17-14 29-30 23-14 12-32 6-38-5-20 1-36-14-32-32Z" fill="#e0f2fe" fillOpacity=".38"/>
        <ellipse cx="104" cy="83" rx="23" ry="25" fill="url(#footer-cell-core)" stroke="#6d28d9" strokeWidth="2"/>
        <ellipse cx="97" cy="75" rx="8" ry="6" fill="#fff" opacity=".32"/>
        <g fill="#fef08a">
          <ellipse cx="65" cy="72" rx="6" ry="3.5" transform="rotate(-28 65 72)"/>
          <ellipse cx="139" cy="91" rx="7" ry="4" transform="rotate(24 139 91)"/>
          <ellipse cx="82" cy="111" rx="5" ry="3"/>
        </g>
        <g fill="#0f766e">
          <circle cx="70" cy="91" r="3.5"/><circle cx="128" cy="62" r="3"/><circle cx="124" cy="108" r="4"/>
        </g>
        <ellipse cx="73" cy="53" rx="19" ry="7" fill="url(#footer-orb-glow)" transform="rotate(-25 73 53)"/>
      </g>

      {/* Colorful molecular model */}
      <g filter="url(#footer-soft-shadow)" strokeLinecap="round">
        <g stroke="#64748b" strokeWidth="8">
          <path d="M207 53L239 76L270 48L301 71L328 47"/>
          <path d="M239 76L235 112L270 129L301 103L301 71"/>
        </g>
        <g stroke="#fff" strokeOpacity=".55" strokeWidth="2">
          <path d="M207 50L239 73L270 45L301 68L328 44"/>
          <path d="M239 73L235 109L270 126L301 100"/>
        </g>
        <g>
          <circle cx="207" cy="53" r="13" fill="#fb7185"/><circle cx="239" cy="76" r="12" fill="#fbbf24"/>
          <circle cx="270" cy="48" r="14" fill="#60a5fa"/><circle cx="301" cy="71" r="12" fill="#34d399"/>
          <circle cx="328" cy="47" r="11" fill="#a78bfa"/><circle cx="235" cy="112" r="10" fill="#38bdf8"/>
          <circle cx="270" cy="129" r="13" fill="#2dd4bf"/><circle cx="301" cy="103" r="10" fill="#f472b6"/>
        </g>
        <g fill="#fff" opacity=".68">
          <circle cx="203" cy="48" r="4"/><circle cx="235" cy="71" r="3.5"/><circle cx="265" cy="42" r="4"/>
          <circle cx="297" cy="66" r="3.5"/><circle cx="324" cy="43" r="3"/>
        </g>
      </g>

      {/* Glass flask with bright liquid and bubbles */}
      <g filter="url(#footer-soft-shadow)">
        <path d="M389 34h37v8h-7v34l27 45c5 9-1 19-12 19h-54c-11 0-17-10-12-19l27-45V42h-6Z" fill="url(#footer-glass)" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round"/>
        <path d="M382 91h51l15 26c4 7-1 14-10 14h-52c-9 0-14-7-10-14Z" fill="url(#footer-liquid)"/>
        <path d="M384 92c13 5 28-5 47 0" fill="none" stroke="#ccfbf1" strokeWidth="3" strokeLinecap="round"/>
        <path d="M396 48v25l-24 42c-3 6 0 10 6 11" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" opacity=".72"/>
        <g fill="#ecfeff" stroke="#0d9488" strokeWidth="1">
          <circle cx="397" cy="107" r="4"/><circle cx="414" cy="117" r="3"/><circle cx="424" cy="100" r="2.5"/>
        </g>
        <path d="M386 34h42" stroke="#2563eb" strokeWidth="5" strokeLinecap="round"/>
      </g>

      {/* Soft, dimensional botanical growth */}
      <g filter="url(#footer-soft-shadow)" stroke="#15803d" strokeWidth="1.6" strokeLinejoin="round">
        <path d="M486 139Q490 98 526 65" fill="none" strokeWidth="4" strokeLinecap="round"/>
        <path d="M504 105C475 106 465 87 469 70c23 1 38 14 35 35Z" fill="url(#footer-leaf)"/>
        <path d="M503 105L469 70" fill="none" stroke="#dcfce7" strokeWidth="2"/>
        <path d="M510 91C505 66 519 48 542 45c4 23-8 40-32 46Z" fill="url(#footer-leaf)"/>
        <path d="M510 91l32-46" fill="none" stroke="#dcfce7" strokeWidth="2"/>
        <path d="M488 132C467 126 459 111 463 99c19 3 29 15 25 33Z" fill="url(#footer-leaf)"/>
        <path d="M488 132l-25-33" fill="none" stroke="#dcfce7" strokeWidth="2"/>
      </g>

      {/* Small floating highlights */}
      <g fill="#fbbf24">
        <path d="M172 36l3 7 7 3-7 3-3 7-3-7-7-3 7-3Z"/>
        <path d="M352 24l2.5 5.5 5.5 2.5-5.5 2.5-2.5 5.5-2.5-5.5-5.5-2.5 5.5-2.5Z"/>
      </g>
      <g fill="#38bdf8"><circle cx="187" cy="122" r="4"/><circle cx="453" cy="48" r="3.5"/></g>
    </svg>
  );
}
