import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams, Link, useLocation } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { highlightBiologyTerms } from '../utils/highlightBiologyTerms';
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
import PageSkeleton from '../components/Loading/PageSkeleton';
import Button from '../components/Button/Button';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import { isPremiumAccessError, redirectToSubscription } from '../utils/subscriptionNavigation';
import { UI } from '../design-system';
import { normalizeNoteReactions, calculateReadingPercentage, isReadingProgressComplete } from '../utils/noteReading';

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

export default function NoteDetail() {
  const { user } = useAuth();
  const { bootstrap } = useLayout();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [internalLinks, setInternalLinks] = useState({ inline_links: [], related_links: [], activities: { quiz: { question_count: 0 }, flashcards: [], recall: { question_count: 0 } }, related_articles: [], theme_activities: { theme_id: null, quiz: { question_count: 0 }, flashcards: { deck_count: 0 }, recall: { question_count: 0 } } });
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
      const noteCacheKey = `${user?.id || 'guest'}:${noteId}`;
      const cachedNote = noteDetailContentCache.get(noteCacheKey);
      setLoading(!cachedNote);
      setFetchError(null);
      if (!cachedNote) {
        setNote(null);
        setInternalLinks({ inline_links: [], related_links: [], activities: { quiz: { question_count: 0 }, flashcards: [], recall: { question_count: 0 } }, related_articles: [] });
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

      let data;

      try {
        data = cachedNote || await getNoteDetail(noteId);
        if (!mounted) return;

        if (data?.locked && data.reason === 'premium_locked') {
          redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
          return;
        }

        if (!data) throw new Error('Note response was empty');

        noteDetailContentCache.set(noteCacheKey, data);
        setNote(data);
        setBreadcrumb(data.breadcrumb || []);
        setToc(data.toc || []);
        setMetadata(data.metadata || {});
        setLoading(false);

        const fallbackLinks = {
          inline_links: [],
          related_links: [],
          activities: { quiz: { question_count: 0 }, flashcards: [], recall: { question_count: 0 } },
          related_articles: [],
          theme_activities: { theme_id: null, quiz: { question_count: 0 }, flashcards: { deck_count: 0 }, recall: { question_count: 0 } }
        };

        getReactions('note', data.id)
          .then(result => {
            if (mounted) setReactions(normalizeNoteReactions(result));
          })
          .catch(() => {});

        getComments('note', data.id)
          .then(result => {
            if (mounted) setComments(result?.comments || []);
          })
          .catch(() => {});

        getNoteInternalLinks(data.id)
          .then(result => {
            if (!mounted) return;
            setInternalLinks({
              inline_links: result?.inline_links || [],
              related_links: result?.related_links || [],
              activities: result?.activities || fallbackLinks.activities,
              related_articles: result?.related_articles || [],
              theme_activities: result?.theme_activities || fallbackLinks.theme_activities
            });
          })
          .catch(() => {});

        if (user) {
          getReadingProgress(noteId)
            .then(progress => {
              if (!mounted || !progress) return;
              setReadProgress(Number(progress.scroll_percentage) || 0);
              setReadingComplete(
                progress.completed === true
                && isReadingProgressComplete(progress)
              );
              if (progress.scroll_position) {
                window.requestAnimationFrame(() => {
                  if (mounted) window.scrollTo({ top: progress.scroll_position, behavior: 'auto' });
                });
              }
            })
            .catch(() => {});
        }
      } catch (error) {
        if (isPremiumAccessError(error)) {
          if (mounted) redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
          return;
        }
        console.error('[NOTE_DETAIL_LOAD_ERROR]', error);
        if (mounted) {
          setFetchError("We couldn't load this note. Please try again.");
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
      if (progressTimer.current) clearTimeout(progressTimer.current);
      if (previewTimer.current) clearTimeout(previewTimer.current);
    };
  }, [noteId, navigate, location, user]);

  useEffect(() => {
    if (!user || !note) return;

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = calculateReadingPercentage(scrollTop, docHeight);

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
        return `<a href="/notes/read?id=${link.target_note_id}" class="font-semibold text-primary-700 underline decoration-primary-300 underline-offset-4 hover:text-primary-950" data-note-link="true" data-note-id="${link.target_note_id}" data-note-title="${link.target_title}" data-note-preview="${link.target_content_preview || ''}" data-note-read-time="${link.target_read_time || ''}">${match}</a>`;
      });
    }

    return enhancedHtml;
  }, []);

  const buildContentWithMetadata = useCallback((enhancedHtml, metadata) => {
    let html = enhancedHtml || '';
    const images = metadata.images || [];
    const diagrams = metadata.diagrams || [];

    const imageHtml = (img) => {
      const caption = img.caption ? `<figcaption class="mt-3 text-center text-sm leading-6 text-muted">${img.caption}</figcaption>` : '';
      return `<figure class="my-6 grid justify-items-center gap-2 overflow-hidden rounded-2xl border border-border bg-slate-50 p-3 sm:p-5" data-image-src="${img.src}">
        <img src="${img.src}" alt="${img.caption || 'Illustration for this note'}" loading="lazy" />
        ${caption}
      </figure>`;
    };

    const diagramHtml = (diagram) => {
      if (diagram.type === 'mermaid') {
        const caption = diagram.caption ? `<figcaption class="mt-3 text-center text-sm leading-6 text-muted">${diagram.caption}</figcaption>` : '';
        return `<figure class="my-6 overflow-x-auto rounded-2xl border border-border bg-white p-4 sm:p-6">
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
    const link = event.target.closest('[data-note-link="true"]');
    if (!link) return;
    event.preventDefault();
    event.stopPropagation();
    const targetNoteId = link.dataset.noteId;
    if (!targetNoteId) return;
    navigate(`/notes/read?id=${targetNoteId}`);
  }, [navigate]);

  const handleInlineLinkHover = useCallback((event) => {
    const link = event.target.closest('[data-note-link="true"]');
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
      setReactions(normalizeNoteReactions(updated));
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
    return <div className={`${UI.container} pt-8 lg:px-8`}><PageSkeleton variant="compact" /></div>;
  }

  if (fetchError || !note) {
    return (
      <div className={`${UI.container} pt-16 lg:px-8`}>
        <EmptyState
          image={getEmptyStateImage('notes')}
          title="This note is unavailable"
          description={fetchError || 'The requested note could not be found.'}
          action={<Button onClick={() => navigate('/notes')}>Browse study notes</Button>}
        />
      </div>
    );
  }

  const enhancedContent = enhanceContentWithLinks(note.content, internalLinks.inline_links);
  const builtContent = buildContentWithMetadata(enhancedContent, metadata);
  const finalContent = highlightBiologyTerms(DOMPurify.sanitize(builtContent || '<p>Content not available.</p>', {
    USE_PROFILES: { html: true }
  }));

  return (
    <>
      {isBarFloating && createPortal(
        <div
          className="fixed left-0 top-0 z-50 h-1 w-full bg-primary-100"
          role="progressbar"
          aria-valuenow={readProgress}
          aria-valuemin="0"
          aria-valuemax="100"
        ><span className="block h-full bg-primary-600 transition-[width] duration-300" style={{ width: `${readProgress}%` }} /></div>,
        document.body
      )}

      {user && (
        <div className="fixed bottom-4 right-4 z-40 rounded-full border border-border bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-700 shadow-lg">
          <i className={`fa-solid fa-circle ${progressSaved ? 'text-emerald-500' : 'text-amber-400'}`}></i>
          {readProgress}% read {progressSaved && '· saved'}
        </div>
      )}

      {linkPreview && (
        <div
          className="fixed z-50 max-w-sm rounded-xl border border-border bg-white p-4 shadow-xl"
          style={{ left: `${linkPreviewPosition.x}px`, top: `${linkPreviewPosition.y}px` }}
          onMouseEnter={() => {
            if (previewTimer.current) clearTimeout(previewTimer.current);
          }}
          onMouseLeave={hideLinkPreview}
        >
          <strong className="block text-sm font-bold text-primary-900">{linkPreview.title}</strong>
          {linkPreview.preview && (
            <p className="mt-2 text-sm leading-6 text-muted">{linkPreview.preview.slice(0, 120)}...</p>
          )}
          {linkPreview.read_time && (
            <span className="mt-2 block font-mono text-xs text-muted">{linkPreview.read_time}</span>
          )}
        </div>
      )}

      {lightboxImage && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} className="max-h-[90vh] max-w-[95vw] rounded-xl object-contain shadow-2xl" alt="Lightbox" />
        </div>,
        document.body
      )}

      {toc.length > 0 && (
        <>
          <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-sm xl:block">
            <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-primary-900"><i className="fa-solid fa-list"></i> Contents</h4>
            <ul className="m-0 grid list-none gap-2 p-0">
              {toc.map((item, index) => (
                <li key={index} className="m-0 list-none" style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                  <a
                    href={`#${item.anchor}`}
                    className="block rounded-lg px-3 py-2 text-sm leading-5 text-muted no-underline transition hover:bg-primary-50 hover:text-primary-800"
                    onClick={(e) => handleTocLinkClick(e, item.anchor)}
                  >
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>

          <button
            className="fixed bottom-5 left-5 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary-700 text-white shadow-lg xl:hidden"
            onClick={() => setTocOpen(!tocOpen)}
            aria-label="Toggle table of contents"
          >
            <i className={`fa-solid ${tocOpen ? 'fa-xmark' : 'fa-list'} text-white`}></i>
          </button>

          {tocOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 xl:hidden" onClick={() => setTocOpen(false)}>
              <div className="mx-auto mt-12 max-h-[75vh] max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
                <h4 className="mb-4 flex items-center gap-2 text-base font-bold text-primary-900">Contents</h4>
                <ul className="m-0 grid list-none gap-2 p-0">
                  {toc.map((item, index) => (
                    <li key={index} className="m-0 list-none" style={{ paddingLeft: `${(item.level - 2) * 12}px` }}>
                      <a
                        href={`#${item.anchor}`}
                        className="block rounded-lg px-3 py-2 text-sm leading-5 text-muted no-underline transition hover:bg-primary-50 hover:text-primary-800"
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

      <div className={`${UI.container} py-8 lg:px-8`}>
        <Breadcrumb items={breadcrumb} className="mb-6" />

        <article ref={contentRef} className={UI.readingSurface}>
          <header className={UI.readingHeader}>
            <div
              ref={progressBarRef}
              className="h-1 w-full overflow-hidden bg-primary-100"
              role="progressbar"
              aria-valuenow={readProgress}
              aria-valuemin="0"
              aria-valuemax="100"
            ><span className="block h-full bg-primary-600 transition-[width] duration-300" style={{ width: `${readProgress}%` }} /></div>

            <h1 className={UI.readingTitle}>{note.title}</h1>
          </header>

          <div
            className={UI.readingContent}
            dangerouslySetInnerHTML={{ __html: finalContent || '<p>Content not available.</p>' }}
          />
        </article>

        {user && readingComplete && (
          <section className="mt-8 rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:p-7" aria-labelledby="note-understanding-title">
            <h2 id="note-understanding-title" className="font-sans">How well did you understand this note?</h2>
            <p>Choose what would help you next. This practice is separate from formal quizzes. It doesn’t award quiz XP or BioRecall XP.</p>
            <p><Link to="/learning/explanation" className="inline-flex text-sm font-semibold text-primary-800 underline underline-offset-4 hover:text-primary-950">View saved explanations</Link></p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${understanding === 'yes' ? 'border-primary-500 bg-primary-100 text-primary-950 ring-2 ring-primary-200' : 'border-primary-200 bg-white text-primary-900 hover:border-primary-400 hover:bg-primary-50'}`} onClick={handleUnderstandingYes}>
                Yes, I understand
              </button>
              <button type="button" className={`inline-flex min-h-11 items-center justify-center rounded-xl border px-4 py-2.5 text-sm font-bold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${understanding === 'no' ? 'border-primary-500 bg-primary-100 text-primary-950 ring-2 ring-primary-200' : 'border-primary-200 bg-white text-primary-900 hover:border-primary-400 hover:bg-primary-50'}`} onClick={() => setUnderstanding('no')}>
                Not yet — explain it
              </button>
            </div>

            {understanding === 'no' && (
              <form className="mt-5 grid gap-3 rounded-xl border border-border bg-white p-4" onSubmit={handleLearningQuestionSubmit}>
                <label htmlFor="note-learning-question">What would you like explained?</label>
                {learningError && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900" role="alert">{learningError}</p>}
                <textarea
                  id="note-learning-question"
                  value={learningQuestion}
                  onChange={(event) => setLearningQuestion(event.target.value.slice(0, 4000))}
                  maxLength={4000}
                  minLength={3}
                  rows={4}
                  required
                  placeholder="Tell your AI tutor what you would like explained."
                 className="block min-h-32 w-full min-w-0 resize-y rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
                <button type="submit" disabled={learningSubmitting || learningQuestion.trim().length < 3}>
                  {learningSubmitting ? 'Saving your question…' : 'Open my explanation'}
                </button>
              </form>
            )}

            {understanding === 'yes' && (
              <div className="mt-5 rounded-xl border border-secondary-200 bg-white p-5">
                <h3 className="font-sans">Quick practice</h3>
                {trialLoading ? <p>Finding practice questions for this learning area…</p> : trialQuestions.length === 0 ? (
                  <p>No practice questions are available for this learning area yet. Your progress is saved. Try another note later.</p>
                ) : trialQuestions.map((question, index) => {
                  const feedback = trialFeedback[question.id];
                  return (
                    <article className="mt-4 rounded-xl border border-border bg-white p-4" key={question.id}>
                      <h4>{index + 1}. {question.question_text}</h4>
                      {question.image_url && <img src={question.image_url} alt={question.image_alt_text || ''} loading="lazy" />}
                      <div className="mt-4 grid gap-3">
                        {question.options.map((option) => (
                          <label key={option.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 text-sm leading-6 transition ${trialAnswers[question.id] === option.key ? 'border-primary-400 bg-primary-50 text-primary-950 ring-1 ring-primary-200' : 'border-border bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'}`}>
                            <input
                              type="radio"
                              name={`trial-${question.id}`}
                              value={option.key}
                              checked={trialAnswers[question.id] === option.key}
                              onChange={() => setTrialAnswers((current) => ({ ...current, [question.id]: option.key }))}
                              disabled={!!feedback}
                             className="h-4 w-4 shrink-0 accent-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700" />
                            <span><strong>{option.key}.</strong> {option.text}</span>
                          </label>
                        ))}
                      </div>
                      {!feedback && <button type="button" onClick={() => handleTrialAnswer(question.id)} disabled={!trialAnswers[question.id]}>Check answer</button>}
                      {feedback && (
                        <div className={`mt-3 rounded-lg border p-3 text-sm font-semibold ${feedback.correct ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-amber-200 bg-amber-50 text-amber-950'}`} role="status">
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

        <LearningJourney
          unitId={note.unit_id}
          noteId={note.id}
          internalLinks={internalLinks}
          returnTo={returnToLesson || (note.unit_id ? '/notes?unit_id=' + encodeURIComponent(note.unit_id) : '/notes')}
        />

        {internalLinks.related_articles?.length > 0 && (
          <section className="mt-10" aria-labelledby="note-related-articles-title">
            <h2 id="note-related-articles-title" className="mb-4 text-2xl font-bold text-primary-900">Related reading</h2>
            <p>Continue with articles selected for this note.</p>
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {internalLinks.related_articles.map((article) => (
                <Card
                  key={article.id}
                  variant="blue-strong"
                  className="rounded-2xl border border-border bg-white shadow-sm"
                  title={article.title}
                  description={article.excerpt || article.reason || 'Read this related article'}
                  footer={article.slug ? <Link className="inline-flex min-h-10 items-center justify-center rounded-xl border border-border bg-white px-4 py-2 text-sm font-bold text-primary-800 no-underline hover:bg-primary-50" to={`/blog/${encodeURIComponent(article.slug)}`}>{article.read_time_minutes ? `${article.read_time_minutes} min read · ` : ''}Read article <span aria-hidden="true">→</span></Link> : <span>Article details unavailable</span>}
                />
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 border-t border-border pt-6" aria-label="Note feedback">
          <p className="text-sm font-semibold text-muted">Was this helpful?</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {[
              { type: 'like', icon: 'fa-thumbs-up', label: 'Helpful' },
              { type: 'love', icon: 'fa-heart', label: 'Love it' },
              { type: 'helpful', icon: 'fa-lightbulb', label: 'Insightful' }
            ].map(({ type, icon, label }) => (
              <button
                key={type}
                type="button"
                data-reaction-type={type}
                className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${reactions.user.includes(type) ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-border bg-white text-slate-700 hover:bg-slate-50'}`}
                onClick={() => handleReaction(type)}
                aria-pressed={reactions.user.includes(type)}
                disabled={reactionLoading === type}
                aria-label={`${label}: ${reactions.counts?.[type] || 0} reactions`}
              >
                {type === 'like' ? (
                  <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 21s-1.45-.86-2.7-1.72C5.4 16.55 2 13.15 2 8.9 2 5.9 4.3 3.5 7.25 3.5c1.9 0 3.6 1 4.75 2.55A5.8 5.8 0 0 1 16.75 3.5C19.7 3.5 22 5.9 22 8.9c0 4.25-3.4 7.65-7.3 10.38C13.45 20.14 12 21 12 21Z" />
                  </svg>
                ) : <i className={`fa-regular ${icon}`} aria-hidden="true" />}
                <span className="text-sm font-semibold">{label}</span>
                <span className="font-mono text-xs text-muted">{reactions.counts?.[type] || 0}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8 border-t border-border pt-6" aria-labelledby="note-discussion-title">
          <h3 id="note-discussion-title" className="mb-5 flex items-center gap-2 text-xl font-bold text-primary-900">
            <i className="fa-regular fa-comments"></i>
            Discussion {comments.length > 0 && `(${comments.length})`}
          </h3>

          {user ? (
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="text"
                className="block min-h-12 w-full min-w-0 rounded-xl border border-border bg-white px-4 py-3 text-sm leading-6 text-foreground shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                placeholder="Share a thought about this note..."
                value={commentInput}
                onChange={(event) => setCommentInput(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleComment()}
              />
              <Button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary-800" variant="primary" onClick={handleComment} disabled={!commentInput.trim() || commentSubmitting} loading={commentSubmitting} loadingLabel="Posting…">Post</Button>
            </div>
          ) : (
            <div className="text-sm text-muted">
              <p>Sign in to join the discussion</p>
              <Link to="/login" className="inline-flex min-h-10 items-center justify-center rounded-xl bg-primary-700 px-4 py-2 text-sm font-bold text-white no-underline hover:bg-primary-800">Sign In</Link>
            </div>
          )}

          <div className="mt-6 grid gap-4">
            {comments.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border bg-slate-50 p-5 text-sm text-muted">No comments yet.</p>
            ) : (
              comments.filter(Boolean).map((comment) => (
                <div key={comment.id || comment.created_at} className="rounded-xl border border-border bg-white p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <strong className="text-sm font-bold text-primary-900">{comment.user_name}</strong>
                    <span className="font-mono text-xs text-muted">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">{comment.body || comment.comment}</p>
                </div>
              ))
            )}
          </div>

        </section>

        <nav className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6" aria-label="Note navigation">
          {returnToLesson ? (
            <Link to={returnToLesson} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 no-underline hover:bg-primary-50">
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to the lesson</span>
            </Link>
          ) : (
            <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-primary-200 bg-white px-4 py-2.5 text-sm font-bold text-primary-800 no-underline hover:bg-primary-50" onClick={() => navigate(-1)}>
              <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
                <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span>Back to the lesson</span>
            </button>
          )}
          <button type="button" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white no-underline hover:bg-primary-800" onClick={handleBack}>
            <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Back to study notes</span>
          </button>
        </nav>
      </div>
    </>
  );
}
