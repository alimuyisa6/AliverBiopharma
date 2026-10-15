import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <main className="ab-not-found" aria-labelledby="ab-not-found-title">
      <div className="ab-not-found__content">
        <svg className="ab-not-found__scene" viewBox="0 0 400 300" role="img" aria-label="A confused explorer holding an upside-down map, surrounded by question marks">
          <text x="200" y="118" textAnchor="middle" className="ab-not-found__ghost-number">404</text>
          <ellipse cx="200" cy="268" rx="130" ry="13" className="ab-not-found__ground" />
          <g className="ab-not-found__sign">
            <rect x="62" y="150" width="7" height="118" rx="3" className="ab-not-found__wood" />
            <g className="ab-not-found__sway"><path d="M69 160H28l-10 9 10 9h41z" className="ab-not-found__signboard" /><text x="46" y="174" textAnchor="middle" className="ab-not-found__sign-text">?</text></g>
            <g className="ab-not-found__sway ab-not-found__sway--late"><path d="M62 186h41l10 9-10 9H62z" className="ab-not-found__signboard" /><text x="86" y="200" textAnchor="middle" className="ab-not-found__sign-text">?</text></g>
          </g>
          <text className="ab-not-found__question" x="140" y="92">?</text><text className="ab-not-found__question ab-not-found__question--late" x="262" y="84">?</text><text className="ab-not-found__question ab-not-found__question--later" x="304" y="130">?</text>
          <rect x="178" y="228" width="18" height="30" rx="8" className="ab-not-found__trousers"/><rect x="204" y="228" width="18" height="30" rx="8" className="ab-not-found__trousers"/>
          <ellipse cx="184" cy="262" rx="14" ry="7" className="ab-not-found__shoes"/><ellipse cx="216" cy="262" rx="14" ry="7" className="ab-not-found__shoes"/>
          <rect x="160" y="180" width="26" height="42" rx="10" className="ab-not-found__backpack"/>
          <rect x="170" y="172" width="60" height="64" rx="20" className="ab-not-found__body"/>
          <path d="M174 190Q148 198 152 222M226 190Q252 198 248 222" fill="none" className="ab-not-found__arms"/>
          <g className="ab-not-found__map" transform="translate(200 218) rotate(-8)">
            <rect x="-48" y="-24" width="96" height="48" rx="3" className="ab-not-found__paper"/>
            <path d="M-16-24V24M16-24V24" className="ab-not-found__map-fold"/>
            <path d="M-38 10Q-22-14-6 6T30-8" className="ab-not-found__route"/>
            <path d="M32-14l10 10m0-10l-10 10" className="ab-not-found__map-x"/>
          </g>
          <circle cx="152" cy="224" r="7" className="ab-not-found__hand"/><circle cx="248" cy="224" r="7" className="ab-not-found__hand"/>
          <g className="ab-not-found__head"><g transform="translate(200 140)">
            <circle r="36" className="ab-not-found__face"/>
            <path d="M-33-20Q-36-50 0-50Q36-50 33-20Q0-34-33-20Z" className="ab-not-found__hair"/>
            <circle cy="-52" r="7" className="ab-not-found__hair-dot"/>
            <ellipse cx="-23" cy="16" rx="6" ry="4" className="ab-not-found__blush"/><ellipse cx="23" cy="16" rx="6" ry="4" className="ab-not-found__blush"/>
            <circle cy="14" r="2.2" className="ab-not-found__nose"/>
            <g className="ab-not-found__eyes">
              <g className="ab-not-found__eye"><ellipse cx="-13" cy="4" rx="8" ry="9" className="ab-not-found__eye-white"/><circle cx="-13" cy="4" r="3.6" className="ab-not-found__pupil"/></g>
              <g className="ab-not-found__eye"><ellipse cx="13" cy="4" rx="8" ry="9" className="ab-not-found__eye-white"/><circle cx="13" cy="4" r="3.6" className="ab-not-found__pupil"/></g>
            </g>
            <g className="ab-not-found__expression ab-not-found__expression--confused"><path className="ab-not-found__brow" d="M-22-9Q-13-18-5-11M5-9L21-7"/><path className="ab-not-found__mouth" d="M-12 22Q-6 16 0 22T12 22"/></g>
            <g className="ab-not-found__expression ab-not-found__expression--worried"><path className="ab-not-found__brow" d="M-22-6L-5-15M5-15L22-6"/><path className="ab-not-found__mouth" d="M-9 26Q0 18 9 26"/><path className="ab-not-found__drop" d="M31-12Q36-4 31 0Q26-4 31-12Z"/></g>
            <g className="ab-not-found__expression ab-not-found__expression--panic"><path className="ab-not-found__brow" d="M-23-15Q-13-24-4-17M4-17Q13-24 23-15"/><ellipse cy="24" rx="8" ry="9" className="ab-not-found__open-mouth"/><ellipse cy="29" rx="5" ry="3" className="ab-not-found__tongue"/></g>
            <g className="ab-not-found__expression ab-not-found__expression--sad"><path d="M-21 4A8 9 0 0 1-5 4ZM5 4A8 9 0 0 1 21 4Z" className="ab-not-found__face-lids"/><path className="ab-not-found__brow" d="M-22-5L-5-14M5-14L22-5"/><path className="ab-not-found__mouth" d="M-11 28Q0 17 11 28"/><ellipse className="ab-not-found__tear" cx="-17" cy="14" rx="2.2" ry="3.2"/><ellipse className="ab-not-found__tear ab-not-found__tear--late" cx="17" cy="14" rx="2.2" ry="3.2"/></g>
          </g></g>
        </svg>
        <h1 id="ab-not-found-title">Page not found</h1>
        <p>We looked everywhere, but this page isn’t here.</p>
        <a href="/" className="ab-not-found__button">Take me home</a>
      </div>
    </main>
  );
}
