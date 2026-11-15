import './DownloadButton.css';

export default function DownloadButton({
  children = 'Download',
  loading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={['buttonDownload', loading ? 'is-loading' : '', className].filter(Boolean).join(' ')}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className="buttonDownload-label">
        {loading ? 'Preparing download…' : children}
      </span>
    </button>
  );
}
