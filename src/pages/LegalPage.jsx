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
        className="font-semibold text-primary-700 underline underline-offset-4 hover:text-primary-900"
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
    <section className="legal-page w-full px-5 py-14 sm:py-20" style={{ backgroundColor: '#F3F6F9' }}>
      <div className="legal-content mx-auto w-full max-w-4xl rounded-3xl border border-slate-200 bg-white px-6 py-8 shadow-sm sm:px-10 sm:py-12">
        <h1 className="mb-10 border-b border-slate-200 pb-7 text-4xl font-extrabold text-primary-900 sm:text-5xl">{page?.title || 'This page isn’t available'}</h1>
        {page?.sections?.length ? (
          <div className="space-y-9">
            {page.sections.map((block, idx) => (
              <div key={idx} className="space-y-4 rounded-2xl p-5 sm:p-6" style={{ backgroundColor: ['#E8F4F2', '#EAF2FA', '#F1EDFA', '#F8F1E7'][idx % 4] }}>
                {block.heading && <h2 className={idx % 2 === 1 ? "legal-section-heading legal-section-heading-alt" : "legal-section-heading"}>{block.heading}</h2>}
                {block.content.split('\n\n').map((para, pIdx) => (
                  <p key={pIdx}>
                    <RichText text={para} />
                  </p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl bg-primary-50 p-5 text-slate-700">This page’s content hasn’t been added yet. Please check back later.</p>
        )}
      </div>
    </section>
  );
}
