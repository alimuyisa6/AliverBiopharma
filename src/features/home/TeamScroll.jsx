 /* features/home/TeamScroll.jsx */
import { useRef, useEffect, useCallback } from 'react';

const AUTO_SCROLL_SPEED = 0.6;
const RESUME_DELAY_MS = 2500;
const MANUAL_STEP = 300;

export function TeamScroll({ members }) {
  const trackRef = useRef(null);
  const pausedRef = useRef(false);
  const resumeTimeoutRef = useRef(null);
  const rafRef = useRef(null);

  const safeMembers = Array.isArray(members) ? members.filter(Boolean) : [];
  const loopMembers = safeMembers.length > 1 ? [...safeMembers, ...safeMembers] : safeMembers;

  useEffect(() => {
    if (!safeMembers.length) return;
    const track = trackRef.current;
    if (!track) return;
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    function step() {
      if (!pausedRef.current && track) {
        track.scrollLeft += AUTO_SCROLL_SPEED;
        const halfWidth = track.scrollWidth / 2;
        if (halfWidth > 0 && track.scrollLeft >= halfWidth) {
          track.scrollLeft -= halfWidth;
        }
      }
      rafRef.current = requestAnimationFrame(step);
    }
    rafRef.current = requestAnimationFrame(step);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    };
  }, [safeMembers.length]);

  const pause = useCallback(() => {
    pausedRef.current = true;
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
  }, []);

  const scheduleResume = useCallback(() => {
    if (resumeTimeoutRef.current) clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = setTimeout(() => {
      pausedRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  const scrollByStep = useCallback((direction) => {
    pause();
    trackRef.current?.scrollBy({ left: direction * MANUAL_STEP, behavior: 'smooth' });
    scheduleResume();
  }, [pause, scheduleResume]);

  if (!safeMembers.length) return null;

  return (
    <section className="w-full bg-secondary-50 py-12 sm:py-16">
      <div className="mx-auto grid w-full max-w-7xl gap-7 px-4 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-2xl font-extrabold text-primary-900 sm:text-3xl">Meet the minds behind the platform</h2>
          <span className="text-sm text-muted">Our educators and contributors</span>
        </header>
        <div className="relative min-w-0">
          <button type="button" className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-primary-800 shadow-md transition hover:bg-primary-50 sm:inline-flex" onClick={() => scrollByStep(-1)} aria-label="Scroll faculty left"><i className="fa-solid fa-chevron-left" aria-hidden="true" /></button>
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-1 pb-4 sm:px-8" ref={trackRef} onMouseEnter={pause} onMouseLeave={scheduleResume} onTouchStart={pause} onTouchEnd={scheduleResume} onPointerDown={pause} onPointerUp={scheduleResume}>
            {loopMembers.map((member, index) => (
              <article key={`${member.name}-${index}`} className="flex w-[min(82vw,280px)] shrink-0 snap-start flex-col items-center rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
                <div className="mb-4 flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-primary-100 text-primary-700">
                  {member.avatar_url ? <img src={member.avatar_url} alt={member.name} className="h-full w-full object-cover" loading="lazy" /> : <i className="fa-solid fa-user-tie text-3xl" aria-hidden="true" />}
                </div>
                <h3 className="text-lg font-extrabold text-primary-900">{member.name}</h3>
                <p className="mt-1 text-sm font-semibold text-secondary-700">{member.title || 'Faculty Member'}</p>
                {member.bio && <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted">{member.bio}</p>}
                <div className="mt-auto flex gap-2 pt-4">
                  {member.linkedin && <a href={member.linkedin} target="_blank" rel="noreferrer" aria-label={`${member.name} on LinkedIn`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary-700 hover:bg-primary-50"><i className="fa-brands fa-linkedin-in" aria-hidden="true" /></a>}
                  {member.twitter && <a href={member.twitter} target="_blank" rel="noreferrer" aria-label={`${member.name} on X`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border text-primary-700 hover:bg-primary-50"><i className="fa-brands fa-x-twitter" aria-hidden="true" /></a>}
                </div>
              </article>
            ))}
          </div>
          <button type="button" className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-border bg-white text-primary-800 shadow-md transition hover:bg-primary-50 sm:inline-flex" onClick={() => scrollByStep(1)} aria-label="Scroll faculty right"><i className="fa-solid fa-chevron-right" aria-hidden="true" /></button>
        </div>
      </div>
    </section>
  );
}
