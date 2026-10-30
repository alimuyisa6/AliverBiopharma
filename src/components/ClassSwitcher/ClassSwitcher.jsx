 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { useToast } from '../Toast/Toast';
import Icon from '../Icon/Icon';

function SwitchGlyph() {
  return (
    <svg
      className="class-switcher-glyph"
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

  const isHomeSwitcher = className.split(/\s+/).includes('home-scope-switcher');

  return (
    <div className={`class-switcher ${className}`.trim()}>
      {isHomeSwitcher && <span className="class-switcher-label">{label}</span>}
      <div className="btn btn-card class-switcher-trigger">
        <SwitchGlyph />
        <span>{switching ? <>Switching<span className="switching-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></> : current?.name || 'Select'}</span>
        <button
          type="button"
          className="class-switcher-chevron"
          onClick={() => setOpen((value) => !value)}
          disabled={switching}
          aria-label={open ? 'Close class switcher' : label}
          aria-haspopup="menu"
          aria-expanded={open}
        >
          <Icon name="chevron-down" />
        </button>
      </div>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-menu class-switcher-menu" role="menu" aria-label={label}>
            <div className="class-switcher-menu-intro">
              <span className="class-switcher-menu-eyebrow">CURRENT LEVEL</span>
              <strong>{level?.display_name || level?.name || 'Your learning level'}</strong>
              <span className="class-switcher-menu-caption">{isPharmacy ? 'Switch to a programme of your choice.' : 'Switch to a class of your choice.'}</span>
            </div>
            <div className="dropdown-divider" />

            {switchGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`dropdown-item class-switcher-option${group.id === activeGroupId ? ' is-active' : ''}`}
                onClick={() => handleSelect(group.id)}
                role="menuitem"
                aria-current={group.id === activeGroupId ? 'true' : undefined}
              >
                <span>{group.name}</span>
                {group.id === activeGroupId && <Icon name="circle" />}
              </button>
            ))}
            <div className="dropdown-divider" />
            <div className="class-switcher-approval-note">
              <span className="class-switcher-approval-mark" aria-hidden="true">
                <svg viewBox="0 0 24 24" focusable="false"><path d="M12 3.5 19 6v5.3c0 4.2-2.8 7.4-7 9.2-4.2-1.8-7-5-7-9.2V6l7-2.5Z" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>
              </span>
              <span><strong>Changing learning level?</strong><small>Level changes require admin approval.</small><a href="/profile" onClick={() => setOpen(false)}>Request a level change</a></span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
