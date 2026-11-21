import { useMemo, useState } from 'react';
import Icon from '../Icon/Icon';

function safeMediaUrl(value) {
  const url = String(value || '').trim();
  return url.startsWith('/') || /^https:\/\//i.test(url) ? url : '';
}

export default function InteractiveSymbolExplorer({ config }) {
  const symbols = useMemo(() => Array.isArray(config?.symbols)
    ? config.symbols.filter((item) => item && String(item.label || '').trim()).slice(0, 80)
    : [], [config]);
  const [activeId, setActiveId] = useState(() => symbols[0]?.id || symbols[0]?.label || '');
  const active = symbols.find((item) => String(item.id || item.label) === String(activeId)) || symbols[0] || null;
  const imageUrl = safeMediaUrl(config?.image_url);

  if (!symbols.length) {
    return (
      <div className="flex items-start gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 sm:p-5">
        <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name="atom" className="h-6 w-6" /></span>
        <div className="min-w-0">
          <strong className="text-sm font-bold leading-5 text-slate-900">Interactive explorer is being prepared</strong>
          <p className="mt-1 text-sm leading-6 text-slate-600">This lesson will show its labelled visual explorer here once the learning diagram and symbol descriptions have been reviewed and published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="min-w-0">
        {config?.eyebrow && <span className="mb-2 inline-flex rounded-full bg-secondary-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-secondary-800">{config.eyebrow}</span>}
        {config?.description && <p className="text-sm leading-6 text-slate-600">{config.description}</p>}
      </div>
      {imageUrl && (
        <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <img className="block h-auto w-full" src={imageUrl} alt={config?.image_alt || config?.title || 'Interactive learning diagram'} loading="lazy" />
          {symbols.map((symbol, index) => {
            const x = Number(symbol.x);
            const y = Number(symbol.y);
            if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
            const id = String(symbol.id || symbol.label);
            const selected = String(activeId) === id;
            return (
              <button
                key={id}
                type="button"
                className={`absolute inline-flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-extrabold text-white shadow-md transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${selected ? 'bg-primary-800 ring-4 ring-primary-300/70' : 'bg-primary-600/90'}`}
                style={{ left: x + '%', top: y + '%' }}
                onClick={() => setActiveId(id)}
                aria-label={`Explore ${symbol.label}`}
                aria-pressed={selected}
              >{index + 1}</button>
            );
          })}
        </div>
      )}
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
        <div className="grid content-start gap-2" role="group" aria-label="Explore diagram labels">
          {symbols.map((symbol, index) => {
            const id = String(symbol.id || symbol.label);
            const selected = String(activeId) === id;
            return (
              <button type="button" key={id} className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600 ${selected ? 'border-primary-200 bg-primary-50 text-primary-900' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`} onClick={() => setActiveId(id)} aria-pressed={selected}>
                <span className={`inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${selected ? 'bg-primary-700 text-white' : 'bg-slate-100 text-slate-600'}`}>{index + 1}</span>
                <span className="min-w-0 flex-1">{symbol.label}</span>
                {selected && <Icon name="check" className="h-4 w-4 shrink-0 text-primary-700" />}
              </button>
            );
          })}
        </div>
        {active && (
          <article className="min-w-0 rounded-xl border border-primary-100 bg-primary-50/70 p-4 sm:p-5" aria-live="polite">
            <span className="text-xs font-bold uppercase tracking-wider text-primary-700">Selected structure</span>
            <h4 className="mt-2 text-lg font-bold leading-7 text-primary-950">{active.label}</h4>
            <p className="mt-2 text-sm leading-6 text-slate-700">{active.description || 'A detailed explanation for this structure will be provided in the lesson content.'}</p>
            {active.image_url && safeMediaUrl(active.image_url) && <img className="mt-4 max-h-64 w-full rounded-xl border border-slate-200 bg-white object-contain" src={safeMediaUrl(active.image_url)} alt={active.image_alt || active.label} loading="lazy" />}
          </article>
        )}
      </div>
    </div>
  );
}