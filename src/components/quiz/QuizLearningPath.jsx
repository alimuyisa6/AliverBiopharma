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
      <h3 className="mb-5 flex items-start gap-3 text-xl font-bold leading-8 text-primary-950 sm:text-2xl sm:leading-9">
        <Icon name="route" className="mt-1 h-7 w-7 shrink-0 text-secondary-700" />
        Your learning<br />path{levelName ? ` in ${levelName}` : ''}
        {class_name && <span className="text-base font-semibold text-slate-600"> – {class_name}</span>}
      </h3>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {paths.map((path) => (
          <div key={path.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md">
            <Icon
              name={path.icon === 'dna' ? 'microscope' : path.icon || 'book-open'}
              className={`h-7 w-7 ${path.completed ? "text-emerald-700" : "text-primary-600"}`}
            />
            <div className="mt-3 text-base font-bold leading-6 text-primary-950">{path.topic_name}</div>
            <div className="mt-1 text-sm leading-6 text-slate-600">{path.completed ? 'Completed' : 'Upcoming'}</div>
          </div>
        ))}
      </div>
    </section>
  );
}
