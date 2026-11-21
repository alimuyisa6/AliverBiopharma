 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { useToast } from '../Toast/Toast';
import Icon from '../Icon/Icon';

function SwitchGlyph() {
  return (
    <svg
      className="h-5 w-5 shrink-0 text-primary-700"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M19 7H5m0 0 3-3M5 7l3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 17h14m0 0-3-3m3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ClassSwitcher({ className = '' }) {
  const { switchGroups, level, switchClass, switching, activeGroupId } = useLayout();
  const [open, setOpen] = useState(false);
  const toast = useToast();

  if (!switchGroups?.length) return null;

  const current = switchGroups.find((group) => group.id === activeGroupId) || switchGroups[0];
  const isPharmacy = /pharmacy/i.test(`${level?.display_name || ''} ${level?.name || ''}`);
  const label = isPharmacy ? 'Switch Program' : 'Switch Class';

  const handleSelect = async (groupId) => {
    if (groupId === activeGroupId) {
      setOpen(false);
      return;
    }

    try {
      await switchClass(groupId);
      setOpen(false);
      toast('Switched successfully', 'success');
    } catch (error) {
      console.error('[CLASS_SWITCHER]', error?.message || error);
      toast('Failed to switch', 'error');
    }
  };

  const isHomeSwitcher = className.split(/\s+/).includes('home-scope-switcher');\n  const safeClassName = className.split(/\\s+/).filter((name) => name !== 'home-scope-switcher').join(' ');

  return (
    <div className={`relative z-30 w-full min-w-0 max-w-full sm:w-auto sm:max-w-[15rem] ${safeClassName}`.trim()}>
      {isHomeSwitcher && <span className="mb-1 block text-[10px] font-extrabold uppercase tracking-[0.14em] text-primary-600">{label}</span>}
      <button
        type="button"
        className="flex min-h-10 w-full min-w-0 max-w-full items-center gap-2 rounded-xl border border-primary-100 bg-white px-3 py-2 text-left text-sm font-semibold text-primary-900 shadow-sm transition hover:border-primary-300 hover:bg-primary-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 disabled:cursor-wait"
        onClick={() => setOpen((value) => !value)}
        disabled={switching}
        aria-label={open ? 'Close class switcher' : label}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <SwitchGlyph />
        <span className="min-w-0 flex-1 truncate">{switching ? 'Switching…' : current?.name || 'Select'}</span>
        <Icon name="chevron-down" className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default bg-slate-950/10" onClick={() => setOpen(false)} aria-label="Close class switcher menu" />
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-50 max-h-[min(70vh,28rem)] w-[min(19rem,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl" role="menu" aria-label={label}>
            <div className="rounded-xl bg-primary-50 p-3">
              <span className="block text-[10px] font-extrabold tracking-[0.14em] text-primary-600">CURRENT LEVEL</span>
              <strong className="mt-1 block break-words text-sm text-primary-950">{level?.display_name || level?.name || 'Your learning level'}</strong>
              <span className="mt-1 block text-xs leading-5 text-slate-600">{isPharmacy ? 'Switch to a programme of your choice.' : 'Switch to a class of your choice.'}</span>
            </div>

            {switchGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-semibold transition hover:bg-primary-50 ${group.id === activeGroupId ? 'bg-primary-50 text-primary-900' : 'text-slate-700'}`}
                onClick={() => handleSelect(group.id)}
                role="menuitem"
                aria-current={group.id === activeGroupId ? 'true' : undefined}
              >
                <span>{group.name}</span>
                {group.id === activeGroupId && <Icon name="check" className="h-4 w-4 shrink-0 text-primary-700" />}
              </button>
            ))}
            <div className="my-2 border-t border-slate-100" />
            <div className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-950">
              <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 text-amber-700" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M12 3.5 19 6v5.3c0 4.2-2.8 7.4-7 9.2-4.2-1.8-7-5-7-9.2V6l7-2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
              </span>
              <span className="min-w-0"><strong className="block">Changing learning level?</strong><small className="mt-1 block text-amber-900">Level changes require admin approval.</small><a className="mt-1 inline-block font-bold text-primary-700 underline" href="/profile" onClick={() => setOpen(false)}>Request a level change</a></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
