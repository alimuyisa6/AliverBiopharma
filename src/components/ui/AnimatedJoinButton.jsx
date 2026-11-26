import { Link } from 'react-router-dom';

const FIRST_LABEL = 'Start Free';
const SECOND_LABEL = 'Join Now';

export default function AnimatedJoinButton() {
  return (
    <Link to="/register" className="group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-xl border border-primary-500 bg-primary-700 px-6 py-3 text-sm font-extrabold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-600" aria-label="Start learning for free — join today">
      <span className="relative inline-flex items-center gap-3">
        <span className="transition-transform duration-200 group-hover:-translate-y-0.5">{FIRST_LABEL}</span>
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none"><path d="M5 12h14m-6-6 6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        <span className="sr-only">{SECOND_LABEL}</span>
        </span>
      </span>
    </Link>
  );
}
