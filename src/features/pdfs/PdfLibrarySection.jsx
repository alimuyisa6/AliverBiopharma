import React from 'react';

export function PdfLibrarySection({ pdfs, onPreview }) {
  const safePdfs = Array.isArray(pdfs) ? pdfs : [];
  const topics = Array.from(new Set(safePdfs.map((pdf) => pdf.topic || 'General')));
  const topicId = (topic) => `pdf-topic-${encodeURIComponent(topic)}`;

  return (
    <section id="pdf-library" className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:px-8">
      <header className="grid gap-3 border-b border-border pb-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-primary-900 sm:text-3xl">Your study materials library</h2>
        <p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">Curated PDF resources for your level. Preview any document before downloading.</p>
      </header>

      {safePdfs.length === 0 ? (
        <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><i className="fa-solid fa-file-pdf text-2xl" aria-hidden="true" /></span>
          <p className="text-sm font-semibold text-primary-900">No PDF resources are available for your selected level yet.</p>
          <span className="text-sm text-muted">New study materials will appear here when they’re available.</span>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_240px]">
          <div className="grid min-w-0 gap-8">
            {topics.map((topic) => (
              <section id={topicId(topic)} key={topic} className="grid gap-4">
                <h3 className="border-b border-border pb-3 text-lg font-bold text-primary-900">{topic}</h3>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {safePdfs.filter((pdf) => (pdf.topic || 'General') === topic).map((pdf) => (
                    <article key={pdf.id} className="grid min-w-0 gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><i className="fa-solid fa-file-pdf text-xl" aria-hidden="true" /></span>
                      <h4 className="text-base font-bold leading-6 text-primary-900">{pdf.title && pdf.title.length > 45 ? `${pdf.title.substring(0, 42)}...` : pdf.title || 'Untitled'}</h4>
                      <p className="text-sm text-muted">{pdf.author || 'Unknown'}</p>
                      <button type="button" className="mt-2 inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary-800 px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-900" onClick={() => onPreview?.(pdf)}>
                        Preview PDF <i className="fa-solid fa-arrow-right" aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
          <aside className="grid gap-3 rounded-2xl bg-primary-50 p-4 lg:sticky lg:top-24">
            <h3 className="text-sm font-extrabold uppercase tracking-wide text-primary-900">Browse learning areas</h3>
            <nav className="grid gap-2" aria-label="PDF topics">
              {topics.map((topic) => (
                <button key={topic} type="button" className="flex min-h-12 items-center justify-between gap-3 rounded-xl bg-white px-3 py-2 text-left text-sm font-semibold text-primary-800 transition hover:bg-primary-100" onClick={() => document.getElementById(topicId(topic))?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>
                  <span>{topic}</span><span className="text-xs text-muted">{safePdfs.filter((pdf) => (pdf.topic || 'General') === topic).length}</span>
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}
    </section>
  );
}
