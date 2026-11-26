import { UI } from '../../design-system';

export default function Container({ children, className = '' }) {
  return <div className={`${UI.container} ${className}`.trim()}>{children}</div>;
}
