import Icon from '../../components/Icon/Icon';

const GROUPS = [
  {
    title: 'Learning library',
    icon: 'book-open',
    metrics: [
      { key: 'resources_count', label: 'Total resources', icon: 'library' },
      { key: 'downloadable_count', label: 'Available to download', icon: 'download' },
      { key: 'downloads_count', label: 'Total downloads', icon: 'download-cloud' }
    ]
  },
  {
    title: 'Active recall',
    icon: 'brain',
    metrics: [
      { key: 'recall_questions', label: 'Recall questions', icon: 'brain' },
      { key: 'recall_users', label: 'Learners who used Recall', icon: 'users' },
      { key: 'recall_active_users', label: 'Active Recall learners', icon: 'activity' }
    ]
  },
  {
    title: 'Quizzes',
    icon: 'clipboard-check',
    metrics: [
      { key: 'quiz_users', label: 'Quiz learners', icon: 'users' },
      { key: 'quiz_active_users', label: 'Active quiz learners', icon: 'activity' },
      { key: 'quiz_passes', label: 'Passed attempts', icon: 'check-circle' },
      { key: 'quiz_failures', label: 'Failed attempts', icon: 'x-circle' }
    ]
  }
];

function MetricCard({ metric, stats }) {
  const value = Number(stats[metric.key] || 0);
  return (
    <article className="stats-impact-card">
      <span className="stats-impact-icon" aria-hidden="true"><Icon name={metric.icon} /></span>
      <span className="stats-impact-value">{value.toLocaleString()}</span>
      <span className="stats-impact-label">{metric.label}</span>
    </article>
  );
}

export function StatsGrid({ stats = {}, scopeLabel = 'All learning levels' }) {
  const failedTopics = Array.isArray(stats.most_failed_topics) ? stats.most_failed_topics : [];

  return (
    <section className="section stats-grid-section" aria-labelledby="platform-impact-title">
      <div className="section-head stats-impact-heading">
        <div className="section-head-left">
          <h2 id="platform-impact-title">See our impact in numbers</h2>
          <p className="stats-impact-scope">Statistics for {scopeLabel}</p>
        </div>
      </div>

      <div className="stats-impact-groups">
        {GROUPS.map((group) => (
          <section className="stats-impact-group" key={group.title} aria-label={group.title}>
            <h3 className="stats-impact-group-title"><Icon name={group.icon} />{group.title}</h3>
            <div className="stats-impact-grid">
              {group.metrics.map((metric) => (
                <MetricCard key={metric.key} metric={metric} stats={stats} />
              ))}
            </div>
            {group.title === 'Quizzes' && (
              <div className="stats-impact-topics">
                <h4>Most failed topics or course units</h4>
                {failedTopics.length ? (
                  <ol>
                    {failedTopics.slice(0, 3).map((topic) => (
                      <li key={topic.unit_id || topic.name}>
                        <span>{topic.name}</span>
                        <strong>{Number(topic.failures || 0).toLocaleString()} failed</strong>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p>No failed-topic data is available for this level yet.</p>
                )}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
