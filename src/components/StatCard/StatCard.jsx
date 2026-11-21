import Icon from '../Icon/Icon';

export default function StatCard({ icon, value, label, color }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5">
      {icon && <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name={icon === 'dna' ? 'microscope' : icon} className="h-6 w-6" style={color ? { color: `var(--${color})` } : undefined} /></span>}
      <div className="break-words text-2xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-3xl">{value}</div>
      <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">{label}</div>
    </div>
  );
}