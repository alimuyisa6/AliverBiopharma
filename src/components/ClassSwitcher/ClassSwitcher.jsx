 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import Icon from '../Icon/Icon';

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

  return (
    <div className={`class-switcher ${className}`.trim()}>
      <button
        type="button"
        className="btn btn-card class-switcher-trigger"
        onClick={() => setOpen((value) => !value)}
        disabled={switching}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <Icon name="graduation-cap" />
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
