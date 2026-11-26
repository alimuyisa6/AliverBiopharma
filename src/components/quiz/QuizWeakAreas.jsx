 /* features/quiz/QuizWeakAreas.jsx */
import { useEffect, useState } from 'react';
import { getRequest } from '../../api/client';
import Icon from '../../components/Icon/Icon';
import { UI } from '../../design-system';

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
    <section className={`${UI.container} mt-8`}>
      <div className={UI.quizWeakAreaPanel}>
        <Icon name="triangle-exclamation" className="h-8 w-8 shrink-0 text-secondary-800" />

        <div className="min-w-0 flex-1">
          <h4 className="text-lg font-bold leading-7 text-primary-950">
            Focus Areas
            {levelName && <span className="text-sm leading-6 text-slate-600"> — {levelName}{classLabel ? ` · ${classLabel}` : ''}</span>}
          </h4>

          <div className="mt-4 flex flex-wrap gap-2.5">
            {weakAreas.map((area, idx) => (
              <span key={idx} className={UI.quizWeakAreaTag}>
                {area.topic_name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
