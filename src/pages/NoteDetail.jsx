import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import {
  getNoteDetail,
  getReactions,
  toggleReaction,
  addComment,
  getComments,
  saveReadingProgress,
  getReadingProgress,
  getNoteInternalLinks,
  createNoteLearningThread,
  getNoteTrialQuestions,
  checkNoteTrialAnswer
} from '../api/client';
import Card from '../components/Card/Card';
import EmptyState from '../components/EmptyState/EmptyState';
import Spinner from '../components/Spinner/Spinner';
import Button from '../components/Button/Button';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';

const noteDetailContentCache = new Map();

let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = new Promise((resolve, reject) => {
      if (window.mermaid) {
        resolve(window.mermaid);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js';
      script.onload = () => resolve(window.mermaid);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
  return mermaidPromise;
}

function normalizeReactions(data) {
  return {
    counts: data?.counts || {},
    user: Array.isArray(data?.user_reactions) ? data.user_reactions : []
  };
}

export default function NoteDetail() {
  const { user } = useAuth();
  const { bootstrap } = useLayout();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const noteId = searchParams.get('id');
  const requestedReturnTo = searchParams.get('return_to') || '';
  const returnToLesson = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '';

  const [note, setNote] = useState(null);
  const [breadcrumb, setBreadcrumb] = useState([]);
  const [reactions, setReactions] = useState({ counts: {}, user: [] });
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [readProgress, setReadProgress] = useState(0);
  const [progressSaved, setProgressSaved] = useState(false);
  const [readingComplete, setReadingComplete] = useState(false);
  const [understanding, setUnderstanding] = useState(null);
  const [learningQuestion, setLearningQuestion] = useState('');
  const [learningError, setLearningError] = useState('');
  const [learningSubmitting, setLearningSubmitting] = useState(false);
  const [trialQuestions, setTrialQuestions] = useState([]);
  const [trialAnswers, setTrialAnswers] = useState({});
  const [trialFeedback, setTrialFeedback] = useState({});
  const [trialLoading, setTrialLoading] = useState(false);
  const [internalLinks, setInternalLinks] = useState({ inline_links: [], related_links: [] });
  const [linkPreview, setLinkPreview] = useState(null);
  const [linkPreviewPosition, setLinkPreviewPosition] = useState({ x: 0, y: 0 });
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [isBarFloating, setIsBarFloating] = useState(false);
  const [toc, setToc] = useState([]);
  const [metadata, setMetadata] = useState({});
  const [tocOpen, setTocOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const [reactionLoading, setReactionLoading] = useState(null);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const contentRef = useRef(null);
  const progressTimer = useRef(null);
  const startTime = useRef(Date.now());
  const previewTimer = useRef(null);
  const progressBarObserver = useRef(null);

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);
    return component?.properties?.image_url || null;
  }

  useEffect(() => {
    if (!noteId) {
      navigate('/notes');
      return;
    }

    let mounted = true;

    const init = async () => {
      const cachedNote = noteDetailContentCache.get(noteId);
      setLoading(!cachedNote);
      setFetchError(null);
      if (!cachedNote) {
        setNote(null);
        setInternalLinks({ inline_links: [], related_links: [] });
        setComments([]);
        setReactions({ counts: {}, user: [] });
        setReadProgress(0);
        setToc([]);
        setMetadata({});
      } else {
        setLoading(false);
        setNote(cachedNote);
        setBreadcrumb(cachedNote.breadcrumb || []);
        setToc(cachedNote.toc || []);
        setMetadata(cachedNote.metadata || {});
      }

      try {
        const data = cachedNote || await getNoteDetail(noteId);
        if (!mounted) return;
        noteDetailContentCache.set(noteId, data);

        setNote(data);
        setBreadcrumb(data.breadcrumb || []);
        setToc(data.toc || []);
        setMetadata(data.metadata || {});

        const [reactionResult, commentResult, linksResult] = await Promise.allSettled([
          getReactions('note', data.id),
          getComments('note', data.id),
          getNoteInternalLinks(data.id)
        ]);

        if (!mounted) return;

        const reactionData = reactionResult.status === 'fulfilled' ? reactionResult.value : { counts: {}, user_reactions: [] };
        const commentData = commentResult.status === 'fulfilled' ? commentResult.value : { comments: [] };
        const linksData = linksResult.status === 'fulfilled' ? linksResult.value : { inline_links: [], related_links: [] };

        setReactions(normalizeReactions(reactionData));
        setComments(commentData?.comments || []);
        setInternalLinks({
          inline_links: linksData?.inline_links || [],
          related_links: linksData?.related_links || []
        });

        if (user) {
          const progress = await getReadingProgress(noteId);
          if (mounted && progress) {
            setReadProgress(Number(progress.scroll_percentage) || 0);
            setReadingComplete(
              progress.completed === true
              && Number(progress.scroll_percentage) >= 90
              && Number(progress.time_spent) >= 30
            );
            if (progress.scroll_position) {
              setTimeout(() => {
                window.scrollTo({ top: progress.scroll_position, behavior: 'smooth' });
              }, 500);
            }
          }
        }
      } catch (error) {
        console.error('[NOTE_DETAIL_LOAD_ERROR]', error);
        if (mounted) setFetchError("We couldn't load this note. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    return () => {
      mounted = false;
      if (progressTimer.current) clearTimeout(progressTimer.current);
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [noteId, navigate, user]);

  useEffect(() => {
    if (!user || !note) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = docHeight > 0 ? Math.round((scrollTop / docHeight) * 100) : 0;

      setReadProgress(percentage);

      if (progressTimer.current) clearTimeout(progressTimer.current);

      progressTimer.current = setTimeout(async () => {
        const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
        try {
          const savedProgress = await saveReadingProgress(noteId, percentage, scrollTop, timeSpent);
          setReadingComplete(savedProgress?.completed === true);
          setProgressSaved(true);
          setTimeout(() => setProgressSaved(false), 2000);
        } catch {}
      }, 1500);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [user, note, noteId]);

  const progressBarRef = useCallback((node) => {
    if (progressBarObserver.current) {
      progressBarObserver.current.disconnect();
      progressBarObserver.current = null;
    }

    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsBarFloating(false);
          return;
        }
        setIsBarFloating(entry.boundingClientRect.top < 0);
      },
      { threshold: 0 }
    );

    observer.observe(node);
    progressBarObserver.current = observer;
  }, []);

  const enhanceContentWithLinks = useCallback((html, inlineLinks) => {
    if (!html || !inlineLinks.length) return html;

    let enhancedHtml = html;

    for (const link of inlineLinks) {
      if (!link.link_text) continue;

      const escapedText = link.link_text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedText})`, 'gi');

      enhancedHtml = enhancedHtml.replace(regex, (match) => {
        return `<a href="/notes/read?id=${link.target_note_id}" class="note-inline-link" data-note-id="${link.target_note_id}" data-note-title="${link.target_title}" data-note-preview="${link.target_content_preview || ''}" data-note-read-time="${link.target_read_time || ''}">${match}</a>`;
      });
    }

    return enhancedHtml;
  }, []);

  const buildContentWithMetadata = useCallback((enhancedHtml, metadata) => {
    let html = enhancedHtml || '';
    const images = metadata.images || [];
    const diagrams = metadata.diagrams || [];

    const imageHtml = (img) => {
      const caption = img.caption ? `<figcaption class="note-image-caption">${img.caption}</figcaption>` : '';
      return `<figure class="note-image-wrapper" data-image-src="${img.src}">
        <img src="${img.src}" alt="${img.caption || 'Illustration for this note'}" loading="lazy" />
        ${caption}
      </figure>`;
    };

    const diagramHtml = (diagram) => {
      if (diagram.type === 'mermaid') {
        const caption = diagram.caption ? `<figcaption class="note-image-caption">${diagram.caption}</figcaption>` : '';
        return `<figure class="note-mermaid-wrapper">
          <div class="mermaid">${diagram.code}</div>
          ${caption}
        </figure>`;
      }
      return '';
    };

    const topItems = [...images.filter(i => i.position === 'top'), ...diagrams.filter(d => d.position === 'top')];
    if (topItems.length) {
      html = topItems.map(item => item.type ? diagramHtml(item) : imageHtml(item)).join('') + html;
    }

    const bottomItems = [...images.filter(i => i.position === 'bottom'), ...diagrams.filter(d => d.position === 'bottom')];
    if (bottomItems.length) {
      html += bottomItems.map(item => item.type ? diagramHtml(item) : imageHtml(item)).join('');
    }

    const inlineItems = [...images.filter(i => i.position === 'inline'), ...diagrams.filter(d => d.position === 'inline')];
    for (const item of inlineItems) {
      if (!item.anchor) continue;
      const anchorId = item.anchor;
      const headingRegex = new RegExp(`<h[23][^>]*id="${anchorId}"[^>]*>.*?</h[23]>`, 'i');
      const insertHtml = item.type ? diagramHtml(item) : imageHtml(item);
      html = html.replace(headingRegex, (match) => `${match}${insertHtml}`);
    }

    return html;
  }, []);

  const handleInlineLinkClick = useCallback((event) => {
    const link = event.target.closest('.note-inline-link');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    const targetNoteId = link.dataset.noteId;
    if (!targetNoteId) return;
    navigate(`/notes/read?id=${targetNoteId}`);
  }, [navigate]);

  const handleInlineLinkHover = useCallback((event) => {
    const link = event.target.closest('.note-inline-link');
    if (!link) {
      hideLinkPreview();
      return;
    }

    const rect = link.getBoundingClientRect();
    setLinkPreview({
      title: link.dataset.noteTitle,
      preview: link.dataset.notePreview,
      read_time: link.dataset.noteReadTime
    });
    setLinkPreviewPosition({ x: rect.left, y: rect.bottom + 8 });
  }, []);

  const hideLinkPreview = useCallback(() => {
    setLinkPreview(null);
  }, []);

  const handleContentClick = useCallback((event) => {
    if (event.target.tagName === 'IMG') {
      setLightboxImage(event.target.src);
    }
  }, []);

  useEffect(() => {
    const contentElement = contentRef.current;
    if (!contentElement) return;

    contentElement.addEventListener('click', handleInlineLinkClick);
    contentElement.addEventListener('click', handleContentClick);
    contentElement.addEventListener('mouseover', handleInlineLinkHover);
    contentElement.addEventListener('mouseout', hideLinkPreview);

    return () => {
      contentElement.removeEventListener('click', handleInlineLinkClick);
      contentElement.removeEventListener('click', handleContentClick);
      contentElement.removeEventListener('mouseover', handleInlineLinkHover);
      contentElement.removeEventListener('mouseout', hideLinkPreview);
    };
  }, [handleInlineLinkClick, handleInlineLinkHover, hideLinkPreview, handleContentClick, note, internalLinks]);

  useEffect(() => {
    if (!contentRef.current) return;
    const mermaidElements = contentRef.current.querySelectorAll('.mermaid');
    if (mermaidElements.length === 0) return;

    let cancelled = false;

    loadMermaid()
      .then((mermaid) => {
        if (cancelled) return;
        mermaid.initialize({ startOnLoad: false, theme: 'default' });
        mermaid.run({ nodes: mermaidElements });
      })
      .catch((err) => console.error('Mermaid loading failed', err));

    return () => {
      cancelled = true;
    };
  }, [note, metadata]);

  async function handleUnderstandingYes() {
    setUnderstanding('yes');
    setTrialLoading(true);
    setTrialAnswers({});
    setTrialFeedback({});
    try {
      const result = await getNoteTrialQuestions(noteId);
      setTrialQuestions(Array.isArray(result?.questions) ? result.questions : []);
    } catch {
      setTrialQuestions([]);
    } finally {
      setTrialLoading(false);
    }
  }

  async function handleLearningQuestionSubmit(event) {
    event.preventDefault();
    const question = learningQuestion.trim();
    if (question.length < 3 || learningSubmitting) return;

    setLearningError('');
    setLearningSubmitting(true);
    try {
      const result = await createNoteLearningThread(noteId, question);
      if (!result?.thread?.id) throw new Error('Learning thread was not created');
      navigate('/learning/explanation?id=' + encodeURIComponent(result.thread.id) + (returnToLesson ? '&return_to=' + encodeURIComponent(returnToLesson) : ''));
    } catch (error) {
      setLearningError(error?.message || "We couldn't save your question. Please try again.");
    } finally {
      setLearningSubmitting(false);
    }
  }

  async function handleTrialAnswer(questionId) {
    const selectedOption = trialAnswers[questionId];
    if (!selectedOption || trialFeedback[questionId]) return;

    try {
      const result = await checkNoteTrialAnswer(noteId, questionId, selectedOption);
      setTrialFeedback((current) => ({ ...current, [questionId]: result }));
    } catch {
      setTrialFeedback((current) => ({
        ...current,
        [questionId]: { error: "We couldn't check your answer. Please try again." }
      }));
    }
  }

  async function handleReaction(reactionType) {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      await toggleReaction('note', noteId, reactionType);
      const updated = await getReactions('note', noteId);
      setReactions(normalizeReactions(updated));
    } catch {}
  }

  async function handleComment() {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!commentInput.trim()) return;

    try {
      await addComment('note', noteId, commentInput.trim());
      setCommentInput('');
      const updated = await getComments('note', noteId);
      setComments(updated?.comments || []);
    } catch {}
  }

  function handleBack() {
    const unitId = note?.unit_id;
    navigate(unitId
      ? `/notes?unit_id=${encodeURIComponent(unitId)}&highlight=${encodeURIComponent(noteId)}`
      : `/notes?highlight=${encodeURIComponent(noteId)}`
    );
  }

  function handleTocLinkClick(e, anchor) {
    e.preventDefault();
    const element = document.getElementById(anchor);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTocOpen(false);
    }
  }

  if (loading) {
    return <div className="fcd-loading-wrap"><Spinner size="lg" /></div>;
  }

  if (fetchError || !note) {
    return (
      <div className="section" style={{ paddingTop: 'var(--space-16)' }}>
        <EmptyState
          image={getEmptyStateImage('notes')}
          title="This note is unavailable"
          description={fetchError || 'The requested note could not be found.'}
          action={<Button onClick={() => navigate('/notes')}>Browse Notes</Button>}
        />
      </div>
    );
  }

  const enhancedContent = enhanceContentWithLinks(note.content, internalLinks.inline_links);
  const builtContent = buildContentWithMetadata(enhancedContent, metadata);
  const finalContent = DOMPurify.sanitize(builtContent || '<p>Content not available.</p>', {
    USE_PROFILES: { html: true }
  });

  return (
    <>
      {isBarFloating && createPortal(
        <div
          className="note-progress-bar note-progress-bar--floating"
          style={{ '--progress-width': `${readProgress}%` }}
          role="progressbar"
          aria-valuenow={readProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        />,
        document.body
      )}

      {user && (
        <div className="note-progress-indicator font-mono">
          <i className={`fa-solid fa-circle-check ${progressSaved ? 'progress-saved' : 'progress-unsaved'}`}></i>
          {readProgress}% read {progressSaved && '· saved'}
        </div>
      )}

      {linkPreview && (
        <div
          className="note-link-preview"
          style={{ left: `${linkPreviewPosition.x}px`, top: `${linkPreviewPosition.y}px` }}
          onMouseEnter={() => {
            if (previewTimer.current) clearTimeout(previewTimer.current);
          }}
          onMouseLeave={hideLinkPreview}
        >
          <strong className="note-link-preview-title font-poppins">{linkPreview.title}</strong>
          {linkPreview.preview && (
            <p className="note-link-preview-text font-source-sans">{linkPreview.preview.slice(0, 120)}...</p>
          )}
          {linkPreview.read_time && (
            <span className="note-link-preview-readtime font-mono">{linkPreview.read_time}</span>
          )}
        </div>
      )}

      {lightboxImage && createPortal(
        <div className="note-lightbox-overlay" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} className="note-lightbox-image" alt="Lightbox" />
        </div>,
        document.body
      )}

      {toc.length > 0 && (
        <>
          <aside className="note-toc-sidebar">
            <h4 className="note-toc-title font-poppins"><i className="fa-solid fa-list"></i> Contents</h4>
            <ul className="note-toc-list">
              {toc.map((item, index) => (
                <li key={index} className="note-toc-item" style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                  <a
                    href={`#${item.anchor}`}
                    className="note-toc-link font-source-sans"
                    onClick={(e) => handleTocLinkClick(e, item.anchor)}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <button
            className="note-toc-mobile-toggle"
            onClick={() => setTocOpen(!tocOpen)}
            aria-label="Toggle table of contents"
          >
            <i className={`fa-solid ${tocOpen ? 'fa-xmark' : 'fa-list'}`}></i>
          </button>

          {tocOpen && (
            <div className="note-toc-mobile-overlay" onClick={() => setTocOpen(false)}>
              <div className="note-toc-mobile-panel" onClick={(e) => e.stopPropagation()}>
                <h4 className="note-toc-title font-poppins">Contents</h4>
                <ul className="note-toc-list">
                  {toc.map((item, index) => (
                    <li key={index} className="note-toc-item" style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                      <a
                        href={`#${item.anchor}`}
                        className="note-toc-link font-source-sans"
                        onClick={(e) => handleTocLinkClick(e, item.anchor)}
                      >
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      <div className="note-detail-container">
        <Breadcrumb items={breadcrumb} className="note-breadcrumb" />

        <article ref={contentRef} className="note-article">
          <div className="note-hero">
            <div
              ref={progressBarRef}
              className="note-progress-bar"
              style={{ '--progress-width': `${readProgress}%` }}
              role="progressbar"
              aria-valuenow={readProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            />

            <h1 className="note-title font-fraunces">{note.title}</h1>
          </div>

          <div
            className="notes-content-container font-open-sans"
            dangerouslySetInnerHTML={{ __html: finalContent || '<p>Content not available.</p>' }}
          />
        </article>

        {user && readingComplete && (
          <section className="note-understanding-panel" aria-labelledby="note-understanding-title">
            <h2 id="note-understanding-title" className="font-poppins">How well did you understand this note?</h2>
            <p>Choose what would help you next. This practice is separate from formal quizzes and doesn’t award quiz or BioRecall XP.</p>
            <p><Link to="/learning/explanation" className="note-learning-history-link">View your saved explanations</Link></p>
            <div className="note-understanding-actions">
              <button type="button" className={`note-understanding-choice${understanding === 'yes' ? ' is-selected' : ''}`} onClick={handleUnderstandingYes}>
                Yes, I understand
              </button>
              <button type="button" className={`note-understanding-choice${understanding === 'no' ? ' is-selected' : ''}`} onClick={() => setUnderstanding('no')}>
                Not yet — explain it
              </button>
            </div>

            {understanding === 'no' && (
              <form className="note-learning-question-form" onSubmit={handleLearningQuestionSubmit}>
                <label htmlFor="note-learning-question">What would you like explained?</label>
                {learningError && <p className="note-learning-error" role="alert">{learningError}</p>}
                <textarea
                  id="note-learning-question"
                  value={learningQuestion}
                  onChange={(event) => setLearningQuestion(event.target.value.slice(0, 4000))}
                  maxLength={4000}
                  minLength={3}
                  rows={4}
                  required
                  placeholder="Tell your AI tutor which idea, step, or term you would like explained."
                />
                <button type="submit" disabled={learningSubmitting || learningQuestion.trim().length < 3}>
                  {learningSubmitting ? 'Saving your question…' : 'Open my explanation'}
                </button>
              </form>
            )}

            {understanding === 'yes' && (
              <div className="note-trial-questions">
                <h3 className="font-poppins">Quick practice</h3>
                {trialLoading ? <p>Finding practice questions for this topic…</p> : trialQuestions.length === 0 ? (
                  <p>No practice questions are available for this topic yet. Your progress is saved, so try another note or come back later.</p>
                ) : trialQuestions.map((question, index) => {
                  const feedback = trialFeedback[question.id];
                  return (
                    <article className="note-trial-question" key={question.id}>
                      <h4>{index + 1}. {question.question_text}</h4>
                      {question.image_url && <img src={question.image_url} alt={question.image_alt_text || ''} loading="lazy" />}
                      <div className="note-trial-options">
                        {question.options.map((option) => (
                          <label key={option.key} className={trialAnswers[question.id] === option.key ? 'is-selected' : ''}>
                            <input
                              type="radio"
                              name={`trial-${question.id}`}
                              value={option.key}
                              checked={trialAnswers[question.id] === option.key}
                              onChange={() => setTrialAnswers((current) => ({ ...current, [question.id]: option.key }))}
                              disabled={!!feedback}
                            />
                            <span><strong>{option.key}.</strong> {option.text}</span>
                          </label>
                        ))}
                      </div>
                      {!feedback && <button type="button" onClick={() => handleTrialAnswer(question.id)} disabled={!trialAnswers[question.id]}>Check answer</button>}
                      {feedback && (
                        <div className={`note-trial-feedback${feedback.correct ? ' is-correct' : ' is-incorrect'}`} role="status">
                          {feedback.error || (feedback.correct ? 'Correct.' : 'Not quite.')}
                          {feedback.explanation && <p>{feedback.explanation}</p>}
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {internalLinks.related_links.length > 0 && (
          <div className="note-related-section">
            <h3 className="note-related-title font-poppins"><i className="fa-solid fa-link"></i> Related notes</h3>
            <div className="note-related-grid">
              {internalLinks.related_links.map((link) => (
                <Card
                  key={link.link_id}
                  variant="blue-strong"
                  className="card-mixed"
                  title={link.target_title}
                  description={link.target_content_preview}
                  footer={<span className="note-related-link-readtime font-mono">{link.target_read_time}</span>}
                  onClick={() => navigate(`/notes/read?id=${link.target_note_id}`)}
                />
              ))}
            </div>
          </div>
        )}

        <div className="note-reactions-section">
          <p className="note-reactions-label font-source-sans">Was this helpful?</p>
          <div className="note-reactions-buttons">
            {[
              { type: 'like', icon: 'fa-thumbs-up', label: 'Helpful' },
              { type: 'love', icon: 'fa-heart', label: 'Love it' },
              { type: 'helpful', icon: 'fa-lightbulb', label: 'Insightful' }
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                data-reaction-type={type}
                className={`note-reaction-btn ${type === 'like' ? 'note-reaction-btn-like' : ''} ${reactions.user.includes(type) ? 'active' : ''}`}
                onClick={() => handleReaction(type)}
                aria-pressed={reactions.user.includes(type)}
                disabled={reactionLoading === type}
                aria-label={`${label}: ${reactions.counts?.[type] || 0} reactions`}
              >
                {type === 'like' ? (
                  <svg className="note-like-heart" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s-1.45-.86-2.7-1.72C5.4 16.55 2 13.15 2 8.9 2 5.9 4.3 3.5 7.25 3.5c1.9 0 3.6 1 4.75 2.55A5.8 5.8 0 0 1 16.75 3.5C19.7 3.5 22 5.9 22 8.9c0 4.25-3.4 7.65-7.3 10.38C13.45 20.14 12 21 12 21Z" />
                  </svg>
                ) : <i className={`fa-regular ${icon}`} aria-hidden="true" />}
                <span className="note-reaction-label">{label}</span>
                <span className="note-reaction-count font-mono">{reactions.counts?.[type] || 0}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="note-comments-section">
          <h3 className="note-comments-title font-poppins">
            <i className="fa-regular fa-comments"></i>
            Discussion {comments.length > 0 && `(${comments.length})`}
          </h3>

          {user ? (
            <div className="note-comment-input-wrapper">
              <input
                type="text"
                className="note-comment-input"
                placeholder="Share a thought or ask a question..."
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleComment()}
              />
              <Button className="note-comment-submit font-outfit" variant="primary" onClick={handleComment} disabled={!commentInput.trim() || commentSubmitting} loading={commentSubmitting} loadingLabel="Posting…">Post</Button>
            </div>
          ) : (
            <div className="note-comment-signin font-source-sans">
              <p>Sign in to join the discussion</p>
              <Link to="/login" className="btn-primary note-signin-btn">Sign In</Link>
            </div>
          )}

          <div className="note-comments-list">
            {comments.length === 0 ? (
              <p className="note-comments-empty font-open-sans">No comments yet.</p>
            ) : (
              comments.filter(Boolean).map((comment) => (
                <div key={comment.id || comment.created_at} className="note-comment-item">
                  <div className="note-comment-header">
                    <strong className="note-comment-author font-poppins">{comment.user_name}</strong>
                    <span className="note-comment-date font-mono">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="note-comment-text font-source-sans">{comment.body || comment.comment}</p>
                </div>
              ))
            )}
          </div>

          <div className="note-discussion-art" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 150" role="presentation" focusable="false" width="320" height="150">
              <ellipse cx="160" cy="130" rx="91" ry="7" fill="#0d9488" opacity=".10" />
              <g strokeLinejoin="round" strokeLinecap="round">
                <rect x="42" y="28" width="136" height="82" rx="18" fill="#d9f7f0" stroke="#0d9488" strokeWidth="2.5" />
                <path d="M70 110 61 124 91 110" fill="#d9f7f0" stroke="#0d9488" strokeWidth="2.5" />
                <path d="M69 54h80M69 69h57" fill="none" stroke="#0d9488" strokeWidth="5" />
                <rect x="142" y="55" width="136" height="70" rx="17" fill="#fff1c9" stroke="#b8873a" strokeWidth="2.5" />
                <path d="M244 125 257 138 257 125" fill="#fff1c9" stroke="#b8873a" strokeWidth="2.5" />
                <path d="M166 78h83M166 93h60" fill="none" stroke="#b8873a" strokeWidth="5" />
              </g>
              <path d="m222 17 4 9 10 2-8 6 1 10-7-6-9 4 4-9-6-8 10 1Z" fill="#e2c06a" stroke="#b8873a" strokeWidth="1.5" strokeLinejoin="round" />
              <path d="m85 15 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z" fill="#8ad8cb" />
              <circle cx="292" cy="40" r="4" fill="#7c3aed" opacity=".65" />
              <circle cx="28" cy="86" r="4" fill="#e2c06a" />
              <path d="M285 75c8-12 17-11 22-5-2 10-10 15-22 5Zm0 0c-1-9-7-13-14-11 0 8 5 12 14 11Z" fill="#0d9488" opacity=".8" />
            </svg>
            <p className="note-discussion-art-caption">Every thoughtful question helps us grow.</p>
          </div>
        </div>

        <nav className="note-bottom-navigation" aria-label="Note navigation">
          {returnToLesson ? (
            <Link to={returnToLesson} className="note-return-to-lesson-link note-nav-button">
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to Lesson</span>
            </Link>
          ) : (
            <button type="button" className="note-return-to-lesson-link note-nav-button" onClick={() => navigate(-1)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to Lesson</span>
            </button>
          )}
          <button type="button" className="note-back-btn note-back-bottom note-nav-button" onClick={handleBack}>
            <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back to Notes</span>
          </button>
        </nav>
      </div>
    </>
  );
}
