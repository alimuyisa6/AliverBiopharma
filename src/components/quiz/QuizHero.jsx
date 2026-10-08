 /* features/quiz/QuizHero.jsx */
import { useEffect, useState } from 'react';
import { getPlatformStats } from '../../api/client';
import { listQuizTopics } from '../../api/cachedClient';
import Icon from '../../components/Icon/Icon';
import Skeleton from '../../components/Skeleton/Skeleton';

export default function QuizHero({ level, class_name, groupId, isPharmacy = false, onBack, onNext }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scopeStats, setScopeStats] = useState({ questions: 0, topics: 0 });

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      getPlatformStats().catch(() => null),
      listQuizTopics(groupId).catch(() => ({ topics: [] }))
    ]).then(([platformStats, topicsRes]) => {
      if (cancelled) return;
      setStats(platformStats);
      const topics = Array.isArray(topicsRes?.topics) ? topicsRes.topics : [];
      setScopeStats({
        topics: topics.length,
        questions: topics.reduce((sum, topic) => sum + (Number(topic.question_count) || 0), 0)
      });
    }).finally(() => {
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, [groupId]);

  if (loading) {
    return (
      <div className="quiz-hero-loading">
        <Skeleton height={120} />
      </div>
    );
  }

  const levelName = level?.display_name || level?.id || '';
  const classLabel = class_name || '';

  return (
    <section className="section reveal quiz-hero-section">
      <div className="card quiz-hero-card card-surface-solid card-elevation-raised card-density-spacious">
        <h1 className="quiz-hero-title font-fraunces">
          {levelName ? (
            <>Master<br />{levelName}</>
          ) : (
            <>Master Your<br />Studies</>
          )}

          {classLabel && <span className="quiz-hero-classlabel font-maven-pro">{classLabel}</span>}
        </h1>

        <p className="quiz-hero-subtitle font-source-sans">
          {levelName
            ? `Build your knowledge in ${levelName}${classLabel ? ` (${classLabel})` : ''}, track progress, and master every topic.`
            : 'Build scientific knowledge, track progress, earn achievements, and master every topic.'}
        </p>

        <div className="grid grid-cols-4 quiz-hero-stats">
          <div className="stat-card card-surface-subtle card-elevation-none card-density-comfortable">
            <Icon name="book-open" className="stat-icon stat-icon-primary" />
            <div className="stat-value font-poppins">{scopeStats.questions}</div>
            <div className="stat-label font-source-sans">Questions</div>
          </div>

          <div className="stat-card card-surface-subtle card-elevation-none card-density-comfortable">
            <Icon name="microscope" className="stat-icon stat-icon-secondary" />
            <div className="stat-value font-poppins">{scopeStats.topics}</div>
            <div className="stat-label font-source-sans">{isPharmacy ? 'Course Units' : 'Topics'}</div>
          </div>

          <div className="stat-card card-surface-subtle card-elevation-none card-density-comfortable">
            <Icon name="user-graduate" className="stat-icon stat-icon-accent" />
            <div className="stat-value font-poppins">{stats?.total_learners ?? 0}</div>
            <div className="stat-label font-source-sans">Learners</div>
          </div>

          <div className="stat-card card-surface-subtle card-elevation-none card-density-comfortable">
            <Icon name="chart-line" className="stat-icon stat-icon-warm" />
            <div className="stat-value font-poppins">{stats?.average_pass_rate ?? 0}%</div>
            <div className="stat-label font-source-sans">Pass Rate</div>
          </div>
        </div>

        <div className="quiz-hero-navigation" aria-label="Quiz navigation">
          <button type="button" className="quiz-hero-nav-arrow" aria-label="Back to resources" onClick={onBack}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="quiz-hero-nav-arrow" aria-label="View quiz cards" onClick={onNext}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
