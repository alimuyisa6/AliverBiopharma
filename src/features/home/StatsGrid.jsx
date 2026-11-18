import { useEffect, useRef, useState } from 'react';

function formatNumber(value) {
  return Math.round(Number(value) || 0).toLocaleString();
}

function AnimatedNumber({ value }) {
  const target = Number(value) || 0;
  const [displayValue, setDisplayValue] = useState(0);
  const numberRef = useRef(null);

  useEffect(() => {
    const element = numberRef.current;
    if (!element) return undefined;
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setDisplayValue(target);
      return undefined;
    }

    let frameId;
    let observer;
    let started = false;
    const animate = () => {
      if (started) return;
      started = true;
      const startTime = performance.now();
      const duration = 1100;
      const tick = (now) => {
        const progress = Math.min((now - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 4);
        setDisplayValue(target * eased);
        if (progress < 1) frameId = requestAnimationFrame(tick);
      };
      frameId = requestAnimationFrame(tick);
    };

    observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        animate();
        observer.disconnect();
      }
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => {
      observer?.disconnect();
      if (frameId) cancelAnimationFrame(frameId);
    };
  }, [target]);

  return <span ref={numberRef}>{formatNumber(displayValue)}</span>;
}

function MetricValue({ value, label, detail }) {
  return (
    <div className="rounded-xl border border-white/15 bg-white/10 p-4">
      <strong className="block text-2xl font-extrabold tracking-tight text-white sm:text-3xl"><AnimatedNumber value={value} /></strong>
      <span className="mt-1 block text-sm font-semibold text-blue-50">{label}</span>
      {detail && <small className="mt-1 block text-xs text-blue-100/75">{detail}</small>}
    </div>
  );
}

function LibraryImpact({ stats }) {
  return (
    <section className="grid gap-7 rounded-3xl bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-6 text-white shadow-xl shadow-primary-900/10 sm:p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10" aria-labelledby="stats-library-title">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-300">Learning resources</span>
        <h3 id="stats-library-title" className="mt-3 text-2xl font-bold text-white sm:text-3xl">Knowledge that keeps growing.</h3>
        <p className="mt-4 max-w-xl text-sm leading-7 text-blue-100">Explore a connected library of learning materials designed to support every stage of your programme.</p>
        <div className="mt-7">
          <strong className="block text-4xl font-extrabold tracking-tight text-white sm:text-5xl"><AnimatedNumber value={stats.resources_count} /></strong>
          <span className="mt-1 block text-sm font-semibold text-blue-100">learning resources</span>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <MetricValue value={stats.downloadable_count} label="Available to download" />
        <MetricValue value={stats.downloads_count} label="Resource downloads" />
        <MetricValue value={stats.recall_questions} label="Recall questions" />
        <MetricValue value={stats.recall_users} label="Learners using Recall" />
      </div>
    </section>
  );
}

function LearningActivity({ stats }) {
  return (
    <section className="rounded-3xl border border-primary-100 bg-primary-50 p-6 sm:p-8" aria-labelledby="stats-activity-title">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-700">Learning in action</span>
          <h3 id="stats-activity-title" className="mt-2 text-2xl font-bold text-primary-900 sm:text-3xl">Practice. Test. Improve.</h3>
        </div>
        <p className="max-w-xl text-sm leading-7 text-slate-600">See how learners are engaging with practice and assessment.</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-primary-100 bg-white p-5">
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-primary-900">Active recall</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricValue value={stats.recall_active_users} label="Active Recall learners" />
          </div>
        </div>
        <div className="rounded-2xl border border-primary-100 bg-white p-5">
          <h4 className="mb-4 text-sm font-extrabold uppercase tracking-wider text-primary-900">Quizzes</h4>
          <div className="grid gap-3 sm:grid-cols-2">
            <MetricValue value={stats.quiz_users} label="Quiz learners" />
            <MetricValue value={stats.quiz_active_users} label="Active quiz learners" />
            <MetricValue value={stats.quiz_passes} label="Passed attempts" />
            <MetricValue value={stats.quiz_failures} label="Failed attempts" />
          </div>
        </div>
      </div>
    </section>
  );
}

function PerformanceRankings({ failed, passed }) {
  const renderRanking = (items, metric) => (
    items.length ? (
      <ol className="m-0 grid list-none gap-2 p-0">
        {items.map((item, index) => (
          <li className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3" key={item.key}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-xs font-extrabold text-primary-800">{String(index + 1).padStart(2, '0')}</span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-bold text-primary-900">{item.name}</span>
              <span className="mt-0.5 text-xs font-semibold text-slate-500">{item.type}</span>
            </span>
            <strong className="shrink-0 text-xs font-bold text-slate-700">{formatNumber(item.count)} {metric}</strong>
          </li>
        ))}
      </ol>
    ) : (
      <p className="rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-500">There is not enough recorded activity to show a ranking yet.</p>
    )
  );

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="stats-most-failed-title">
        <h3 className="text-xl font-bold text-primary-900" id="stats-most-failed-title">Most failed</h3>
        <p className="mt-2 mb-5 text-sm leading-6 text-slate-600">Globally ranked quiz content with the highest number of failed attempts.</p>
        {renderRanking(failed, 'failed')}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="stats-most-passed-title">
        <h3 className="text-xl font-bold text-primary-900" id="stats-most-passed-title">Most passed</h3>
        <p className="mt-2 mb-5 text-sm leading-6 text-slate-600">Highest-performing content across quizzes and flashcard practice.</p>
        {renderRanking(passed, 'passed')}
      </section>
    </div>
  );
}

export function StatsGrid({ stats = {}, scopeLabel = 'All learning levels' }) {
  const failedItems = Array.isArray(stats.most_failed) ? stats.most_failed : [];
  const passedItems = Array.isArray(stats.most_passed) ? stats.most_passed : [];

  return (
    <section className="w-full bg-white px-5 py-16 sm:px-8 sm:py-20 lg:px-12" aria-labelledby="platform-impact-title">
      <div className="mx-auto max-w-7xl">
        <header className="mb-9">
          <span className="text-xs font-extrabold uppercase tracking-[0.16em] text-secondary-700">Platform statistics</span>
          <h2 id="platform-impact-title" className="mt-3 text-3xl font-bold text-primary-900 sm:text-4xl">Our impact in numbers</h2>
          <p className="mt-3 text-sm leading-7 text-slate-600">A snapshot of learning activity across {scopeLabel}.</p>
        </header>
        <div className="grid gap-5">
          <LibraryImpact stats={stats} />
          <LearningActivity stats={stats} />
          <PerformanceRankings failed={failedItems} passed={passedItems} />
        </div>
      </div>
    </section>
  );
}
