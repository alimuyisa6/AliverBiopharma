import Icon from '../Icon/Icon';

export default function EmptyState({ icon, image, title, description, action }) {
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 px-5 py-10 text-center sm:px-8 sm:py-12">
      {image ? (
        <img src={image} alt={title || 'Empty state'} className="mb-5 max-h-40 max-w-full object-contain" loading="lazy" />
      ) : icon ? (
        <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700">
          <Icon name={icon} className="h-7 w-7" />
        </span>
      ) : null}
      {title && <h3 className="text-lg font-bold leading-7 text-slate-900">{title}</h3>}
      {description && <p className="mt-2 max-w-md text-sm leading-6 text-slate-600">{description}</p>}
      {action && <div className="mt-6 flex flex-wrap items-center justify-center gap-3">{action}</div>}
    </div>
  );
}