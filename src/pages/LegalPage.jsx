 import { useState, useEffect } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import Spinner from '../components/Spinner/Spinner';

function RichText({ text }) {
  const TOKEN_RE = /([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})|((https?:\/\/)[^\s<>"']+)/g;
  const parts = [];
  let last = 0;
  let match;

  while ((match = TOKEN_RE.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const raw = match[0];
    const isEmail = !!match[1];
    parts.push(
      <a
        key={match.index}
        href={isEmail ? `mailto:${raw}` : raw}
        target={isEmail ? undefined : '_blank'}
        rel={isEmail ? undefined : 'noopener noreferrer'}
        className="legal-link"
      >
        {raw}
      </a>
    );
    last = match.index + raw.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return <>{parts}</>;
}

export default function LegalPage({ type }) {
  const { sections, loading } = useLayout();

  if (loading || !sections) {
    return (
      <div className="info-page-loading">
        <Spinner size="lg" />
        <p>Loading page…</p>
      </div>
    );
  }

  const page = sections[type];

  return (
    <section className="legal-section">
      <div className="legal-content-wrap">
        <h1 className="legal-title">{page?.title || 'This page isn’t available'}</h1>
        {page?.sections?.length ? (
          <div className="legal-body">
            {page.sections.map((block, idx) => (
              <div key={idx} className="legal-block">
                {block.heading && <h2>{block.heading}</h2>}
                {block.content.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx}>
                    <RichText text={para} />
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="legal-empty">This page’s content hasn’t been added yet. Please check back later.</p>
        )}
      </div>
    </section>
  );
}
