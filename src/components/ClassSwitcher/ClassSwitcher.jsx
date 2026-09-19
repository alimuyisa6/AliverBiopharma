 /* components/ClassSwitcher/ClassSwitcher.jsx */
import { useState } from 'react';
import { useLayout } from '../../contexts/LayoutContext';
import Icon from '../Icon/Icon';

export default function ClassSwitcher({ className = '' }) {
  const { groups, level, switchClass, switching, activeGroupId } = useLayout();
  const [open, setOpen] = useState(false);

  if (!groups?.length) return null;

  const current = groups.find((group) => group.id === activeGroupId) || groups[0];
  const label = level?.group_label || 'Class';

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

            {groups.map((group) => (
              <button
                key={group.id}
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
