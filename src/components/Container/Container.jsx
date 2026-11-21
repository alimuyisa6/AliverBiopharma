/* components/Container/Container.jsx */
export default function Container({ children, className = '' }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 ${className}`.trim()}>{children}</div>;
}