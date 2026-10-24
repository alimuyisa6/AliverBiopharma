const RESOURCE_GLYPHS = {
  notes: '▤',
  flashcards: '▣',
  pdfs: 'PDF',
  quizzes: '✓',
  past_papers: '▤',
  recall: '↻',
  'live-room': '▣'
};

export default function ResourceIllustration({ type }) {
  return (
    <span className={`resource-art resource-art-${type}`} aria-hidden="true">
      {RESOURCE_GLYPHS[type] || '＋'}
    </span>
  );
}
