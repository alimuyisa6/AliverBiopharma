import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { useLayout } from '../contexts/LayoutContext';
import {
  getNoteDetail,
  getNoteLearningThread,
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
  const { level } = useLayout();
  const [thread, setThread] = useState(null);
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
      if (!threadId) {
        setError('This explanation link is missing its learning thread.');
        setLoading(false);
        return;
      }
      try {
        const result = await getNoteLearningThread(threadId);
        if (!mounted) return;
        const savedThread = result?.thread;
        if (!savedThread?.id) throw new Error('Learning explanation not found.');
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
        if (mounted) setError(loadError?.message || 'Could not load this explanation.');
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
        setError(sendError?.message || 'The explanation could not be saved. Please try again.');
      }
    } finally {
      setSaving(false);
      setStreaming(false);
    }
  }

  if (loading) return <div className="fcd-loading-wrap"><Spinner size="lg" /></div>;

  if (error && !thread) {
    return (
      <section className="note-learning-page">
        <div className="note-learning-card">
          <h1>Explanation unavailable</h1>
          <p role="alert">{error}</p>
          <Link to="/notes">Back to notes</Link>
        </div>
      </section>
    );
  }

  return (
    <section className="note-learning-page">
      <header className="note-learning-header">
        <Link to={`/notes/read?id=${encodeURIComponent(thread.note_id)}`} className="note-learning-back">← Back to note</Link>
        <p className="note-learning-eyebrow">ALIVER BIOPHARM · LEARNING HISTORY</p>
        <h1>{noteTitle}</h1>
        <p>Your question and explanation are saved here, so you can return and continue later.</p>
      </header>

      <div className="note-learning-card">
        <div className="note-learning-messages" ref={bodyRef} aria-live="polite">
          {messages.map((message) => (
            <article
              key={message.id}
              data-message-id={message.id}
              className={`note-learning-message note-learning-message--${message.role}`}
            >
              <strong>{message.role === 'user' ? 'Your question' : 'AI Tutor'}</strong>
              <div className="note-learning-message-content">{message.content || (streaming ? 'Thinking…' : '')}</div>
            </article>
          ))}
          {messages.length === 0 && <p>Ask what you would like clarified from this note.</p>}
        </div>

        {error && <p className="note-learning-error" role="alert">{error}</p>}
        {saving && <p className="note-learning-save-status" role="status">Saving your learning history…</p>}

        <form className="note-learning-composer" onSubmit={sendMessage}>
          <label htmlFor="note-learning-followup">Ask a follow-up question</label>
          <textarea
            id="note-learning-followup"
            value={input}
            onChange={(event) => setInput(event.target.value.slice(0, 2000))}
            maxLength={2000}
            rows={3}
            placeholder="Which step, term, or idea should the tutor explain further?"
            disabled={streaming}
          />
          <button type="submit" disabled={!input.trim() || streaming || saving}>
            {streaming ? 'Explaining…' : 'Ask AI Tutor'}
          </button>
        </form>
      </div>
    </section>
  );
}
