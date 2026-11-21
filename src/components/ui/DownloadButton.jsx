
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
      className={['inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:cursor-wait disabled:opacity-60', className].filter(Boolean).join(' ')}
      disabled={loading || disabled}
      aria-busy={loading || undefined}
      {...props}
    >
      <span className="inline-flex items-center gap-2">
        {loading ? 'Preparing download…' : children}
      </span>
    </button>
  );
}
