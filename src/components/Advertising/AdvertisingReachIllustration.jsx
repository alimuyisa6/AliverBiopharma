/* src/components/Advertising/AdvertisingReachIllustration.jsx */
export default function AdvertisingReachIllustration() {
  return (
    <svg
      className="advertising-reach-illustration"
      viewBox="0 0 560 440"
      role="img"
      aria-labelledby="advertising-reach-title advertising-reach-description"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title id="advertising-reach-title">Connecting campaigns with learners</title>
      <desc id="advertising-reach-description">
        An original illustration of a learner using a laptop, connected to a campaign card and a focused audience.
      </desc>

      <defs>
        <linearGradient id="reach-panel-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--bg-card)" />
          <stop offset="100%" stopColor="var(--section-tint)" />
        </linearGradient>
        <linearGradient id="reach-screen-gradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--primary)" />
          <stop offset="100%" stopColor="var(--secondary)" />
        </linearGradient>
      </defs>

      <rect x="18" y="18" width="524" height="404" rx="34" fill="url(#reach-panel-gradient)" />
      <circle cx="278" cy="214" r="145" fill="var(--primary)" opacity=".055" />
      <circle cx="278" cy="214" r="112" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="4 9" opacity=".22" />

      <g className="advertising-reach-orbit advertising-reach-orbit--left">
        <path d="M164 148C126 131 102 145 92 174" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" />
        <circle cx="92" cy="174" r="5" fill="var(--secondary)" />
      </g>

      <g className="advertising-reach-campaign">
        <rect x="46" y="75" width="154" height="104" rx="16" fill="var(--bg-card)" stroke="var(--border-default)" strokeWidth="1.5" />
        <rect x="59" y="88" width="37" height="37" rx="11" fill="var(--primary)" opacity=".12" />
        <path d="M69 107l7-9 7 9 5-5" fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M105 97h78M105 108h57" stroke="var(--text-main)" strokeWidth="4" strokeLinecap="round" opacity=".8" />
        <path d="M60 140h125" stroke="var(--border-default)" strokeWidth="1.5" />
        <rect x="60" y="151" width="62" height="9" rx="4.5" fill="var(--secondary)" opacity=".8" />
        <circle cx="178" cy="155" r="5" fill="var(--success, var(--secondary))" />
      </g>

      <g className="advertising-reach-audience">
        <rect x="373" y="90" width="140" height="116" rx="18" fill="var(--bg-card)" stroke="var(--border-default)" strokeWidth="1.5" />
        <text x="393" y="114" fill="var(--text-secondary)" fontSize="10" fontWeight="700" letterSpacing="1.2">RIGHT AUDIENCE</text>
        <circle cx="405" cy="145" r="11" fill="var(--secondary)" opacity=".22" />
        <circle cx="405" cy="141" r="4" fill="var(--secondary)" />
        <path d="M397 153c1-7 15-7 16 0" fill="var(--secondary)" />
        <circle cx="442" cy="145" r="11" fill="var(--primary)" opacity=".18" />
        <circle cx="442" cy="141" r="4" fill="var(--primary)" />
        <path d="M434 153c1-7 15-7 16 0" fill="var(--primary)" />
        <circle cx="479" cy="145" r="11" fill="var(--accent)" opacity=".2" />
        <circle cx="479" cy="141" r="4" fill="var(--accent)" />
        <path d="M471 153c1-7 15-7 16 0" fill="var(--accent)" />
        <rect x="393" y="171" width="100" height="7" rx="3.5" fill="var(--border-default)" />
        <rect x="393" y="184" width="68" height="7" rx="3.5" fill="var(--primary)" opacity=".65" />
      </g>

      <path d="M200 145C223 151 228 166 238 183" fill="none" stroke="var(--primary)" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" opacity=".65" />
      <path d="M372 170C354 183 346 190 337 204" fill="none" stroke="var(--secondary)" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" opacity=".75" />

      <g className="advertising-reach-spark advertising-reach-spark--one">
        <path d="M280 65v14M273 72h14" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g className="advertising-reach-spark advertising-reach-spark--two">
        <path d="M462 247v12M456 253h12" stroke="var(--secondary)" strokeWidth="3" strokeLinecap="round" />
      </g>

      <g className="advertising-reach-learner">
        <path d="M218 290c3-37 21-58 60-58s58 21 62 58v24H218Z" fill="var(--secondary)" />
        <path d="M245 250c7 12 19 18 33 18s27-6 34-18l12 13-15 29h-61l-15-29Z" fill="var(--bg-card)" opacity=".9" />
        <path d="M256 226h44v42c-11 12-33 12-44 0Z" fill="var(--accent)" />
        <ellipse cx="278" cy="188" rx="45" ry="51" fill="var(--illustration-skin, var(--accent))" />
        <path d="M234 187c-5-31 11-56 43-59 29-3 49 17 48 47l-10-8-7-20c-20 15-43 20-70 16Z" fill="var(--text-main)" />
        <path d="M234 183c-9 3-8 18 2 21M322 183c9 3 8 18-2 21" fill="none" stroke="var(--illustration-skin, var(--accent))" strokeWidth="8" strokeLinecap="round" />
        <path d="M260 190h1M294 190h1" stroke="var(--text-main)" strokeWidth="4" strokeLinecap="round" />
        <path d="M268 208c7 6 15 6 22 0" fill="none" stroke="var(--text-main)" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M249 176c5-4 10-4 15-1M291 175c5-3 10-3 15 1" fill="none" stroke="var(--text-main)" strokeWidth="2.5" strokeLinecap="round" />
      </g>

      <g className="advertising-reach-laptop">
        <rect x="169" y="286" width="218" height="127" rx="13" fill="var(--text-main)" />
        <rect x="179" y="296" width="198" height="105" rx="6" fill="url(#reach-screen-gradient)" />
        <rect x="195" y="311" width="86" height="8" rx="4" fill="var(--text-inverse)" opacity=".95" />
        <rect x="195" y="326" width="57" height="5" rx="2.5" fill="var(--text-inverse)" opacity=".65" />
        <rect x="195" y="343" width="68" height="43" rx="7" fill="var(--text-inverse)" opacity=".15" />
        <path d="M205 374l14-14 10 7 17-18" fill="none" stroke="var(--text-inverse)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="275" y="343" width="83" height="7" rx="3.5" fill="var(--text-inverse)" opacity=".85" />
        <rect x="275" y="357" width="68" height="6" rx="3" fill="var(--text-inverse)" opacity=".55" />
        <rect x="275" y="369" width="75" height="6" rx="3" fill="var(--text-inverse)" opacity=".55" />
        <path d="M151 414h254l-18 12H169Z" fill="var(--text-main)" />
        <path d="M240 416h77" stroke="var(--text-inverse)" strokeWidth="2.5" strokeLinecap="round" opacity=".3" />
      </g>

      <g className="advertising-reach-notification">
        <rect x="351" y="257" width="139" height="46" rx="14" fill="var(--bg-card)" stroke="var(--border-default)" strokeWidth="1.5" />
        <circle cx="370" cy="280" r="8" fill="var(--secondary)" />
        <path d="M366 280l3 3 5-6" fill="none" stroke="var(--text-inverse)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M386 275h87M386 285h62" stroke="var(--text-main)" strokeWidth="3.5" strokeLinecap="round" opacity=".65" />
      </g>
    </svg>
  );
}
