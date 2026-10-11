 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import { useToast } from '../Toast/Toast';
import Icon from '../Icon/Icon';

function SwitchGlyph() {
  return (
    <svg className="class-switcher-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 7h10l-2.5-2.5M17 17H7l2.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 7v3M7 17v-3" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
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
      {isHomeSwitcher && (
        <svg className="home-scope-switcher-art" viewBox="0 0 320 100" aria-hidden="true" focusable="false">
          <path d="M24 77C64 77 62 24 104 24S145 77 184 77 224 24 296 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".13" />
          <path d="M24 77H72M104 24H145M184 77H232M256 24H296" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity=".13" />
          <circle cx="24" cy="77" r="5" fill="var(--primary)" opacity=".18" />
          <circle cx="104" cy="24" r="6" fill="var(--secondary)" opacity=".2" />
          <circle cx="184" cy="77" r="5" fill="var(--primary)" opacity=".18" />
          <circle cx="256" cy="24" r="6" fill="var(--accent)" opacity=".18" />
          <circle cx="296" cy="24" r="3" fill="currentColor" opacity=".18" />
        </svg>
      )}
      {isHomeSwitcher && <span className="class-switcher-label">{label}</span>}
      <button
        type="button"
        className="btn btn-card class-switcher-trigger"
        onClick={() => setOpen((value) => !value)}
        disabled={switching}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <SwitchGlyph />
        <span>{switching ? <>Switching<span className="switching-dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></> : current?.name || 'Select'}</span>
        <Icon name="chevron-down" />
      </button>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-menu">
            <div className="dropdown-item dropdown-heading" aria-hidden="true">
              {label}
            </div>
            <div className="dropdown-divider" />

            {switchGroups.map((group) => (
              <button
                key={group.id}
                type="button"
                className={`dropdown-item${group.id === activeGroupId ? ' is-active' : ''}`}
                onClick={() => handleSelect(group.id)}
              >
                <span>{group.name}</span>
                {group.id === activeGroupId && <Icon name="check" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
