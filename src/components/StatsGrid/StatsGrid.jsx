import { useState, useEffect, useRef } from 'react';
import Icon from '../Icon/Icon';

const ITEMS = [
  { key: 'resources_count', label: 'Resources', icon: 'book-open', accent: 'bg-primary-50 text-primary-700' },
  { key: 'users_count', label: 'Learners', icon: 'users', accent: 'bg-secondary-50 text-secondary-700' },
  { key: 'downloads_count', label: 'Downloads', icon: 'download', accent: 'bg-emerald-50 text-emerald-700' },
  { key: 'quiz_attempts', label: 'Quiz Attempts', icon: 'pen-to-square', accent: 'bg-violet-50 text-violet-700' },
];

function AnimatedNumber({ target, label, icon, accent }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const duration = 2000;
          const startTime = performance.now();
          const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target]);

  const format = (num) => (num >= 1000 ? (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k+' : num);

  return (
    <div className="flex min-w-0 flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm sm:p-5" ref={ref}>
      <span className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${accent}`}><Icon name={icon} className="h-6 w-6" /></span>
      <div className="text-2xl font-extrabold leading-none tracking-tight text-slate-900 sm:text-3xl">{format(count)}</div>
      <div className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm">{label}</div>
    </div>
  );
}

export default function StatsGrid({ stats = {} }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
      <span className="mb-3 inline-flex rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-800">Our Impact</span>
      <h2 className="text-2xl font-extrabold leading-tight tracking-tight text-primary-950 sm:text-3xl">Trusted by Learners Across Levels</h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">Every number represents a student who chose to study smarter.</p>
      <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
        {ITEMS.map((item) => (
          <AnimatedNumber key={item.key} target={stats[item.key] || 0} label={item.label} icon={item.icon} accent={item.accent} />
        ))}
      </div>
    </section>
  );
}