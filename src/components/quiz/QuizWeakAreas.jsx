 /* features/quiz/QuizWeakAreas.jsx */
import { useEffect, useState } from 'react';
import { getRequest } from '../../api/client';
import Icon from '../../components/Icon/Icon';

export default function QuizWeakAreas({ user, level, class_name }) {
  const [weakAreas, setWeakAreas] = useState([]);

  useEffect(() => {
    if (!user) return;

    getRequest('interactions', 'weak-areas')
      .then(setWeakAreas)
      .catch(() => {});
  }, [user]);

  if (!weakAreas.length) return null;

  const levelName = level?.display_name || level?.id || '';
  const classLabel = class_name || '';

  return (
    <section className="mx-auto mt-8 w-full max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-secondary-200 bg-secondary-50 p-5 sm:flex-row sm:items-start sm:p-6">
        <Icon name="triangle-exclamation" className="h-8 w-8 shrink-0 text-secondary-800" />

        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold leading-7 text-primary-950">
            Focus Areas
            {levelName && <span className="text-sm leading-6 text-slate-600"> — {levelName}{classLabel ? ` · ${classLabel}` : ''}</span>}
          </h4>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {weakAreas.map((area, idx) => (
              <span key={idx} className="rounded-full border border-secondary-300 bg-white px-3 py-2 text-sm font-semibold leading-5 text-secondary-900 shadow-sm">
                {area.topic_name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
