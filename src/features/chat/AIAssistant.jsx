import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { streamAIAssistant } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useChat } from '../../contexts/ChatContext';
import StorysetIllustration from '../../components/StorysetIllustration';
import { UI } from '../../design-system';


function TutorIcon({ name, className = 'h-5 w-5' }) {
  const glyphs = {
    'graduation-cap': <><path d="m2 9 10-5 10 5-10 5L2 9Z"/><path d="M6 11v5c3.5 2.5 8.5 2.5 12 0v-5M22 9v6"/></>,
    xmark: <path d="m6 6 12 12M18 6 6 18"/>,
    'book-open': <><path d="M3 5a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2V5Zm18 0a2 2 0 0 0-2-2h-5a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2V5Z"/></>,
    'circle-question': <><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 4.4 1.6c-1.2 1.2-1.9 1.3-1.9 2.9M12 17h.01"/></>,
    rotate: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3"/></>,
    capsules: <><path d="M4.5 16.5a5 5 0 0 1 0-7l5-5a5 5 0 0 1 7 7l-5 5a5 5 0 0 1-7 0Z"/><path d="m8 8 8 8"/></>,
    'arrow-right': <path d="M4 12h16m-6-6 6 6-6 6"/>,
    lightbulb: <><path d="M9 18h6m-5 3h4"/><path d="M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3Z"/></>,
    'paper-plane': <><path d="m22 2-7 20-4-9-9-4 20-7Z"/><path d="M22 2 11 13"/></>,
    brain: <><path d="M12 4a3 3 0 0 0-5.7 1.2A3.5 3.5 0 0 0 5 11.5a3.5 3.5 0 0 0 2.5 6A3 3 0 0 0 12 20V4Zm0 0a3 3 0 0 1 5.7 1.2A3.5 3.5 0 0 1 19 11.5a3.5 3.5 0 0 1-2.5 6A3 3 0 0 0 12 20"/><path d="M8 8h2m4 0h2M7 13h3m4 0h3M9 17h2m2-9v3m0 4v2"/></>
  };
  return <svg viewBox="0 0 24 24" className={className} aria-hidden="true" focusable="false" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{glyphs[name] || glyphs.brain}</svg>;
}

const MODES = [
  { key: 'learn', label: 'Learn', icon: 'book-open' },
  { key: 'practice', label: 'Practice', icon: 'circle-question' },
  { key: 'review', label: 'Review', icon: 'rotate' },
  { key: 'pharmacy', label: 'Pharmacy', icon: 'capsules' },
];

const STARTERS = {
  learn: 'Explain a biology concept to me step by step.',
  practice: 'Quiz me on my current topic.',
  review: 'Help me revise the most important points.',
  pharmacy: 'Help me understand a pharmacy concept or calculation.',
};

function levelKey(level) {
  const value = typeof level === 'string'
    ? level
    : level?.slug || level?.id || level?.key || level?.name || '';

  return String(value).toLowerCase();
}

function levelLabel(level) {
  const key = levelKey(level);

  if (key.includes('pharm')) return 'Pharmacy';
  if (key.includes('a-level') || key.includes('alevel') || key.includes('senior-5') || key.includes('senior 5')) {
    return 'A-Level Biology';
  }

  return 'O-Level Biology';
}

function getStarter(mode, label) {
  if (mode === 'pharmacy') return STARTERS.pharmacy;
  return STARTERS[mode] || `Help me with ${label}.`;
}

export default function AIAssistant() {
  const { isAuthenticated } = useAuth();
  const { level } = useLayout();
  const location = useLocation();
  const navigate = useNavigate();
  const { openLiveChat } = useChat();

  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('learn');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const abortRef = useRef(null);
  const [footerOffset, setFooterOffset] = useState(0);

  useEffect(() => {
    let frame = 0;
    const updateFooterOffset = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        frame = 0;
        const footer = document.querySelector('footer');
        if (!footer) {
          setFooterOffset(0);
          return;
        }
        const footerTop = footer.getBoundingClientRect().top;
        const visibleFooter = window.innerHeight - footerTop;
        const nextOffset = visibleFooter > 0 ? Math.ceil(visibleFooter + 16) : 0;
        setFooterOffset((current) => current === nextOffset ? current : nextOffset);
      });
    };

    updateFooterOffset();
    window.addEventListener('scroll', updateFooterOffset, { passive: true });
    window.addEventListener('resize', updateFooterOffset);
    const observer = new MutationObserver(updateFooterOffset);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', updateFooterOffset);
      window.removeEventListener('resize', updateFooterOffset);
      observer.disconnect();
    };
  }, []);

  const levelName = useMemo(() => levelLabel(level), [level]);
  const pageContext = location.pathname || '/';

  useEffect(() => {
    if (!open) return;
    const node = bodyRef.current;
    if (node) node.scrollTop = node.scrollHeight;
  }, [messages, open]);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  if (!isAuthenticated) return null;

  const sendMessage = async (text = input) => {
    const content = String(text || '').trim();

    if (!content || streaming) return;

    setError('');
    setInput('');

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    };

    const assistantMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      streaming: true,
    };

    const nextMessages = [...messages, userMessage];

    setMessages((current) => [...current, userMessage, assistantMessage]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamAIAssistant(nextMessages, {
        level: levelKey(level),
        mode,
        pageContext,
        signal: controller.signal,
        onChunk: (_chunk, fullText) => {
          setMessages((current) =>
            current.map((message) =>
              message.id === assistantMessage.id
                ? { ...message, content: fullText }
                : message
            )
          );
        },
      });

      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessage.id
            ? { ...message, streaming: false }
            : message
        )
      );
    } catch (requestError) {
      if (requestError?.name === 'AbortError') return;

      setMessages((current) =>
        current.filter((message) => message.id !== assistantMessage.id)
      );
      setError(requestError?.message || 'The AI assistant could not respond.');
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const handleModeChange = (nextMode) => {
    if (streaming) return;
    setMode(nextMode);
  };

  const closeAssistant = () => {
    abortRef.current?.abort();
    setOpen(false);
  };

  const handleOpenLiveChat = () => {
    setOpen(false);
    const opened = openLiveChat();
    if (!opened) navigate('/');
  };

  return (
    <div className="fixed right-4 z-[60] flex flex-col items-end gap-3 sm:right-6" style={{ bottom: `calc(1rem + ${footerOffset}px)` }}>
      {open && (
        <section className="flex h-[min(76vh,680px)] max-h-[78vh] w-[min(92vw,430px)] min-w-0 flex-col overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-2xl shadow-slate-900/20" aria-label="AliverBiopharm AI Tutor">
          <header className="flex items-center justify-between gap-3 bg-primary-900 p-4 text-white">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white" aria-hidden="true">
                <TutorIcon name="graduation-cap" className="h-6 w-6" />
              </span>
              <div>
                <h2 className="mb-1 text-lg font-extrabold text-white">AliverBiopharm AI Tutor</h2>
                <p className="text-xs text-primary-100">{levelName} · {mode === 'pharmacy' ? 'Pharmacy learning mode' : 'Learning support'}</p>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white transition hover:bg-white/20"
              onClick={closeAssistant}
              aria-label="Close AI tutor"
            >
              <TutorIcon name="xmark" className="h-5 w-5" />
            </button>
          </header>

          <div className="grid grid-cols-4 gap-1 border-b border-border bg-slate-50 p-2" role="tablist" aria-label="AI tutor mode">
            {MODES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`inline-flex min-h-10 min-w-0 items-center justify-center gap-1 rounded-xl px-2 text-xs font-bold transition disabled:opacity-50 ${mode === item.key ? 'bg-primary-800 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-primary-800'}`}
                onClick={() => handleModeChange(item.key)}
                role="tab"
                aria-selected={mode === item.key}
                disabled={streaming}
              >
                <TutorIcon name={item.icon} className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div ref={bodyRef} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto bg-primary-50 p-3 sm:p-4">
            <button
              type="button"
              className="flex w-full items-center gap-3 rounded-2xl border border-secondary-200 bg-secondary-50 p-3 text-left text-secondary-900 transition hover:border-secondary-400 hover:bg-secondary-100"
              onClick={handleOpenLiveChat}
            >
              <svg className="h-12 w-12 shrink-0" viewBox="0 0 64 56" role="img" aria-label="Animated live chat bubbles" focusable="false">
                <g className="fill-secondary-200 stroke-secondary-800">
                  <path d="M8 7.5A5.5 5.5 0 0 1 13.5 2h25A5.5 5.5 0 0 1 44 7.5v15a5.5 5.5 0 0 1-5.5 5.5H22l-8 6v-6.3A5.5 5.5 0 0 1 8 22.5z" />
                  <path d="M16 11h20M16 17h14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                </g>
                <g className="fill-white stroke-secondary-800">
                  <path d="M24 25.5A6.5 6.5 0 0 1 30.5 19h23a6.5 6.5 0 0 1 6.5 6.5v13a6.5 6.5 0 0 1-6.5 6.5H43l-8 6v-6h-4.5a6.5 6.5 0 0 1-6.5-6.5z" />
                  <circle cx="34" cy="32" r="1.8" />
                  <circle cx="42" cy="32" r="1.8" />
                  <circle cx="50" cy="32" r="1.8" />
                </g>
                <circle className="fill-secondary-600" cx="12" cy="43" r="2" />
                <circle className="fill-secondary-600" cx="55" cy="10" r="1.5" />
              </svg>
              <span>
                <strong className="block font-extrabold">Live Chat</strong>
                <small className="block text-xs text-secondary-800">Talk to our support team</small>
              </span>
              <TutorIcon name="arrow-right" className="h-5 w-5 shrink-0" />
            </button>
            {messages.length === 0 ? (
              <div className="rounded-2xl border border-primary-100 bg-white p-4 text-center shadow-sm">
                <StorysetIllustration name="chatbot" alt="AI chatbot illustration" className="mx-auto mb-3 w-full max-w-[180px] object-contain" />
                <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-100 text-secondary-700" aria-hidden="true">
                  <TutorIcon name="lightbulb" className="h-6 w-6" />
                </span>
                <h3 className="mb-2 text-lg font-extrabold text-primary-900">Study with your AI tutor</h3>
                <p className="mb-4 text-sm leading-6 text-slate-600">Ask for an explanation, a worked example, exam practice, revision help, or pharmacy calculations.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ['learn', 'Explain this topic simply'],
                    ['practice', 'Quiz me'],
                    ['review', 'Help me revise'],
                    ['pharmacy', 'Help with a pharmacy calculation'],
                  ].map(([starterMode, label]) => (
                    <button
                      key={starterMode}
                      type="button"
                      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-xs font-bold text-primary-800 transition hover:border-primary-400 hover:bg-primary-100 disabled:opacity-50"
                      onClick={() => {
                        setMode(starterMode);
                        sendMessage(getStarter(starterMode, levelName));
                      }}
                      disabled={streaming}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`max-w-[92%] rounded-2xl border p-3 shadow-sm ${message.role === 'user' ? 'ml-auto border-primary-200 bg-primary-100 text-primary-900' : 'mr-auto border-border bg-white text-slate-800'}`}
                >
                  <div className="mb-1 text-xs font-extrabold text-primary-700">
                    {message.role === 'user' ? 'You' : 'AI Tutor'}
                  </div>
                  <div className="whitespace-pre-wrap break-words text-sm leading-6">
                    {message.content || 'Thinking…'}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className={UI.status.error} role="alert">
                {error}
              </div>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t border-border bg-white p-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendMessage();
            }}
          >
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value.slice(0, 2000))}
              onKeyDown={handleKeyDown}
              placeholder={
                mode === 'practice'
                  ? 'Answer the question or ask to be quizzed…'
                  : 'Ask your AI tutor…'
              }
              rows={1}
              maxLength={2000}
              disabled={streaming}
              aria-label="Ask AliverBiopharm AI Tutor"
             className={`${UI.inputBase} min-h-12 max-h-40 flex-1 resize-none border-border px-3 py-2`} />
            <button
              type="submit"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-800 p-0 text-white transition hover:bg-primary-900 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!input.trim() || streaming}
              aria-label="Send to AI tutor"
            >
              <TutorIcon name="paper-plane" className="h-5 w-5" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="inline-flex min-h-12 items-center gap-2 rounded-full border border-primary-600 bg-primary-800 px-4 py-3 text-sm font-extrabold text-white shadow-xl shadow-primary-900/20 transition hover:-translate-y-0.5 hover:bg-primary-900"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close AliverBiopharm AI Tutor' : 'Open AliverBiopharm AI Tutor'}
        aria-expanded={open}
      >
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white" aria-hidden="true"><TutorIcon name="brain" className="h-6 w-6" /></span>
        <span>{open ? 'Close' : 'AI Tutor'}</span>
      </button>
    </div>
  );
}