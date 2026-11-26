import React from 'react';
import { highlightBiologyTerms } from '../../utils/highlightBiologyTerms';

export function NotesSection({
  groupedNotes,
  notesContent,
  notesReactions,
  notesComments,
  notesCommentInput,
  onReadNote,
  onReaction,
  onComment,
  onCommentInputChange
}) {
  const safeGroupedNotes = groupedNotes || {};
  const safeNotesComments = notesComments || [];
  const hasNotes = Object.keys(safeGroupedNotes).length > 0;

  if (!hasNotes) {
    return (
      <section id="notes-section" className="mx-auto w-full max-w-7xl bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="mx-auto w-full">
          <div className="mb-8 max-w-3xl">
            
            <h2 className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">Structured Notes for Serious Students</h2>
            <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
              Organised by topic. Everything you need for focused, efficient revision.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-white shadow-sm">
            <div className="p-5 sm:p-7">
              <div className="flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
                <i className="fa-solid fa-book-open text-3xl text-primary-700" aria-hidden="true"></i>
                <p>No study notes available for your level yet.</p>
                <span>Check back soon as new notes are added.</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="notes-section" className="mx-auto w-full max-w-7xl bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full">
        <div className="mb-8 max-w-3xl">
          
          <h2 className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">Structured Notes for Serious Students</h2>
          <p className="mt-4 text-base leading-7 text-muted sm:text-lg">
            Organised by topic. Everything you need for focused, efficient revision.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-white shadow-sm">
          <div className="p-5 sm:p-7">
            {!notesContent ? (
              <div className="grid gap-8">
                {Object.keys(safeGroupedNotes).map(topic => (
                  <div key={topic} className="rounded-2xl border border-border bg-slate-50 p-5 sm:p-6">
                    <h4 className="mb-4 text-xl font-bold text-primary-950">{topic}</h4>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                      {(safeGroupedNotes[topic] || [])
                        .filter(Boolean)
                        .map(item => (
                          <div key={item.subtopic_id} className="rounded-xl border border-border bg-white shadow-sm">
                            <div className="flex h-full flex-col p-5">
                              <span className="mb-3 inline-flex w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">{topic}</span>
                              <h3 className="text-lg font-bold leading-snug text-primary-950">{item.subtopic_name}</h3>
                              <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                                {item.content_preview ||
                                  item.subtopic_preview ||
                                  'Comprehensive study notes covering key concepts.'}
                              </p>
                              <button
                                className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
                                onClick={() => onReadNote(item.subtopic_id)}
                              >
                                <i className="fa-solid fa-book-open-reader"></i> Read This Note
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5">
                <button
                  className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:bg-primary-50"
                  onClick={() => onReadNote(null)}
                >
                  <i className="fa-solid fa-arrow-left"></i> Back to Notes
                </button>
                <div className="rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-8">
                  <h1 className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">{notesContent.subtopicName || notesContent.title || 'Note'}</h1>
                  <div
                    className="mt-6 max-w-none text-slate-800 leading-7 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-primary-950 [&_h3]:mt-6 [&_h3]:text-xl [&_h3]:font-bold [&_p]:my-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_img]:my-5 [&_img]:max-w-full [&_img]:rounded-xl [&_table]:my-5 [&_table]:w-full [&_table]:border-collapse [&_th]:bg-primary-50 [&_th]:p-3 [&_td]:border [&_td]:border-border [&_td]:p-3"
                    dangerouslySetInnerHTML={{
                      __html: highlightBiologyTerms(notesContent.content || '<p>No content available.</p>')
                    }}
                  />
                  <div className="mt-8 flex flex-wrap gap-3 border-y border-border py-4">
                    <button type="button"
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'like' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => onReaction(notesContent.subtopicId, 'like')}
                    >
                      <i className="fa-regular fa-thumbs-up"></i>
                      <span className="text-xs font-mono font-bold">{notesReactions?.counts?.like || 0}</span>
                    </button>
                    <button type="button"
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'love' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => onReaction(notesContent.subtopicId, 'love')}
                    >
                      <i className="fa-regular fa-heart"></i>
                      <span>{notesReactions?.counts?.love || 0}</span>
                    </button>
                    <button type="button"
                      className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'helpful' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
                      onClick={() => onReaction(notesContent.subtopicId, 'helpful')}
                    >
                      <i className="fa-regular fa-lightbulb"></i>
                      <span>{notesReactions?.counts?.helpful || 0}</span>
                    </button>
                  </div>
                  <div className="mt-8 grid gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <input
                        type="text"
                        className="block min-h-12 w-full min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100"
                        placeholder="Add a comment..."
                        value={notesCommentInput}
                        onChange={e => onCommentInputChange(e.target.value)}
                      />
                      <button type="button"
                        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-800"
                        onClick={() => onComment(notesContent.subtopicId)}
                      >
                        Post
                      </button>
                    </div>
                    <div className="grid gap-3">
                      {safeNotesComments.filter(Boolean).map((c, idx) => (
                        <div key={idx} className="rounded-xl border border-border bg-slate-50 p-4 text-sm leading-6 text-slate-800">
                          <strong>{c.user_name || 'User'}</strong>
                          <span className="ml-2 text-xs font-medium text-muted">
                            {new Date(c.created_at).toLocaleDateString()}
                          </span>
                          <br />
                          {c.comment}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
