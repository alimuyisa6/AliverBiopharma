/* components/Grid/Grid.jsx */
const COLUMN_CLASSES = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
  6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
};

export default function Grid({ children, cols = 3, gap, className = '' }) {
  return (
    <div
      className={`grid min-w-0 ${COLUMN_CLASSES[cols] || COLUMN_CLASSES[3]} ${className}`.trim()}
      style={gap ? { gap: `var(--space-${gap})` } : undefined}
    >
      {children}
    </div>
  );
}