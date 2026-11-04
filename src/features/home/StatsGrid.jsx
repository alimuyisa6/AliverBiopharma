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

function MetricCard({ metric, value }) {
  return (
    <li className="stats-impact-item">
      <AnimatedNumber value={value} />
      <span className="stats-impact-label">{metric.label}</span>
    </li>
  );
}

function FailedTopics({ topics }) {
  return (
    <section className="stats-impact-topics" aria-labelledby="stats-failed-topics-title">
      <div className="stats-impact-topics-heading">
        <h3 className="stats-impact-topics-title" id="stats-failed-topics-title">
          Most failed topics or course units
        </h3>
        <p className="stats-impact-topics-description">
          Learning areas where learners may need additional support.
        </p>
      </div>

      {topics.length ? (
        <ol className="stats-impact-topics-list">
          {topics.slice(0, 3).map((topic, index) => (
            <li className="stats-impact-topic" key={topic.unit_id || topic.name}>
              <span className="stats-impact-topic-rank">{String(index + 1).padStart(2, '0')}</span>
              <span className="stats-impact-topic-name">{topic.name}</span>
              <strong className="stats-impact-topic-count">{formatNumber(topic.failures)} failed</strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="stats-impact-empty">
          No failed-topic data is available for this level yet.
        </p>
      )}
    </section>
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
  const failedTopics = Array.isArray(stats.most_failed_topics)
    ? stats.most_failed_topics
    : [];

  return (
    <section className="section stats-grid-section lernwick-stats" aria-labelledby="platform-impact-title">
      <div className="stats-impact-panel">
        <header className="stats-impact-heading">
          <div className="stats-impact-heading-copy">
            <h2 id="platform-impact-title">Our impact in numbers</h2>
            <p className="stats-impact-scope">A snapshot of learning activity across {scopeLabel}.</p>
          </div>
        </header>

        <div className="stats-impact-groups">
          {GROUPS.map((group) => (
            <StatsGroup key={group.id} group={group} stats={stats} />
          ))}
        </div>

        <FailedTopics topics={failedTopics} />
      </div>
    </section>
  );
}
