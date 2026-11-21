import Icon from '../Icon/Icon';

export default function Chip({ children, icon, onRemove, className = '' }) {
  return (
    <span className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold leading-5 text-slate-700 ${className}`}>
      {icon && <Icon name={icon} className="h-4 w-4 shrink-0" />}
      {children}
      {onRemove && (
        <button
          type="button"
          className="ml-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
          onClick={onRemove}
          aria-label="Remove"
        >
          <Icon name="xmark" className="h-3.5 w-3.5" />
        </button>
      )}
    </span>
  );
}