/* components/FlashcardWelcome.jsx */
import { useEffect, useState } from 'react';
import Icon from './Icon/Icon';
import { UI } from '../design-system';

export default function FlashcardWelcome({ user, level, discipline, cls, onDone }) {
  const [flipped, setFlipped] = useState(false);

  const displayName = user?.email
    ? user.email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Learner';

  useEffect(() => {
    const flipTimer = setTimeout(() => setFlipped(true), 1800);
    const doneTimer = setTimeout(() => onDone(), 3400);
    return () => {
      clearTimeout(flipTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <div className="w-full">
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center px-4 py-10 text-center">
        <span className="mb-3 inline-flex rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-800">Welcome</span>
        <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-primary-950 sm:text-3xl">You're all set</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {level} · {discipline} · {cls}
        </p>

        <div className="relative mx-auto mt-8 w-full max-w-lg [perspective:1000px]">
          <div className={`relative grid min-h-64 [transform-style:preserve-3d] transition-transform duration-700 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
            <div className={UI.flashcardWelcomeFront}>
              <span className={UI.flashcardWelcomeIcon} aria-hidden="true"><Icon name="hand" plain /></span>
              <h3 className="text-xl font-bold leading-7">Welcome, {displayName}</h3>
              <p className="text-sm leading-6 text-slate-600">
                Get ready for your {level} {discipline} flashcards.
              </p>
            </div>

            <div className={UI.flashcardWelcomeBack}>
              <h3 className="text-xl font-bold leading-7">Please have a seat.</h3>
              <p className="text-sm leading-6 text-slate-600">
                Loading your personalised study session…
              </p>
              <span className={UI.flashcardWelcomeBadge}>
                <Icon name="layer-group" /> {cls}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
