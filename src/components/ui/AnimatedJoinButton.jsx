import { Link } from 'react-router-dom';
import './AnimatedJoinButton.css';

const FIRST_LABEL = 'Start Free';
const SECOND_LABEL = 'Join Now';

function LetterRun({ label, state }) {
  return (
    <span className={`animated-join-button__letters ${state}`} aria-hidden="true">
      {Array.from(label).map((letter, index) => (
        <span key={`${state}-${index}`} data-label={letter === ' ' ? '\u00a0' : letter} style={{ '--i': index + 1 }}>
          {letter === ' ' ? '\u00a0' : letter}
        </span>
      ))}
    </span>
  );
}

export default function AnimatedJoinButton() {
  return (
    <Link to="/register" className="animated-join-button" aria-label="Start learning for free — join today">
      <span className="animated-join-button__shadow" aria-hidden="true" />
      <svg className="animated-join-button__splash" viewBox="0 0 342 208" aria-hidden="true">
        <path d="M54 100C40 91 26 98 13 104S2 98 2 98M285 100c14-9 28-2 42 4s13-3 13-3M231 57c0-16-5-22 5-27s9-18 9-18M231 151c0 16-5 22 5 27s9 18 9 18M113 57c5-16 5-16-6-27s-8-17-8-17M113 151c5 16 5 16-6 27s-8 17-8 17" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
      </svg>
      <span className="animated-join-button__wrap">
        <svg className="animated-join-button__path" viewBox="0 0 221 42" aria-hidden="true">
          <path d="M183 2h20a16 16 0 0 1 16 16v6a16 16 0 0 1-16 16H18A16 16 0 0 1 2 24v-6A16 16 0 0 1 18 2h30" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        </svg>
        <span className="animated-join-button__outline" aria-hidden="true" />
        <span className="animated-join-button__face">
          <span className="animated-join-button__text">
            <LetterRun label={FIRST_LABEL} state="state-1" />
            <span className="animated-join-button__arrow" aria-hidden="true"><span /></span>
            <LetterRun label={SECOND_LABEL} state="state-2" />
          </span>
        </span>
      </span>
    </Link>
  );
}
