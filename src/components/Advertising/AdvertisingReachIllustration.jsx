export default function AdvertisingReachIllustration() {
  return (
    <svg className="advertising-reach-illustration" viewBox="0 0 560 440" width="100%" role="img" aria-labelledby="advertising-reach-title advertising-reach-description" xmlns="http://www.w3.org/2000/svg">
      <title id="advertising-reach-title">Connecting campaigns with learners</title>
      <desc id="advertising-reach-description">A realistic illustration of a learner in blue clothing at a laptop, the back of the laptop facing the viewer, connected to a campaign card and a focused audience card, in blue, black and white.</desc>
      <style>{`
.advertising-reach-illustration{--ar-bg:#ffffff;--ar-fg:#0a0a0c;--ar-bl:#2563eb}
@media (prefers-color-scheme:dark){.advertising-reach-illustration{--ar-bg:#07070b;--ar-fg:#ffffff;--ar-bl:#5b8cff}}
:root[data-theme="dark"] .advertising-reach-illustration{--ar-bg:#07070b;--ar-fg:#ffffff;--ar-bl:#5b8cff}
:root[data-theme="light"] .advertising-reach-illustration{--ar-bg:#ffffff;--ar-fg:#0a0a0c;--ar-bl:#2563eb}
.ar-bgf{fill:var(--ar-bg)}
.ar-fgf{fill:var(--ar-fg)}
.ar-sb{stop-color:var(--ar-bl)}
.ar-sf{stop-color:var(--ar-fg)}
.ar-ln{fill:none;stroke:var(--ar-fg);stroke-opacity:.16}
.ar-flow{fill:none;stroke-linecap:round;stroke-dasharray:4 7;animation:ar-flow 1.6s linear infinite}
.ar-tw{animation:ar-tw 2.4s ease-in-out infinite}
.ar-eye{transform-box:fill-box;transform-origin:center;animation:ar-blink 4.6s infinite}
@keyframes ar-flow{to{stroke-dashoffset:-22}}
@keyframes ar-tw{50%{opacity:.25}}
@keyframes ar-blink{0%,90%,100%{transform:scaleY(1)}94%{transform:scaleY(.08)}}
@media (prefers-reduced-motion:reduce){.ar-flow,.ar-tw,.ar-eye{animation:none}}
      `}</style>
      <defs>
        <radialGradient id="ar-glow"><stop offset="0" className="ar-sb" stopOpacity=".34" /><stop offset="1" className="ar-sb" stopOpacity="0" /></radialGradient>
        <linearGradient id="ar-bluegrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".55" /><stop offset=".2" className="ar-sb" /><stop offset=".8" className="ar-sb" /><stop offset="1" stopColor="#000" stopOpacity=".55" /></linearGradient>
        <radialGradient id="ar-blue" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".28" className="ar-sb" /><stop offset=".65" className="ar-sb" /><stop offset="1" stopColor="#000" stopOpacity=".9" /></radialGradient>
        <radialGradient id="ar-ink" cx=".35" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".3" className="ar-sf" /><stop offset="1" stopColor="#000" /></radialGradient>
        <radialGradient id="ar-skin" cx=".4" cy=".3" r=".8"><stop offset="0" stopColor="#fff" /><stop offset=".55" stopColor="#fff" /><stop offset="1" stopColor="#000" stopOpacity=".32" /></radialGradient>
        <linearGradient id="ar-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".45" /><stop offset=".5" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <linearGradient id="ar-lid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity=".3" /><stop offset=".45" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".08" /></linearGradient>
        <filter id="ar-sh" x="-25%" y="-25%" width="150%" height="170%"><feDropShadow dx="0" dy="12" stdDeviation="11" floodColor="#000" floodOpacity=".28" /></filter>
        <filter id="ar-soft" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id="ar-gl" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4" /></filter>
      </defs>

      <rect x="18" y="18" width="524" height="404" rx="34" className="ar-bgf" />
      <rect x="18.5" y="18.5" width="523" height="403" rx="33.5" className="ar-ln" />
      <circle cx="278" cy="214" r="190" fill="url(#ar-glow)" />
      <circle cx="278" cy="214" r="112" fill="none" stroke="var(--ar-bl)" strokeOpacity=".3" strokeWidth="1.5" strokeDasharray="4 9" />
      <ellipse cx="280" cy="420" rx="165" ry="9" fill="#000" fillOpacity=".35" filter="url(#ar-soft)" />

      <path className="ar-flow" d="M200 145C223 151 228 166 238 183" stroke="var(--ar-bl)" strokeWidth="2" />
      <path className="ar-flow" d="M372 170C354 183 346 190 337 204" stroke="var(--ar-fg)" strokeOpacity=".6" strokeWidth="2" />
      <path className="ar-flow" d="M164 148C126 131 102 145 92 174" stroke="var(--ar-bl)" strokeOpacity=".6" strokeWidth="2" />
      <circle cx="92" cy="174" r="5" fill="url(#ar-blue)" />

      <g>
        <g filter="url(#ar-sh)"><rect x="46" y="75" width="154" height="104" rx="16" className="ar-bgf" fillOpacity=".9" /></g>
        <rect x="46" y="75" width="154" height="104" rx="16" fill="url(#ar-sheen)" />
        <rect x="46.5" y="75.5" width="153" height="103" rx="15.5" className="ar-ln" />
        <rect x="59" y="88" width="37" height="37" rx="11" fill="url(#ar-bluegrad)" />
        <path d="M69 107l7-9 7 9 5-5" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M105 97h78M105 108h57" stroke="var(--ar-fg)" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <path d="M60 140h125" className="ar-ln" />
        <rect x="60" y="151" width="62" height="9" rx="4.5" fill="url(#ar-bluegrad)" />
        <circle cx="178" cy="155" r="5" fill="url(#ar-blue)" />
      </g>

      <g>
        <g filter="url(#ar-sh)"><rect x="373" y="90" width="140" height="116" rx="18" className="ar-bgf" fillOpacity=".9" /></g>
        <rect x="373" y="90" width="140" height="116" rx="18" fill="url(#ar-sheen)" />
        <rect x="373.5" y="90.5" width="139" height="115" rx="17.5" className="ar-ln" />
        <text x="393" y="114" className="ar-fgf" fillOpacity=".65" fontSize="10.5" fontWeight="700" letterSpacing="1.2" fontFamily="Inter, Arial, sans-serif">RIGHT AUDIENCE</text>
        <g transform="translate(405 145)"><circle r="12" className="ar-fgf" fillOpacity=".07" /><circle cy="-4" r="4.5" fill="url(#ar-ink)" /><path d="M-8 8c1-7 15-7 16 0" fill="url(#ar-ink)" /></g>
        <g transform="translate(442 145)"><circle r="12" className="ar-fgf" fillOpacity=".07" /><circle cy="-4" r="4.5" fill="url(#ar-blue)" /><path d="M-8 8c1-7 15-7 16 0" fill="url(#ar-blue)" /></g>
        <g transform="translate(479 145)"><circle r="12" className="ar-fgf" fillOpacity=".07" /><circle cy="-4" r="4.5" fill="url(#ar-ink)" /><path d="M-8 8c1-7 15-7 16 0" fill="url(#ar-ink)" /></g>
        <rect x="393" y="171" width="100" height="7" rx="3.5" className="ar-fgf" fillOpacity=".12" />
        <rect x="393" y="184" width="68" height="7" rx="3.5" fill="url(#ar-bluegrad)" />
      </g>

      <g className="ar-tw"><path d="M280 65v14M273 72h14" stroke="var(--ar-bl)" strokeWidth="3" strokeLinecap="round" /></g>
      <g className="ar-tw" style={{ animationDelay: "1.1s" }}><path d="M462 247v12M456 253h12" stroke="var(--ar-fg)" strokeOpacity=".7" strokeWidth="3" strokeLinecap="round" /></g>

      <path d="M218 290c3-37 21-58 60-58s58 21 62 58v24H218Z" fill="url(#ar-blue)" />
      <path d="M218 290c3-37 21-58 60-58s58 21 62 58" fill="none" stroke="#fff" strokeOpacity=".22" strokeWidth="1.5" />
      <path d="M245 250c7 12 19 18 33 18s27-6 34-18l12 13-15 29h-61l-15-29Z" fill="url(#ar-bluegrad)" stroke="#000" strokeOpacity=".35" />
      <path d="M256 226h44v42c-11 12-33 12-44 0Z" fill="url(#ar-skin)" stroke="var(--ar-fg)" strokeOpacity=".3" />
      <path d="M256 250c10 8 34 8 44 0v-14c-12 8-32 8-44 0Z" fill="#000" fillOpacity=".16" />

      <g>
        <ellipse cx="233" cy="192" rx="6" ry="10" fill="url(#ar-skin)" stroke="var(--ar-fg)" strokeOpacity=".3" />
        <ellipse cx="323" cy="192" rx="6" ry="10" fill="url(#ar-skin)" stroke="var(--ar-fg)" strokeOpacity=".3" />
        <ellipse cx="278" cy="188" rx="45" ry="51" fill="url(#ar-skin)" stroke="var(--ar-fg)" strokeOpacity=".35" strokeWidth="1.5" />
        <path d="M234 187c-5-31 11-56 43-59 29-3 49 17 48 47l-10-8-7-20c-20 15-43 20-70 16Z" fill="#0a0a0c" stroke="#fff" strokeOpacity=".25" />
        <path d="M250 148c12-8 28-11 44-8" fill="none" stroke="#fff" strokeOpacity=".3" strokeWidth="3" strokeLinecap="round" />
        <ellipse cx="256" cy="204" rx="8" ry="4" fill="#000" fillOpacity=".07" />
        <ellipse cx="300" cy="204" rx="8" ry="4" fill="#000" fillOpacity=".07" />
        <g className="ar-eye"><ellipse cx="260" cy="190" rx="6" ry="5" fill="#fff" stroke="#000" strokeOpacity=".35" /><circle cx="260" cy="190" r="3.6" fill="#0a0a0c" /><circle cx="261.3" cy="188.6" r="1.1" fill="#fff" /></g>
        <g className="ar-eye"><ellipse cx="295" cy="190" rx="6" ry="5" fill="#fff" stroke="#000" strokeOpacity=".35" /><circle cx="295" cy="190" r="3.6" fill="#0a0a0c" /><circle cx="296.3" cy="188.6" r="1.1" fill="#fff" /></g>
        <path d="M249 176c5-4 10-4 15-1M291 175c5-3 10-3 15 1" fill="none" stroke="#0a0a0c" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M278 192c-2 6-3 9 1 10" fill="none" stroke="#000" strokeOpacity=".25" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M268 210c7 6 15 6 22 0" fill="none" stroke="#0a0a0c" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M231 276c-10 13-13 27-6 39l24 11M325 276c11 12 14 26 7 39l-22 11" stroke="#000" strokeOpacity=".35" strokeWidth="17" />
        <path d="M231 276c-10 13-13 27-6 39l24 11M325 276c11 12 14 26 7 39l-22 11" stroke="var(--ar-bl)" strokeWidth="13" />
      </g>

      <g>
        <rect x="169" y="286" width="218" height="127" rx="13" fill="#0a0a0c" stroke="#fff" strokeOpacity=".3" />
        <rect x="169" y="286" width="218" height="127" rx="13" fill="url(#ar-lid)" />
        <path d="M184 294h188" stroke="var(--ar-bl)" strokeOpacity=".7" strokeWidth="1.5" strokeLinecap="round" />
        <g fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3">
          <g filter="url(#ar-gl)" stroke="var(--ar-bl)"><path d="M267 343c-7-8-2-19 8-20 7 0 11 5 11 12 0 8-7 13-15 13" /><path d="M287 335c7 8 2 19-8 20-7 0-11-5-11-12" /></g>
          <g stroke="var(--ar-bl)"><path d="M267 343c-7-8-2-19 8-20 7 0 11 5 11 12 0 8-7 13-15 13" /><path d="M287 335c7 8 2 19-8 20-7 0-11-5-11-12" /></g>
        </g>
        <path d="M151 414h254l-18 12H169Z" fill="#0a0a0c" stroke="#fff" strokeOpacity=".3" />
        <path d="M171 414h214l-13 8H184Z" fill="#fff" fillOpacity=".12" />
        <path d="M240 417h77" stroke="#fff" strokeOpacity=".35" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path d="M220 407c-4 2-7 5-7 8m7-8 1 8m5-8 2 8m4-8 3 7M340 407c4 2 7 5 7 8m-7-8-1 8m-5-8-2 8m-4-8-3 7" stroke="var(--ar-fg)" strokeOpacity=".4" strokeWidth="9" />
        <path d="M220 407c-4 2-7 5-7 8m7-8 1 8m5-8 2 8m4-8 3 7M340 407c4 2 7 5 7 8m-7-8-1 8m-5-8-2 8m-4-8-3 7" stroke="#fff" strokeWidth="6.5" />
      </g>

      <g>
        <g filter="url(#ar-sh)"><rect x="351" y="257" width="139" height="46" rx="14" className="ar-bgf" fillOpacity=".92" /></g>
        <rect x="351" y="257" width="139" height="46" rx="14" fill="url(#ar-sheen)" />
        <rect x="351.5" y="257.5" width="138" height="45" rx="13.5" className="ar-ln" />
        <circle cx="370" cy="280" r="9" fill="url(#ar-blue)" />
        <path d="M366 280l3 3 5-6" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M386 275h87M386 285h62" stroke="var(--ar-fg)" strokeWidth="3.5" strokeLinecap="round" opacity=".65" />
      </g>
    </svg>
  );
}
