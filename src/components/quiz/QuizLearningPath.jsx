 /* features/quiz/QuizLearningPath.jsx */
import { useEffect, useState } from 'react';
import { getRequest } from '../../api/client';
import Icon from '../../components/Icon/Icon';

export default function QuizLearningPath({ level, class_name }) {
  const [paths, setPaths] = useState([]);
  const levelId = typeof level === 'object' ? level?.id : level;

  useEffect(() => {
    if (!levelId) return;

    getRequest('interactions', 'learning-paths', { level: levelId })
      .then(setPaths)
      .catch(() => {});
  }, [levelId]);

  if (!paths.length) return null;

  const levelName = typeof level === 'object' ? level?.display_name || levelId : levelId;

  return (
    <section className="mx-auto mt-10 w-full max-w-7xl px-4 sm:px-6">
      <h3 className="mb-5 flex items-center gap-3 text-2xl font-bold leading-tight text-primary-950 sm:text-3xl">
        <Icon name="route" className="h-7 w-7 shrink-0 text-secondary-700" />
        Your learning<br />path{levelName ? ` in ${levelName}` : ''}
        {class_name && <span className="text-base font-semibold text-slate-600"> – {class_name}</span>}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((path) => (
          <div key={path.id} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
            <Icon
              name={path.icon === 'dna' ? 'microscope' : path.icon || 'book-open'}
              className={`h-7 w-7 ${path.completed ? "text-green-700" : "text-slate-500"}`}
            />
            <div className="mt-3 text-base font-bold text-primary-900">{path.topic_name}</div>
            <div className="mt-1 text-sm font-medium text-slate-600">{path.completed ? 'Completed' : 'Upcoming'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
