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
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <Skeleton height={120} />
      </div>
    );
  }

  const levelName = level?.display_name || level?.id || '';
  const classLabel = class_name || '';

  return (
    <section className="w-full bg-primary-50 px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-7xl rounded-3xl border border-primary-100 bg-white p-6 shadow-lg sm:p-10 lg:p-12">
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-primary-950 sm:text-5xl lg:text-6xl">
          {levelName ? (
            <>Master<br />{levelName}</>
          ) : (
            <>Master Your<br />Studies</>
          )}

          {classLabel && <span className="mt-3 block text-lg font-semibold text-secondary-800 sm:text-xl">{classLabel}</span>}
        </h1>

        <p className="mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
          {levelName
            ? `Practise curriculum-matched questions for ${levelName}${classLabel ? ` (${classLabel})` : ''} and track your progress.`
            : 'Practise key concepts, check your understanding, and track your progress.'}
        </p>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          <div className="rounded-2xl border border-border bg-background p-4 text-center sm:p-5">
            <Icon name="book-open" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold text-primary-950">{scopeStats.questions}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Questions</div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-center sm:p-5">
            <Icon name="microscope" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold text-primary-950">{scopeStats.topics}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{isPharmacy ? 'Course Units' : 'Topics'}</div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-center sm:p-5">
            <Icon name="user-graduate" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold text-primary-950">{stats?.total_learners ?? 0}</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Learners</div>
          </div>

          <div className="rounded-2xl border border-border bg-background p-4 text-center sm:p-5">
            <Icon name="chart-line" className="mx-auto h-7 w-7 text-primary-700" />
            <div className="mt-3 text-2xl font-extrabold text-primary-950">{stats?.average_pass_rate ?? 0}%</div>
            <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-600">Pass Rate</div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3" aria-label="Quiz navigation">
          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-800 shadow-sm transition hover:bg-primary-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" aria-label="Back to resources" onClick={onBack}>
            <svg className="h-6 w-6" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button type="button" className="flex h-12 w-12 items-center justify-center rounded-full border border-primary-200 bg-white text-primary-800 shadow-sm transition hover:bg-primary-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600" aria-label="View quiz cards" onClick={onNext}>
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M9.5 5.5 16 12l-6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
}
