import { useEffect, useRef, useState } from 'react';

/** Loads expensive dashboard chart modules only as their section approaches the viewport. */
export default function ChartWhenVisible({ children }) {
  const hostRef = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = hostRef.current;
    if (!node) return;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '180px 0px' });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={hostRef} className="chart-deferred" style={{ minHeight: visible ? undefined : 220 }}>
    {visible ? children : <div className="chart-loading" aria-hidden="true" />}
  </div>;
}
