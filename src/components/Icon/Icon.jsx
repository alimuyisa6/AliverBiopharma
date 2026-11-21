import { memo } from 'react';

const ICON_DATA = {};

const Icon = memo(function Icon({
  name,
  size,
  className,
  style,
  ...props
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size || '1.25em'}
      height={size || '1.25em'}
      className={className || undefined}
      style={style}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden={props['aria-hidden'] ?? true}
      focusable="false"
      {...props}
    />
  );
});

export default Icon;
export { ICON_DATA };
