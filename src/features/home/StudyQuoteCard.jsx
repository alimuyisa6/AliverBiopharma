import './StudyQuoteCard.css';

export default function StudyQuoteCard() {
  return (
    <aside className="study-quote-card" aria-label="Study inspiration">
      <div className="study-quote-card-mark" aria-hidden="true">
        <svg viewBox="0 0 48 40" focusable="false">
          <path d="M4 21.5C4 10.7 10.2 4.8 20 3.5v7.2c-4.7 1.2-7.2 3.9-7.5 7.8h7.1v16H4v-13Zm23 0C27 10.7 33.2 4.8 43 3.5v7.2c-4.7 1.2-7.2 3.9-7.5 7.8h7.1v16H27v-13Z" fill="currentColor" />
        </svg>
      </div>
      <div className="study-quote-card-content">
        <span className="eyebrow">A thought for your next study session</span>
        <blockquote>Understand the process, not just the answer.</blockquote>
        <p>Build connections. Ask why. Let understanding make remembering easier.</p>
      </div>
      <div className="study-quote-card-orbit" aria-hidden="true">
        <svg viewBox="0 0 120 120" focusable="false">
          <circle cx="60" cy="60" r="42" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 5" />
          <ellipse cx="60" cy="60" rx="18" ry="42" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(45 60 60)" />
          <ellipse cx="60" cy="60" rx="18" ry="42" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(-45 60 60)" />
          <circle cx="60" cy="60" r="6" fill="currentColor" />
          <circle cx="99" cy="47" r="4" fill="var(--secondary)" />
        </svg>
      </div>
    </aside>
  );
}
