import React from 'react';

/** Clean, animated flat SVG artwork for Biology and Pharmacy learning. */
export default function FooterScienceIllustration() {
  return (
    <svg
      className="footer-science-art"
      viewBox="0 0 560 170"
      role="img"
      aria-labelledby="footer-science-title footer-science-desc"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="footer-science-title">Biology and Pharmacy learning</title>
      <desc id="footer-science-desc">An animal cell, connected molecular model, laboratory flask and botanical sprig. The leaves gently sway while remaining attached to the branch.</desc>
      <style>{`
        .footer-botanical-leaf {
          transform-box: view-box;
          transform-origin: center;
          animation: footer-leaf-sway 3.8s ease-in-out infinite;
        }
        .footer-botanical-leaf--lower { transform-origin: 495px 123px; animation-delay: -1.1s; }
        .footer-botanical-leaf--left { transform-origin: 507px 100px; animation-delay: -.6s; }
        .footer-botanical-leaf--top { transform-origin: 519px 80px; animation-delay: -1.7s; }
        @keyframes footer-leaf-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .footer-botanical-leaf { animation: none; }
        }
      `}</style>

      {/* Animal cell: membrane, cytoplasm, nucleus and organelles */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M25 82C25 55 46 39 69 42C82 24 111 31 120 48C145 45 161 64 156 86C165 107 145 128 123 121C108 140 81 133 74 119C48 126 27 108 25 82Z"
          fill="#dbeafe" stroke="#2563eb" strokeWidth="3"/>
        <path d="M40 82C40 61 58 51 76 55C91 42 112 49 116 65C135 65 146 81 137 96C137 111 119 117 106 108C91 122 72 113 69 102C52 105 40 96 40 82Z"
          fill="#bfdbfe" stroke="#60a5fa" strokeWidth="1.5"/>
        <ellipse cx="91" cy="81" rx="19" ry="21" fill="#a78bfa" stroke="#6d28d9" strokeWidth="2"/>
        <circle cx="95" cy="80" r="6" fill="#6d28d9"/>
        <path d="M51 70c7-7 12-4 15 1M113 99c7-5 12-2 14 2" fill="none" stroke="#0f766e" strokeWidth="4"/>
        <circle cx="57" cy="91" r="3.5" fill="#f59e0b"/>
        <circle cx="119" cy="58" r="3" fill="#f59e0b"/>
        <circle cx="79" cy="111" r="3" fill="#f59e0b"/>
      </g>

      {/* Ball-and-stick molecular model: bonds connect distinct atoms */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M205 54L236 76L270 52L302 75L329 49M236 76L233 111L269 128L302 104L302 75"
          fill="none" stroke="#64748b" strokeWidth="6"/>
        <path d="M205 54L236 76L270 52L302 75L329 49M236 76L233 111L269 128L302 104L302 75"
          fill="none" stroke="#cbd5e1" strokeWidth="2"/>
        <circle cx="205" cy="54" r="12" fill="#ef4444" stroke="#b91c1c" strokeWidth="1.5"/>
        <circle cx="236" cy="76" r="12" fill="#fbbf24" stroke="#b45309" strokeWidth="1.5"/>
        <circle cx="270" cy="52" r="13" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1.5"/>
        <circle cx="302" cy="75" r="12" fill="#10b981" stroke="#047857" strokeWidth="1.5"/>
        <circle cx="329" cy="49" r="10" fill="#a78bfa" stroke="#6d28d9" strokeWidth="1.5"/>
        <circle cx="233" cy="111" r="10" fill="#38bdf8" stroke="#0369a1" strokeWidth="1.5"/>
        <circle cx="269" cy="128" r="12" fill="#14b8a6" stroke="#0f766e" strokeWidth="1.5"/>
        <circle cx="302" cy="104" r="10" fill="#f472b6" stroke="#be185d" strokeWidth="1.5"/>
      </g>

      {/* Laboratory flask with a visible solution level */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M389 32H427V41H420V76L447 119Q454 132 438 132H378Q362 132 369 119L396 76V41H389Z"
          fill="#eff6ff" stroke="#2563eb" strokeWidth="2.5"/>
        <path d="M383 97H433L447 119Q454 130 438 130H378Q364 130 371 119Z"
          fill="#2dd4bf" stroke="#0f766e" strokeWidth="1.5"/>
        <path d="M385 97Q397 101 409 97T433 97" fill="none" stroke="#0f766e" strokeWidth="2"/>
        <path d="M398 48V74L377 109" fill="none" stroke="#93c5fd" strokeWidth="3"/>
        <circle cx="398" cy="111" r="4" fill="#ecfeff" stroke="#0f766e" strokeWidth="1.2"/>
        <circle cx="415" cy="119" r="3" fill="#ecfeff" stroke="#0f766e" strokeWidth="1.2"/>
        <circle cx="424" cy="106" r="2.5" fill="#ecfeff" stroke="#0f766e" strokeWidth="1.2"/>
      </g>

      {/* Botanical stem with each leaf base placed directly on a branch node */}
      <g strokeLinecap="round" strokeLinejoin="round">
        <path d="M488 137Q493 120 507 100Q520 80 530 59" fill="none" stroke="#15803d" strokeWidth="4"/>
        <g className="footer-botanical-leaf footer-botanical-leaf--lower">
          <path d="M495 123C475 120 465 108 466 94C483 97 496 108 495 123Z"
            fill="#bbf7d0" stroke="#15803d" strokeWidth="2"/>
          <path d="M495 123L466 94" fill="none" stroke="#15803d" strokeWidth="1.5"/>
        </g>
        <g className="footer-botanical-leaf footer-botanical-leaf--left">
          <path d="M507 100C484 100 472 86 474 70C494 73 508 85 507 100Z"
            fill="#86efac" stroke="#15803d" strokeWidth="2"/>
          <path d="M507 100L474 70" fill="none" stroke="#15803d" strokeWidth="1.5"/>
        </g>
        <g className="footer-botanical-leaf footer-botanical-leaf--top">
          <path d="M519 80C512 60 523 43 542 41C546 60 536 75 519 80Z"
            fill="#4ade80" stroke="#15803d" strokeWidth="2"/>
          <path d="M519 80L542 41" fill="none" stroke="#15803d" strokeWidth="1.5"/>
        </g>
      </g>
    </svg>
  );
}
