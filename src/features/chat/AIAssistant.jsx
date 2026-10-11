import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import { streamAIAssistant } from '../../api/client';
import { useAuth } from '../../contexts/AuthContext';
import { useLayout } from '../../contexts/LayoutContext';
import { useChat } from '../../contexts/ChatContext';

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
    <div className="ai-assistant">
      {open && (
        <section className="ai-assistant-panel" aria-label="AliverBiopharm AI Tutor">
          <header className="ai-assistant-header">
            <div className="ai-assistant-heading">
              <span className="ai-assistant-avatar" aria-hidden="true">
                <Icon name="graduation-cap" />
              </span>
              <div>
                <h2>AliverBiopharm AI Tutor</h2>
                <p>{levelName} · {mode === 'pharmacy' ? 'Pharmacy learning mode' : 'Learning support'}</p>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-ghost btn-sm btn-icon btn-round ai-assistant-close"
              onClick={closeAssistant}
              aria-label="Close AI tutor"
            >
              <Icon name="xmark" />
            </button>
          </header>

          <div className="ai-assistant-modes" role="tablist" aria-label="AI tutor mode">
            {MODES.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`ai-assistant-mode${mode === item.key ? ' is-active' : ''}`}
                onClick={() => handleModeChange(item.key)}
                role="tab"
                aria-selected={mode === item.key}
                disabled={streaming}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div ref={bodyRef} className="ai-assistant-body">
            <button
              type="button"
              className="ai-assistant-live-chat"
              onClick={handleOpenLiveChat}
            >
              <svg className="live-chat-animation" viewBox="0 0 64 56" role="img" aria-label="Animated live chat bubbles" focusable="false">
                <g className="live-chat-bubble live-chat-bubble-back">
                  <path d="M8 7.5A5.5 5.5 0 0 1 13.5 2h25A5.5 5.5 0 0 1 44 7.5v15a5.5 5.5 0 0 1-5.5 5.5H22l-8 6v-6.3A5.5 5.5 0 0 1 8 22.5z" />
                  <path className="live-chat-bubble-line" d="M16 11h20M16 17h14" />
                </g>
                <g className="live-chat-bubble live-chat-bubble-front">
                  <path d="M24 25.5A6.5 6.5 0 0 1 30.5 19h23a6.5 6.5 0 0 1 6.5 6.5v13a6.5 6.5 0 0 1-6.5 6.5H43l-8 6v-6h-4.5a6.5 6.5 0 0 1-6.5-6.5z" />
                  <circle cx="34" cy="32" r="1.8" />
                  <circle cx="42" cy="32" r="1.8" />
                  <circle cx="50" cy="32" r="1.8" />
                </g>
                <circle className="live-chat-spark" cx="12" cy="43" r="2" />
                <circle className="live-chat-spark live-chat-spark-two" cx="55" cy="10" r="1.5" />
              </svg>
              <span>
                <strong>Live Chat</strong>
                <small>Talk to our support team</small>
              </span>
              <Icon name="arrow-right" />
            </button>
            {messages.length === 0 ? (
              <div className="ai-assistant-welcome">
                <span className="ai-assistant-welcome-icon" aria-hidden="true">
                  <Icon name="lightbulb" />
                </span>
                <h3>Study with your AI tutor</h3>
                <p>
                  Ask for an explanation, a worked example, exam practice, revision help,
                  or pharmacy calculations.
                </p>
                <div className="ai-assistant-starters">
                  {[
                    ['learn', 'Explain this topic simply'],
                    ['practice', 'Quiz me'],
                    ['review', 'Help me revise'],
                    ['pharmacy', 'Help with a pharmacy calculation'],
                  ].map(([starterMode, label]) => (
                    <button
                      key={starterMode}
                      type="button"
                      className="ai-assistant-starter"
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
                  className={`ai-assistant-message ai-assistant-message-${message.role}`}
                >
                  <div className="ai-assistant-message-label">
                    {message.role === 'user' ? 'You' : 'AI Tutor'}
                  </div>
                  <div className="ai-assistant-message-content">
                    {message.content || 'Thinking…'}
                  </div>
                </div>
              ))
            )}

            {error && (
              <div className="ai-assistant-error" role="alert">
                {error}
              </div>
            )}
          </div>

          <form
            className="ai-assistant-input"
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
            />
            <button
              type="submit"
              className="btn btn-primary ai-assistant-send"
              disabled={!input.trim() || streaming}
              aria-label="Send to AI tutor"
            >
              <Icon name="paper-plane" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        className="ai-assistant-toggle"
        onClick={() => setOpen((current) => !current)}
        aria-label={open ? 'Close AliverBiopharm AI Tutor' : 'Open AliverBiopharm AI Tutor'}
        aria-expanded={open}
      >
        <Icon name={open ? 'xmark' : 'graduation-cap'} />
        <span>{open ? 'Close' : 'AI Tutor'}</span>
      </button>
    </div>
  );
}
