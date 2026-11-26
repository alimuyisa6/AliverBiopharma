import React from 'react';
import { highlightBiologyTerms } from '../../utils/highlightBiologyTerms';
import EmptyState from '../../components/EmptyState/EmptyState';
import { UI } from '../../design-system';

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

  const heading = (
    <header className="mb-8 max-w-3xl">
      <h2 className={UI.sectionHeroTitle}>Structured Notes for Serious Students</h2>
      <p className={UI.sectionHeroDescription}>
        Organised by topic. Everything you need for focused, efficient revision.
      </p>
    </header>
  );

  if (!hasNotes) {
    return (
      <section id="notes-section" className={`${UI.container} bg-background py-12 lg:px-8`}>
        {heading}
        <EmptyState
          icon="book-open"
          title="No study notes available for your level yet"
          description="Check back soon as new notes are added."
        />
      </section>
    );
  }

  return (
    <section id="notes-section" className={`${UI.container} bg-background py-12 lg:px-8`}>
      {heading}

      {!notesContent ? (
        <div className="grid gap-8">
          {Object.keys(safeGroupedNotes).map((topic) => (
            <section key={topic} className="grid gap-4 border-b border-border pb-7 last:border-b-0">
              <h3 className="text-xl font-bold text-primary-950">{topic}</h3>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {(safeGroupedNotes[topic] || []).filter(Boolean).map((item) => (
                  <article key={item.subtopic_id} className={UI.resourceCard}>
                    <div className={UI.resourceCardBody}>
                      <span className="mb-3 inline-flex w-fit rounded-full bg-primary-50 px-3 py-1 text-xs font-bold text-primary-800">
                        {topic}
                      </span>
                      <h4 className="text-lg font-bold leading-snug text-primary-950">{item.subtopic_name}</h4>
                      <p className="mt-2 flex-1 text-sm leading-6 text-muted">
                        {item.content_preview || item.subtopic_preview || 'Comprehensive study notes covering key concepts.'}
                      </p>
                      <button
                        type="button"
                        className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-primary-800"
                        onClick={() => onReadNote(item.subtopic_id)}
                      >
                        <i className="fa-solid fa-book-open-reader" aria-hidden="true" /> Read This Note
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        <div className="grid gap-5">
          <button
            type="button"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 transition hover:bg-primary-50"
            onClick={() => onReadNote(null)}
          >
            <i className="fa-solid fa-arrow-left" aria-hidden="true" /> Back to Notes
          </button>

          <article className={UI.readingSurface}>
            <header className={UI.readingHeader}>
              <h1 className={UI.readingTitle}>{notesContent.subtopicName || notesContent.title || 'Note'}</h1>
            </header>
            <div
              className={UI.readingContent}
              dangerouslySetInnerHTML={{
                __html: highlightBiologyTerms(notesContent.content || '<p>No content available.</p>')
              }}
            />
          </article>

          <div className="mt-3 flex flex-wrap gap-3 border-y border-border py-4" aria-label="Note reactions">
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'like' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => onReaction(notesContent.subtopicId, 'like')}
            >
              <i className="fa-regular fa-thumbs-up" aria-hidden="true" />
              <span className="text-xs font-mono font-bold">{notesReactions?.counts?.like || 0}</span>
            </button>
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'love' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => onReaction(notesContent.subtopicId, 'love')}
            >
              <i className="fa-regular fa-heart" aria-hidden="true" />
              <span>{notesReactions?.counts?.love || 0}</span>
            </button>
            <button
              type="button"
              className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${notesReactions?.user_reaction === 'helpful' ? 'border-primary-400 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
              onClick={() => onReaction(notesContent.subtopicId, 'helpful')}
            >
              <i className="fa-regular fa-lightbulb" aria-hidden="true" />
              <span>{notesReactions?.counts?.helpful || 0}</span>
            </button>
          </div>

          <section className="grid gap-4" aria-label="Note discussion">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                className={`${UI.inputBase} min-w-0 flex-1 text-sm leading-6`}
                placeholder="Add a comment..."
                value={notesCommentInput}
                onChange={(event) => onCommentInputChange(event.target.value)}
              />
              <button
                type="button"
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-primary-800"
                onClick={() => onComment(notesContent.subtopicId)}
              >
                Post
              </button>
            </div>
            <div className="grid gap-3">
              {safeNotesComments.map((comment, index) => (
                <article key={comment.id || `${comment.created_at || 'comment'}-${index}`} className="rounded-xl border border-border bg-white p-4 text-sm leading-6 text-slate-800">
                  <strong>{comment.user_name || 'User'}</strong>
                  <span className="ml-2 text-xs font-medium text-muted">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </span>
                  <p className="mt-2">{comment.comment}</p>
                </article>
              ))}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
