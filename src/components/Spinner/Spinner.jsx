export default function Spinner({ size = 'md', context = 'default' }) {
  const sizeClass = size === 'sm' ? 'loading-placeholder--compact' : size === 'lg' ? 'loading-placeholder--large' : '';
  const lineCount = context === 'media' ? 2 : context === 'data' ? 3 : 4;

  return (
    <div className={`loading-placeholder ${sizeClass}`.trim()} role="status" aria-label="Loading content">
      <span className="loading-placeholder__sr-only">Loading content</span>
      <span className="loading-placeholder__line loading-placeholder__line--title" />
      {Array.from({ length: lineCount - 1 }, (_, index) => (
        <span className="loading-placeholder__line" key={index} />
      ))}
    </div>
  );
}
