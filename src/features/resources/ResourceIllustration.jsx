import React from 'react';

/**
 * Small, self-contained SVG artwork for the Resources cards.
 * Kept inline so it has no external asset dependency and renders reliably in Vite.
 */
export default function ResourceIllustration({ type }) {
  const common = {
    viewBox: '0 0 160 120',
    role: 'img',
    'aria-hidden': true,
    focusable: 'false',
    className: `resource-art resource-art-${type}`
  };

  switch (type) {
    case 'notes':
      return <svg {...common}>
        <ellipse cx="80" cy="103" rx="49" ry="7" fill="currentColor" opacity=".08" />
        <g className="resource-art-float">
          <path d="M39 22 Q39 16 46 16 H78 Q85 16 85 23 V88 Q85 82 77 82 H46 Q39 82 39 89Z" fill="#E7F0FF" stroke="#3978D4" strokeWidth="2" />
          <path d="M85 23 Q85 16 92 16 H119 Q126 16 126 23 V89 Q126 82 118 82 H93 Q85 82 85 88Z" fill="#FFFFFF" stroke="#3978D4" strokeWidth="2" />
          <path d="M85 23 V88" stroke="#3978D4" strokeWidth="2" />
          <path d="M49 32 H73 M49 40 H72 M49 48 H68 M96 32 H115 M96 40 H115" stroke="#76A3E8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="105" cy="59" r="10" fill="#D6F5EE" stroke="#0E8B79" strokeWidth="1.8" />
          <path d="M99 59 L103 63 L111 54" fill="none" stroke="#0E8B79" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>;
    case 'flashcards':
      return <svg {...common}>
        <ellipse cx="80" cy="102" rx="45" ry="7" fill="currentColor" opacity=".08" />
        <g transform="rotate(-11 70 60)" className="resource-art-back">
          <rect x="35" y="26" width="66" height="68" rx="8" fill="#DDF6F1" stroke="#139A8A" strokeWidth="2" />
          <path d="M47 42 H84 M47 51 H78 M47 60 H86" stroke="#64BFB2" strokeWidth="3" strokeLinecap="round" />
        </g>
        <g className="resource-art-flip">
          <rect x="59" y="19" width="66" height="72" rx="8" fill="#FFFFFF" stroke="#0E8B79" strokeWidth="2" />
          <rect x="69" y="29" width="46" height="23" rx="5" fill="#DDF6F1" />
          <path d="M77 40 L83 46 L96 34" fill="none" stroke="#0E8B79" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M71 62 H112 M71 71 H104" stroke="#77C8BD" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>;
    case 'pdfs':
      return <svg {...common}>
        <ellipse cx="79" cy="103" rx="38" ry="7" fill="currentColor" opacity=".08" />
        <g className="resource-art-float">
          <path d="M48 14 H91 L113 36 V91 Q113 97 107 97 H48 Q42 97 42 91 V20 Q42 14 48 14Z" fill="#FFFFFF" stroke="#65758B" strokeWidth="2" />
          <path d="M91 14 V31 Q91 36 96 36 H113" fill="#E8EEF6" stroke="#65758B" strokeWidth="2" strokeLinejoin="round" />
          <rect x="51" y="48" width="53" height="23" rx="5" fill="#D94B4B" />
          <text x="77.5" y="63.5" fontSize="12" textAnchor="middle" fontWeight="800" fill="#FFFFFF">PDF</text>
          <path d="M57 80 H98" stroke="#AAB6C5" strokeWidth="3" strokeLinecap="round" />
          <path d="M78 74 V89 M71 83 L78 90 L85 83" fill="none" stroke="#D94B4B" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" className="resource-art-download" />
        </g>
      </svg>;
    case 'quizzes':
      return <svg {...common}>
        <ellipse cx="80" cy="103" rx="39" ry="7" fill="currentColor" opacity=".08" />
        <g className="resource-art-float">
          <rect x="43" y="15" width="74" height="84" rx="9" fill="#FFF9E9" stroke="#D49A2A" strokeWidth="2" />
          <rect x="57" y="25" width="46" height="7" rx="3.5" fill="#F2D99D" />
          <g stroke="#D49A2A" strokeWidth="2" fill="#FFFFFF">
            <rect x="55" y="42" width="12" height="12" rx="3" /><rect x="55" y="62" width="12" height="12" rx="3" /><rect x="55" y="82" width="12" height="8" rx="2" />
          </g>
          <path d="M59 48 L62 51 L67 44 M59 68 L62 71 L67 64" fill="none" stroke="#168B72" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M74 48 H103 M74 68 H103 M74 86 H96" stroke="#E5C46F" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>;
    case 'past_papers':
      return <svg {...common}>
        <ellipse cx="80" cy="103" rx="43" ry="7" fill="currentColor" opacity=".08" />
        <g className="resource-art-back">
          <rect x="38" y="24" width="66" height="72" rx="5" fill="#DDEFE8" stroke="#3A9277" strokeWidth="2" transform="rotate(-8 71 60)" />
        </g>
        <g className="resource-art-float">
          <path d="M55 15 H94 L116 37 V92 Q116 97 110 97 H55 Q49 97 49 91 V21 Q49 15 55 15Z" fill="#FFFFFF" stroke="#3A9277" strokeWidth="2" />
          <path d="M94 15 V32 Q94 37 99 37 H116" fill="#DDEFE8" stroke="#3A9277" strokeWidth="2" strokeLinejoin="round" />
          <path d="M61 48 H103 M61 58 H103 M61 68 H96 M61 78 H101" stroke="#8BBEAD" strokeWidth="3" strokeLinecap="round" />
          <rect x="61" y="28" width="23" height="9" rx="3" fill="#3A9277" />
        </g>
      </svg>;
    case 'live-room':
      return <svg {...common} viewBox="0 0 480 260" className="resource-art resource-art-live-room" aria-labelledby="live-room-art-title">
        <title id="live-room-art-title">Live tutor session</title>
        <ellipse cx="240" cy="232" rx="158" ry="12" fill="currentColor" opacity=".08" />
        <g className="live-room-art-float">
          <rect x="105" y="24" width="270" height="174" rx="15" fill="#E8F3FF" stroke="#3978D4" strokeWidth="3" />
          <rect x="119" y="38" width="242" height="145" rx="9" fill="#FFFFFF" stroke="#A8C7F0" strokeWidth="2" />
          <rect x="134" y="52" width="212" height="15" rx="7.5" fill="#DDEBFF" />
          <circle cx="145" cy="59.5" r="3" fill="#3978D4" /><circle cx="156" cy="59.5" r="3" fill="#0E8B79" /><circle cx="167" cy="59.5" r="3" fill="#D49A2A" />
          <rect x="136" y="79" width="111" height="88" rx="8" fill="#E2F5F0" />
          <circle cx="191" cy="107" r="16" fill="#F2C5A5" />
          <path d="M174 104 Q175 86 191 88 Q207 88 208 104 L204 100 Q193 95 179 101Z" fill="#394B67" />
          <path d="M163 155 Q166 126 191 126 Q216 126 219 155 V161 H163Z" fill="#0E8B79" />
          <path d="M180 133 L191 146 L202 133" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="258" y="81" width="85" height="9" rx="4.5" fill="#C8D9F0" />
          <rect x="258" y="98" width="72" height="7" rx="3.5" fill="#D7E4F5" />
          <rect x="258" y="112" width="80" height="7" rx="3.5" fill="#D7E4F5" />
          <rect x="258" y="126" width="58" height="7" rx="3.5" fill="#D7E4F5" />
          <rect x="258" y="145" width="69" height="22" rx="11" fill="#0E8B79" />
          <circle cx="272" cy="156" r="4" fill="#FFFFFF" />
          <path d="M282 156 H315" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
          <path d="M88 200 H392 L369 219 H111Z" fill="#3978D4" opacity=".18" />
          <path d="M105 198 H375 L352 215 H128Z" fill="#3978D4" stroke="#3978D4" strokeWidth="2" strokeLinejoin="round" />
          <rect x="218" y="201" width="44" height="5" rx="2.5" fill="#FFFFFF" opacity=".8" />
        </g>
        <g className="live-room-art-pulse">
          <circle cx="83" cy="75" r="16" fill="#DDF6F1" stroke="#0E8B79" strokeWidth="2" />
          <path d="M76 75 L81 80 L90 69" fill="none" stroke="#0E8B79" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="396" cy="111" r="15" fill="#FFF0C9" stroke="#D49A2A" strokeWidth="2" />
          <path d="M389 111 H403 M396 104 V118" stroke="#D49A2A" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M58 124 Q48 137 58 150 M422 51 Q432 64 422 77" fill="none" stroke="#3978D4" strokeWidth="3" strokeLinecap="round" />
        </g>
      </svg>;
    case 'recall':
      return <svg {...common}>
        <ellipse cx="80" cy="103" rx="42" ry="7" fill="currentColor" opacity=".08" />
        <g className="resource-art-pulse">
          <path d="M79 31 C70 20 53 26 52 40 C39 41 37 58 47 65 C40 78 52 91 64 86 C70 96 78 91 80 84Z" fill="#E5E0FF" stroke="#7662C7" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M81 31 C90 20 107 26 108 40 C121 41 123 58 113 65 C120 78 108 91 96 86 C90 96 82 91 80 84Z" fill="#F0ECFF" stroke="#7662C7" strokeWidth="2.5" strokeLinejoin="round" />
          <path d="M80 32 V85 M63 39 C71 41 70 49 66 54 M55 62 C65 61 69 68 66 76 M97 39 C89 41 90 49 94 54 M105 62 C95 61 91 68 94 76" fill="none" stroke="#9A8AE0" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M29 49 Q21 61 29 73 M131 49 Q139 61 131 73" fill="none" stroke="#16A5A0" strokeWidth="2.5" strokeLinecap="round" className="resource-art-ripple" />
          <circle cx="29" cy="42" r="3" fill="#16A5A0" /><circle cx="131" cy="42" r="3" fill="#16A5A0" />
        </g>
      </svg>;
    default:
      return <svg {...common}><circle cx="80" cy="60" r="34" fill="#E7F0FF" stroke="#3978D4" strokeWidth="2" /><path d="M62 60 H98 M80 42 V78" stroke="#3978D4" strokeWidth="4" strokeLinecap="round" /></svg>;
  }
}
