
export default function PremiumAccessButton({ loading = false, onClick, children = 'Premium download', disabled = false }) {
  return (
    <button
      type="button"
      className={`group inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-900 shadow-sm transition hover:border-amber-300 hover:bg-amber-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-600 disabled:cursor-wait disabled:opacity-60`}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
    >
      <span className="inline-flex h-5 w-5 shrink-0" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path className="fill-none stroke-current stroke-[1.8] transition-transform group-hover:-translate-y-0.5" d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10" />
          <rect x="5" y="10" width="14" height="11" rx="2.2" className="fill-current opacity-15 stroke-current" strokeWidth="1.8" />
          <path className="fill-none stroke-current stroke-[2] stroke-linecap-round" d="M12 14.2v2.8" />
        </svg>
      </span>
      <span>{loading ? 'Checking access…' : children}</span>
    </button>
  );
}
