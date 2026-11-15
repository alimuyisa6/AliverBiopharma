import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useLayout } from '../contexts/LayoutContext';
import {
  getNoteDetail,
  getNoteLearningThread,
  getNoteLearningThreads,
  saveNoteLearningExchange,
  streamAIAssistant
} from '../api/client';
import Spinner from '../components/Spinner/Spinner';

function levelKey(level) {
  const value = typeof level === 'string'
    ? level
    : level?.slug || level?.id || level?.key || level?.name || '';
  return String(value).toLowerCase();
}

function noteText(html) {
  const safeHtml = DOMPurify.sanitize(String(html || ''), { USE_PROFILES: { html: true } });
  const element = document.createElement('div');
  element.innerHTML = safeHtml;
  return (element.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 5000);
}

export default function NoteLearningExplanation() {
  const [searchParams] = useSearchParams();
  const threadId = searchParams.get('id');
  const requestedReturnTo = searchParams.get('return_to') || '';
  const returnToLesson = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '';
  const { level } = useLayout();
  const [thread, setThread] = useState(null);
  const [history, setHistory] = useState([]);
  const [noteTitle, setNoteTitle] = useState('Your note');
  const [noteContext, setNoteContext] = useState('');
  const [noteContextLoaded, setNoteContextLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);
  const abortRef = useRef(null);
  const initialRequestStarted = useRef(false);

  const levelName = useMemo(() => levelKey(level), [level]);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        if (!threadId) {
          const historyResult = await getNoteLearningThreads(50);
          if (!mounted) return;
          setHistory(Array.isArray(historyResult?.threads) ? historyResult.threads : []);
          return;
        }
        const result = await getNoteLearningThread(threadId);
        if (!mounted) return;
        const savedThread = result?.thread;
        if (!savedThread?.id) throw new Error("We couldn’t find this learning explanation.");
        setThread(savedThread);
        setNoteTitle(result.note_title || 'Your note');
        setMessages((savedThread.messages || []).map((message, index) => ({
          id: `saved-${index}`,
          role: message.role,
          content: message.content
        })));
        const note = await getNoteDetail(savedThread.note_id);
        if (!mounted) return;
        setNoteContext(noteText(note?.content));
        setNoteContextLoaded(true);
      } catch (loadError) {
        if (mounted) setError(loadError?.message || "We couldn't load this explanation. Please try again.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
      abortRef.current?.abort();
    };
  }, [threadId]);

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
  }, [messages]);

  useEffect(() => {
    if (
      !thread
      || !noteContextLoaded
      || thread.explanation
      || messages.length !== 1
      || messages[0]?.role !== 'user'
      || streaming
      || initialRequestStarted.current
    ) return;

    initialRequestStarted.current = true;
    sendMessage(null, true);
  }, [thread, noteContextLoaded, messages, streaming]);

  async function sendMessage(event, initial = false) {
    event?.preventDefault();
    const content = input.trim();
    if ((!initial && !content) || streaming || !thread) return;

    setError('');
    if (!initial) setInput('');
    const userMessage = { id: `user-${Date.now()}`, role: 'user', content };
    const assistantMessage = { id: `assistant-${Date.now()}`, role: 'assistant', content: '' };
    const conversation = initial ? messages : [...messages, userMessage];
    setMessages([...conversation, assistantMessage]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      const answer = await streamAIAssistant(conversation, {
        level: levelName,
        mode: 'learn',
        pageContext: `Note explanation: ${noteTitle}`,
        noteContext,
        signal: controller.signal,
        onChunk: (_chunk, fullText) => {
          setMessages((current) => current.map((message) =>
            message.id === assistantMessage.id ? { ...message, content: fullText } : message
          ));
        }
      });

      const completedMessages = [...conversation, {
        ...assistantMessage,
        content: answer
      }];
      setMessages(completedMessages);
      setSaving(true);
      await saveNoteLearningExchange(
        thread.id,
        completedMessages.slice(-20).map(({ role, content: messageContent }) => ({
          role,
          content: messageContent
        }))
      );
      setThread((current) => ({
        ...current,
        messages: completedMessages.slice(-20).map(({ role, content: messageContent }) => ({
          role,
          content: messageContent
        })),
        explanation: answer,
        status: 'answered'
      }));
    } catch (sendError) {
      if (sendError?.name !== 'AbortError') {
        setError(sendError?.message || "We couldn't save your explanation. Please try again.");
      }
    } finally {
      setSaving(false);
      setStreaming(false);
    }
  }

  if (loading) return <div className="fcd-loading-wrap"><Spinner size="lg" /></div>;

  if (!threadId) {
    return (
      <section className="note-learning-page">
        <header className="note-learning-header">
          <Link to="/notes" className="note-learning-back">← Back to study notes</Link>
          <p className="note-learning-eyebrow">YOUR LEARNING HISTORY</p>
          <h1>Your learning history</h1>
          <p>Return here to revisit questions you asked about a study note.</p>
        </header>
        {error && <div className="note-learning-card"><p role="alert">{error}</p></div>}
        {!error && history.length === 0 && (
          <div className="note-learning-card">
            <h2>No saved explanations yet</h2>
            <p>Need help understanding a study note? Ask your question at the end of the note. Your saved explanation will appear here.</p>
            <Link to="/notes">Browse study notes</Link>
          </div>
        )}
        {history.map((item) => (
          <article className="note-learning-card" key={item.id}>
            <p className="note-learning-eyebrow">{item.note_title || 'Study note'} · {item.status === 'answered' ? 'Answered' : 'Waiting for an answer'}</p>
            <h2>{item.learner_question}</h2>
            {item.explanation && <p>{item.explanation.slice(0, 260)}{item.explanation.length > 260 ? '…' : ''}</p>}
            <p><small>Last updated {item.updated_at ? new Date(item.updated_at).toLocaleString() : 'recently'}</small></p>
            <Link className="note-learning-back" to={`/learning/explanation?id=${encodeURIComponent(item.id)}`}>View explanation →</Link>
          </article>
        ))}
      </section>
    );
  }

  if (error && !thread) {
    return (
      <section className="note-learning-page">
        <div className="note-learning-card">
          <h1>Explanation unavailable</h1>
          <p role="alert">{error}</p>
          <Link to="/learning/explanation">Back to learning history</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="note-learning-page">
      <header className="note-learning-header">
        
        <p className="note-learning-eyebrow">YOUR LEARNING HISTORY</p>
        <h1>{noteTitle}</h1>
        <p>Your question and explanation are saved here, so you can continue where you left off.</p>
      </header>

      <div className="note-learning-card">
        <div className="note-learning-messages" ref={bodyRef} aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              data-message-id={message.id}
              className={`note-learning-message note-learning-message--${message.role}`}
            >
              <strong>{message.role === 'user' ? 'Your question' : 'AI tutor'}</strong>
              <div className="note-learning-message-content">{message.content || (streaming ? 'Preparing an explanation…' : '')}</div>
            </article>
          ))}
          {messages.length === 0 && <p>What would you like explained from this note?</p>}
        </div>

        {error && <p className="note-learning-error" role="alert">{error}</p>}
        {saving && <p className="note-learning-save-status" role="status">Saving your explanation…</p>}

        <form className="note-learning-composer" onSubmit={sendMessage}>
          <label htmlFor="note-learning-followup">Ask another question</label>
          <textarea
            id="note-learning-followup"
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 2000))}
            maxLength={2000}
            rows={3}
            placeholder="What would you like your AI tutor to explain further?"
            disabled={streaming}
          />
          <button type="submit" disabled={!input.trim() || streaming || saving}>
            {streaming ? 'Writing your explanation…' : 'Ask AI tutor'}
          </button>
        </form>
      </div>

      <nav className="note-learning-bottom-navigation" aria-label="Note navigation">
        {returnToLesson && (
          <Link to={returnToLesson} className="note-learning-nav-button">
            <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
              <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Return to lesson</span>
          </Link>
        )}
        <Link
          to={'/notes/read?id=' + encodeURIComponent(thread.note_id) + (returnToLesson ? '&return_to=' + encodeURIComponent(returnToLesson) : '')}
          className="note-learning-nav-button"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" width="16" height="16" fill="none">
            <path d="M12.5 4.5 7 10l5.5 5.5M7.5 10H17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Back to note</span>
        </Link>
      </nav>
    </section>
  );
}
