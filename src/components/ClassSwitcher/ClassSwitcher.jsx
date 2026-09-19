 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
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

  if (!switchGroups?.length) return null;

  const current = switchGroups.find((group) => group.id === activeGroupId) || switchGroups[0];
  const label = level?.group_label || 'Class / Program';

  const handleSelect = async (groupId) => {
    if (groupId === activeGroupId) {
      setOpen(false);
      return;
    }

    await switchClass(groupId);
    setOpen(false);
  };

  const isHomeSwitcher = className.split(/\s+/).includes('home-scope-switcher');

  return (
    <div className={`class-switcher ${className}`.trim()}>
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
        <span>{switching ? 'Switching...' : current?.name || 'Select'}</span>
        <Icon name="chevron-down" />
      </button>

      {open && (
        <>
          <div className="dropdown-backdrop" onClick={() => setOpen(false)} />
          <div className="dropdown-menu">
            <div className="dropdown-item dropdown-heading" aria-hidden="true">
              Switch {label}
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
