/* Shared, page-level loading indicator. Never covers the whole application. */
export default function Spinner({ size, variant = 'brand', context = 'default' }) {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';

  if (context === 'media' || context === 'data') {
    const barCount = context === 'media' ? 5 : 7;
    const contextClass = context === 'media' ? 'spinner-equalizer' : 'spinner-chart';
    return (
      <div className={`spinner ${contextClass} ${sizeClass}`.trim()} role="status" aria-label="Loading">
        {Array.from({ length: barCount }, (_, index) => <span key={index} />)}
      </div>
    );
  }

  const colorClass = variant === '3d' ? 'spinner-secondary' : 'spinner-brand';
  return (
    <div
      className={`spinner spinner-conic ${colorClass} ${sizeClass}`.trim()}
      role="status"
      aria-label="Loading"
    />
  );
}
