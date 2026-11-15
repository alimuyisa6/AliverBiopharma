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
      <div className="curriculum-interactive-empty">
        <Icon name="diagram-project" />
        <div>
          <strong>Interactive explorer is being prepared</strong>
          <p>This lesson will show its labelled visual explorer here once the learning diagram and symbol descriptions have been reviewed and published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="curriculum-symbol-explorer">
      <div className="curriculum-symbol-explorer-intro">
        {config?.eyebrow && <span>{config.eyebrow}</span>}
        {config?.description && <p>{config.description}</p>}
      </div>
      {imageUrl && (
        <div className="curriculum-symbol-canvas">
          <img src={imageUrl} alt={config?.image_alt || config?.title || 'Interactive learning diagram'} loading="lazy" />
          {symbols.map((symbol, index) => {
            const x = Number(symbol.x);
            const y = Number(symbol.y);
            if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
            const id = String(symbol.id || symbol.label);
            return (
              <button
                key={id}
                type="button"
                className={`curriculum-symbol-hotspot${String(activeId) === id ? ' is-active' : ''}`}
                style={{ left: x + '%', top: y + '%' }}
                onClick={() => setActiveId(id)}
                aria-label={`Explore ${symbol.label}`}
                aria-pressed={String(activeId) === id}
              >{index + 1}</button>
            );
          })}
        </div>
      )}
      <div className="curriculum-symbol-explorer-content">
        <div className="curriculum-symbol-list" role="group" aria-label="Explore diagram labels">
          {symbols.map((symbol, index) => {
            const id = String(symbol.id || symbol.label);
            return (
              <button type="button" key={id} className={String(activeId) === id ? 'is-active' : ''} onClick={() => setActiveId(id)} aria-pressed={String(activeId) === id}>
                <span>{index + 1}</span>{symbol.label}
              </button>
            );
          })}
        </div>
        {active && (
          <article className="curriculum-symbol-detail" aria-live="polite">
            <span>Selected structure</span>
            <h4>{active.label}</h4>
            <p>{active.description || 'A detailed explanation for this structure will be provided in the lesson content.'}</p>
            {active.image_url && safeMediaUrl(active.image_url) && <img src={safeMediaUrl(active.image_url)} alt={active.image_alt || active.label} loading="lazy" />}
          </article>
        )}
      </div>
    </div>
  );
}
