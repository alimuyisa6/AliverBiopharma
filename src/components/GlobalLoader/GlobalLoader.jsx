import { useEffect } from 'react';

export default function GlobalLoader({
  tagline = 'Welcome to biology & pharmacy',
  onAnimationComplete
}) {
  useEffect(() => {
    if (!onAnimationComplete) return undefined;
    const timer = window.setTimeout(onAnimationComplete, 1300);
    return () => window.clearTimeout(timer);
  }, [onAnimationComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-950 px-5 text-center text-white" role="status" aria-live="polite" aria-label="Loading AliverBiopharm">
      <div className="flex w-full max-w-sm flex-col items-center">
        <p className="m-0 text-3xl font-black tracking-tight sm:text-4xl">AliverBiopharm</p>
        <p className="mt-3 text-sm font-medium leading-6 text-primary-100">{tagline}</p>
        <div className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-white/15" aria-hidden="true"><span className="block h-full w-1/2 animate-[loader_1.3s_ease-in-out_infinite] rounded-full bg-secondary-400" /></div>
        <span className="mt-4 text-xs font-semibold text-primary-200">Loading your learning space…</span>
      </div>
    </div>
  );
}