import Icon from '../../components/Icon/Icon';

const GROUPS = [
  {
    id: 'book-open',
    title: 'Learning library',
    icon: 'book-open',
    metrics: [
      { key: 'resources_count', label: 'Total resources', icon: 'book-open' },
      { key: 'downloadable_count', label: 'Available to download', icon: 'download' },
      { key: 'downloads_count', label: 'Total downloads', icon: 'download' }
    ]
  },
  {
    id: 'recall',
    title: 'Active recall',
    icon: 'brain',
    metrics: [
      { key: 'recall_questions', label: 'Recall questions', icon: 'brain' },
      { key: 'recall_users', label: 'Learners who used Recall', icon: 'users' },
      { key: 'recall_active_users', label: 'Active Recall learners', icon: 'chart-line' }
    ]
  },
  {
    id: 'quizzes',
    title: 'Quizzes',
    icon: 'clipboard-check',
    hasFailedTopics: true,
    metrics: [
      { key: 'quiz_users', label: 'Quiz learners', icon: 'users' },
      { key: 'quiz_active_users', label: 'Active quiz learners', icon: 'chart-line' },
      { key: 'quiz_passes', label: 'Passed attempts', icon: 'circle-check' },
      { key: 'quiz_failures', label: 'Failed attempts', icon: 'circle-xmark' }
    ]
  }
];

function formatNumber(value) {
  return Number(value || 0).toLocaleString();
}

function MetricCard({ metric, value }) {
  return (
    <li className="stats-impact-item">
      <article className="stats-impact-card">
        <span className="stats-impact-icon" aria-hidden="true">
          <Icon name={metric.icon} />
        </span>
        <span className="stats-impact-value">{formatNumber(value)}</span>
        <span className="stats-impact-label">{metric.label}</span>
      </article>
    </li>
  );
}

function FailedTopics({ topics }) {
  return (
    <div className="stats-impact-topics">
      <h4 className="stats-impact-topics-title">
        Most failed topics or course units
      </h4>

      {topics.length ? (
        <ol className="stats-impact-topics-list">
          {topics.slice(0, 3).map((topic) => (
            <li
              className="stats-impact-topic"
              key={topic.unit_id || topic.name}
            >
              <span className="stats-impact-topic-name">{topic.name}</span>
              <strong className="stats-impact-topic-count">
                {formatNumber(topic.failures)} failed
              </strong>
            </li>
          ))}
        </ol>
      ) : (
        <p className="stats-impact-empty">
          No failed-topic data is available for this level yet.
        </p>
      )}
    </div>
  );
}

function StatsGroup({ group, stats, failedTopics }) {
  const headingId = `stats-group-${group.id}`;

  return (
    <section className="stats-impact-group" aria-labelledby={headingId}>
      <h3 className="stats-impact-group-title" id={headingId}>
        <Icon name={group.icon} />
        {group.title}
      </h3>

      <ul className="stats-impact-grid">
        {group.metrics.map((metric) => (
          <MetricCard
            key={metric.key}
            metric={metric}
            value={stats[metric.key]}
          />
        ))}
      </ul>

      {group.hasFailedTopics && <FailedTopics topics={failedTopics} />}
    </section>
  );
}

export function StatsGrid({
  stats = {},
  scopeLabel = 'All learning levels'
}) {
  const failedTopics = Array.isArray(stats.most_failed_topics)
    ? stats.most_failed_topics
    : [];

  return (
    <section
      className="section stats-grid-section lernwick-stats"
      aria-labelledby="platform-impact-title"
    >
      <header className="section-head stats-impact-heading">
        <div className="section-head-left">
          <h2 id="platform-impact-title">See Our Impact in Numbers</h2>
          <p className="stats-impact-scope">Statistics for {scopeLabel}</p>
        </div>
      </header>

      <div className="stats-impact-groups">
        {GROUPS.map((group) => (
          <StatsGroup
            key={group.id}
            group={group}
            stats={stats}
            failedTopics={failedTopics}
          />
        ))}
      </div>
    </section>
  );
}
