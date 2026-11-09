import { useEffect, useRef, useState } from 'react';
import './lernwick-stats.css';

const GROUPS = [
  {
    id: 'book-open',
    title: 'Learning library',
    metrics: [
      { key: 'resources_count', label: 'Total resources' },
      { key: 'downloadable_count', label: 'Available to download' },
      { key: 'downloads_count', label: 'Total downloads' }
    ]
  },
  {
    id: 'recall',
    title: 'Active recall',
    metrics: [
      { key: 'recall_questions', label: 'Recall questions' },
      { key: 'recall_users', label: 'Learners who used Recall' },
      { key: 'recall_active_users', label: 'Active Recall learners' }
    ]
  },
  {
    id: 'quizzes',
    title: 'Quizzes',
    metrics: [
      { key: 'quiz_users', label: 'Quiz learners' },
      { key: 'quiz_active_users', label: 'Active quiz learners' },
      { key: 'quiz_passes', label: 'Passed attempts' },
      { key: 'quiz_failures', label: 'Failed attempts' }
    ]
  }
];

function formatNumber(value) {
  return Math.round(value).toLocaleString();
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

  return <span ref={numberRef} className="stats-impact-value">{formatNumber(displayValue)}</span>;
}

function MetricValue({ value, label, detail }) {
  return (
    <div className="stats-impact-support-item">
      <AnimatedNumber value={value} />
      <span className="stats-impact-label">{label}</span>
      {detail && <small>{detail}</small>}
    </div>
  );
}

function LibraryImpact({ stats }) {
  return (
    <section className="stats-impact-feature" aria-labelledby="stats-library-title">
      <div className="stats-impact-feature-copy">
        <span className="stats-impact-eyebrow">Learning resources</span>
        <h3 id="stats-library-title">Knowledge that keeps growing.</h3>
        <p>Explore a connected library of learning materials designed to support every stage of your programme.</p>
        <div className="stats-impact-primary">
          <AnimatedNumber value={stats.resources_count} />
          <span>learning resources</span>
        </div>
      </div>
      <div className="stats-impact-support-grid">
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
    <section className="stats-impact-activity" aria-labelledby="stats-activity-title">
      <div className="stats-impact-activity-heading">
        <div>
          <span className="stats-impact-eyebrow">Learning in action</span>
          <h3 id="stats-activity-title">Practice. Test. Improve.</h3>
        </div>
        <p>See how learners are engaging with practice and assessment.</p>
      </div>
      <div className="stats-impact-activity-groups">
        <div className="stats-impact-activity-group">
          <h4>Active recall</h4>
          <div className="stats-impact-activity-values">
            <MetricValue value={stats.recall_active_users} label="Active Recall learners" />
          </div>
        </div>
        <div className="stats-impact-activity-group">
          <h4>Quizzes</h4>
          <div className="stats-impact-activity-values">
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
      <ol className="stats-impact-topics-list">
        {items.map((item, index) => (
          <li className="stats-impact-topic" key={item.key}>
            <span className="stats-impact-topic-rank">{String(index + 1).padStart(2, '0')}</span>
            <span className="stats-impact-topic-detail">
              <span className="stats-impact-topic-name">{item.name}</span>
              <span className={`stats-impact-category stats-impact-category-${String(item.type || '').toLowerCase()}`}>{item.type}</span>
            </span>
            <strong className="stats-impact-topic-count">
              {formatNumber(item.count)} {metric}
            </strong>
          </li>
        ))}
      </ol>
    ) : (
      <p className="stats-impact-empty">There is not enough recorded activity to show a ranking yet.</p>
    )
  );

  return (
    <div className="stats-impact-rankings">
      <section className="stats-impact-topics" aria-labelledby="stats-most-failed-title">
        <div className="stats-impact-topics-heading">
          <h3 className="stats-impact-topics-title" id="stats-most-failed-title">Most failed</h3>
          <p className="stats-impact-topics-description">
            Globally ranked quiz content with the highest number of failed attempts.
          </p>
        </div>
        {renderRanking(failed, 'failed')}
      </section>

      <section className="stats-impact-topics stats-impact-most-passed" aria-labelledby="stats-most-passed-title">
        <div className="stats-impact-topics-heading">
          <h3 className="stats-impact-topics-title" id="stats-most-passed-title">Most passed</h3>
          <p className="stats-impact-topics-description">
            Highest-performing content across quizzes and flashcard practice.
          </p>
        </div>
        {renderRanking(passed, 'passed')}
      </section>
    </div>
  );
}
function StatsGroup({ group, stats }) {
  const headingId = `stats-group-${group.id}`;

  return (
    <section className="stats-impact-group" aria-labelledby={headingId}>
      <h3 className="stats-impact-group-title" id={headingId}>{group.title}</h3>
      <ul className="stats-impact-grid">
        {group.metrics.map((metric) => (
          <MetricCard key={metric.key} metric={metric} value={stats[metric.key]} />
        ))}
      </ul>
    </section>
  );
}

export function StatsGrid({ stats = {}, scopeLabel = 'All learning levels' }) {
  const failedItems = Array.isArray(stats.most_failed) ? stats.most_failed : [];
  const passedItems = Array.isArray(stats.most_passed) ? stats.most_passed : [];

  return (
    <section className="section stats-grid-section lernwick-stats" aria-labelledby="platform-impact-title">
      <div className="stats-impact-panel">
        <header className="stats-impact-heading">
          <div className="stats-impact-heading-copy">
            <h2 id="platform-impact-title">Our impact in numbers</h2>
            <p className="stats-impact-scope">A snapshot of learning activity across {scopeLabel}.</p>
          </div>
        </header>

        <LibraryImpact stats={stats} />
        <LearningActivity stats={stats} />
        <PerformanceRankings failed={failedItems} passed={passedItems} />
      </div>
    </section>
  );
}
