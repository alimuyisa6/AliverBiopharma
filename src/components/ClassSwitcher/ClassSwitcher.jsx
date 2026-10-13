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
        d="M20 7H8a4 4 0 0 0-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m7 4-3 3 3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17h12a4 4 0 0 0 4-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m17 10 3 3-3 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
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
      {isHomeSwitcher && (
        <div className="home-scope-switcher-art" aria-hidden="true">
          <svg className="scope-level-art scope-level-art--olevel" viewBox="0 0 48 48" focusable="false">
            <path d="M17 7h14M20 7v12L11 35a4 4 0 0 0 3.5 6h19a4 4 0 0 0 3.5-6L28 19V7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M15 32h18M19 26h10" fill="none" stroke="var(--primary)" strokeWidth="1.7" strokeLinecap="round"/>
            <circle cx="24" cy="35" r="2" fill="var(--primary)" opacity=".55"/>
          </svg>
          <svg className="scope-level-art scope-level-art--alevel" viewBox="0 0 48 48" focusable="false">
            <path d="M18 7h12M21 7v13L12 36a3.5 3.5 0 0 0 3 5h18a3.5 3.5 0 0 0 3-5l-9-16V7" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 31h16M19 26h10" fill="none" stroke="var(--secondary)" strokeWidth="1.7" strokeLinecap="round"/>
            <path d="M21 35l3-3 3 3" fill="none" stroke="var(--secondary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <svg className="scope-level-art scope-level-art--pharmacy" viewBox="0 0 48 48" focusable="false">
            <path d="M9 28a15 15 0 0 0 30 0H9Z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"/>
            <path d="M17 16l15 15M14 13l5 5M30 29l5 5" fill="none" stroke="var(--accent)" strokeWidth="2.2" strokeLinecap="round"/>
            <path d="M13 36h22" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
          </svg>
        </div>
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
