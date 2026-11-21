import { useState } from 'react';
import Icon from '../Icon/Icon';

export default function Accordion({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(null);

  if (!items.length) return null;

  return (
    <div className="divide-y divide-slate-200 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {items.map((item, idx) => {
        const expanded = activeIndex === idx;
        return (
          <div key={idx} className="group">
            <button
              type="button"
              className="flex min-h-14 w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-semibold leading-6 text-slate-800 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-primary-600 sm:px-5"
              onClick={() => setActiveIndex(expanded ? null : idx)}
              aria-expanded={expanded}
            >
              <span>{item.title}</span>
              <Icon name="plus" className={`h-5 w-5 shrink-0 text-primary-700 transition-transform ${expanded ? 'rotate-45' : ''}`} />
            </button>
            <div className={`grid transition-[grid-template-rows,opacity] duration-200 ${expanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="px-4 pb-4 text-sm leading-6 text-slate-600 sm:px-5">{item.content}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}