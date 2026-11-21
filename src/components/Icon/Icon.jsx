import { memo } from 'react';
import { Icon as CentralIcon } from '../../design-system.jsx';

const Icon = memo(function Icon({
  name,
  size,
  className,
  style,
  ...props
}) {
  return (
    <CentralIcon
      name={name}
      size={size ?? 'md'}
      className={className}
      style={style}
      aria-hidden={props['aria-hidden'] ?? true}
      focusable="false"
      {...props}
    />
  );
});

export default Icon;
