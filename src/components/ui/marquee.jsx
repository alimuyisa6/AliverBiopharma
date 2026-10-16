import { useEffect, useRef } from 'react';

const SPEEDS = { slow: '120s', normal: '40s', fast: '10s' };

export function Marquee({ className = '', reverse = false, pauseOnHover = false, children, vertical = false, repeat = 2, speed = 'normal', ...props }) {
  const trackRef = useRef(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return undefined;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updateMotion = () => { track.style.animationPlayState = media.matches ? 'paused' : ''; };
    updateMotion();
    media.addEventListener?.('change', updateMotion);
    return () => media.removeEventListener?.('change', updateMotion);
  }, []);

  return (
    <div
      {...props}
      className={['ab-marquee', vertical ? 'ab-marquee--vertical' : '', className].filter(Boolean).join(' ')}
      style={{ '--ab-marquee-duration': SPEEDS[speed] || SPEEDS.normal, ...props.style }}
    >
      <div ref={trackRef} className={['ab-marquee__track', vertical ? 'ab-marquee__track--vertical' : '', reverse ? 'ab-marquee__track--reverse' : '', pauseOnHover ? 'ab-marquee__track--pause-hover' : ''].filter(Boolean).join(' ')}>
        {Array.from({ length: Math.max(2, repeat) }, (_, index) => (
          <div className="ab-marquee__group" key={index} aria-hidden={index > 0 ? 'true' : undefined}>{children}</div>
        ))}
      </div>
    </div>
  );
}
