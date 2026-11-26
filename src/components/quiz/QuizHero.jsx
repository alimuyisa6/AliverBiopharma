 /* features/quiz/QuizHero.jsx */
import { useEffect, useState } from 'react';
import { getPlatformStats } from '../../api/client';
import { listQuizTopics } from '../../api/cachedClient';
import Icon from '../../components/Icon/Icon';
import Skeleton from '../../components/Skeleton/Skeleton';
import { UI } from '../../design-system';

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
      <div className={`${UI.container} py-8`}>
        <Skeleton height={120} />
      </div>
    );
  }

  const levelName = level?.display_name || level?.id || '';
  const classLabel = class_name || '';

  return (
    <section className="w-full bg-primary-50 py-8 sm:py-10 lg:py-14">
      <div className={`${UI.container} py-2 lg:px-8`}>
        <h1 className={UI.quizHeroHeading}>
          {levelName ? (
            <>Master<br />{levelName}</>
          ) : (
            <>Master Your<br />Studies</>
          )}

          {classLabel && <span className="mt-3 block text-lg font-semibold text-secondary-800 sm:text-xl">{classLabel}</span>}
        </h1>

        <p className={UI.quizHeroDescription}>
          {levelName
            ? `Practise curriculum-matched questions for ${levelName}${classLabel ? ` (${classLabel})` : ''} and track your progress.`
            : 'Practise key concepts, check your understanding, and track your progress.'}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4 lg:mt-10">
          <div className={UI.quizHeroStat}>
            <Icon name="book-open" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold leading-none text-primary-950 sm:text-3xl">{scopeStats.questions}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600">Questions</div>
          </div>

          <div className={UI.quizHeroStat}>
            <Icon name="microscope" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold leading-none text-primary-950 sm:text-3xl">{scopeStats.topics}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600">{isPharmacy ? 'Course Units' : 'Topics'}</div>
          </div>

          <div className={UI.quizHeroStat}>
            <Icon name="user-graduate" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold leading-none text-primary-950 sm:text-3xl">{stats?.total_learners ?? 0}</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600">Learners</div>
          </div>

          <div className={UI.quizHeroStat}>
            <Icon name="chart-line" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold leading-none text-primary-950 sm:text-3xl">{stats?.average_pass_rate ?? 0}%</div>
            <div className="mt-2 text-xs font-bold uppercase tracking-wider text-slate-600">Pass Rate</div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 border-t border-border pt-5" aria-label="Quiz navigation">
          <button type="button" className={`${UI.buttonBase} h-12 w-12 px-0 border border-primary-200 bg-white text-primary-800 shadow-sm hover:border-primary-700 hover:bg-primary-700 hover:text-white`} aria-label="Back to resources" onClick={onBack}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className={`${UI.buttonBase} h-12 w-12 px-0 border border-primary-200 bg-white text-primary-800 shadow-sm hover:border-primary-700 hover:bg-primary-700 hover:text-white`} aria-label="View quiz cards" onClick={onNext}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
