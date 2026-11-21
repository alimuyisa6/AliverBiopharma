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

  const duration = SPEEDS[speed] || SPEEDS.normal;
  return (
    <>
      <style>{`@keyframes aliver-marquee-scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } } @keyframes aliver-marquee-scroll-vertical { from { transform: translateY(0); } to { transform: translateY(-50%); } `}</style>
      <div {...props} className={`w-full overflow-hidden ${vertical ? 'h-full' : ''} ${className}`.trim()} style={{ ...props.style }}>
        <div ref={trackRef} className={`flex w-max gap-4 ${vertical ? 'flex-col' : 'flex-row'} ${pauseOnHover ? 'hover:[animation-play-state:paused]' : ''} motion-reduce:animate-none`} style={{ animation: `${vertical ? 'aliver-marquee-scroll-vertical' : 'aliver-marquee-scroll'} ${duration} linear infinite`, animationDirection: reverse ? 'reverse' : 'normal' }}>
          {Array.from({ length: Math.max(2, repeat) }, (_, index) => (
            <div className={vertical ? "flex shrink-0 flex-col gap-4" : "flex shrink-0 flex-row gap-4"} key={index} aria-hidden={index > 0 ? 'true' : undefined}>{children}</div>
          ))}
        </div>
      </div>
    </>
  );
}
