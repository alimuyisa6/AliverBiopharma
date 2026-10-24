import React from 'react';

/**
 * Resource icons share a single 24px line-icon system:
 * consistent stroke, rounded joins, no embedded raster or multicolor artwork.
 */
const ICONS = {
  notes: <><path d="M7 3.75h7l4 4V20a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 20V5a1.25 1.25 0 0 1 1-1.25Z" /><path d="M14 3.75V8h4M9 12h6M9 15.5h6M9 19h4" /></>,
  flashcards: <><rect x="5" y="6" width="13" height="15" rx="1.8" /><path d="M8 3.75h9.5A1.5 1.5 0 0 1 19 5.25V18M8.5 10h6M8.5 13.5h4" /></>,
  pdfs: <><path d="M7 3.75h7l4 4V20a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 20V5a1.25 1.25 0 0 1 1-1.25Z" /><path d="M14 3.75V8h4M8.5 12h7M8.5 15h7M8.5 18h4" /><path d="M9 10h6" /></>,
  quizzes: <><rect x="5" y="4.5" width="14" height="17" rx="2" /><path d="M9 4.5V3.75h6v.75M8.5 10l1.5 1.5 2.5-3M14.5 10.5h2M8.5 16l1.5 1.5 2.5-3M14.5 16.5h2" /></>,
  past_papers: <><path d="M7 3.75h7l4 4V20a1.25 1.25 0 0 1-1.25 1.25h-9.5A1.25 1.25 0 0 1 6 20V5a1.25 1.25 0 0 1 1-1.25Z" /><path d="M14 3.75V8h4M9 12h6M9 15h6M9 18h3" /><path d="M4 7v13a2 2 0 0 0 2 2" /></>,
  recall: <><path d="M12 20.5s-7.75-4.1-7.75-10.1A4.15 4.15 0 0 1 12 7.8a4.15 4.15 0 0 1 7.75 2.6C19.75 16.4 12 20.5 12 20.5Z" /><path d="M8.5 12h2l1.25-2.5L14 15l1.25-3H17" /></>,
  'live-room': <><rect x="3.5" y="4" width="17" height="13" rx="2" /><path d="M8 21h8M12 17v4M8 8.5h8M8 12h5" /></>
};

export default function ResourceIllustration({ type }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      className={`resource-art resource-art-${type}`}
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {ICONS[type] || <><circle cx="12" cy="12" r="8" /><path d="M12 8v8M8 12h8" /></>}
    </svg>
  );
}
