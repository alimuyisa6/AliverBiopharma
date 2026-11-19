import Button from '../../components/Button/Button';

export function ChatWidget({ chatOpen, chatMessages = [], chatInput, adminOnline, onToggle, onSend, onInputChange, onDeleteMsg, chatBodyRef, sending = false, deletingId = null, requestLoading = false }) {
  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (chatInput.trim()) onSend();
    }
  };

  const handleInput = (event) => {
    onInputChange(event.target.value);
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 160)}px`;
  };

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {chatOpen && (
        <section className="pointer-events-auto flex h-[min(78vh,42rem,calc(100dvh-6rem))] max-h-[min(78vh,42rem,calc(100dvh-6rem))] w-full min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-slate-950/20" aria-label="Live chat support">
          <header className="flex min-w-0 items-start gap-3 bg-primary-900 p-4 text-white sm:p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15 text-white"><svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 13v-1a9 9 0 0 1 18 0v1"/><path d="M5 13h2v6H5a2 2 0 0 1-2-2v-2a2 2 0 0 1 2-2Zm14 0h-2v6h2a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2Z"/></svg></span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold text-white">Support</h2>
              <p className="mt-1 text-xs leading-5 text-blue-100">Questions about your learning experience? We’re here to help.</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-blue-100"><span className={`h-2 w-2 shrink-0 rounded-full ${adminOnline ? 'bg-emerald-400' : 'bg-orange-300'}`} />{adminOnline ? 'We usually reply within minutes' : 'Currently offline — leave a message'}</div>
            </div>
            <button type="button" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white transition hover:bg-white/15" onClick={onToggle} aria-label="Close chat"><svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
          </header>

          <div ref={chatBodyRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 sm:p-5" aria-live="polite">
            {!chatMessages.length && (
              <div className="mx-auto flex max-w-xs flex-col items-center py-5 text-center">
                <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700"><svg viewBox="0 0 24 24" className="h-7 w-7" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a8 8 0 0 1-8 8H5l-2 2v-10a8 8 0 0 1 8-8h1a8 8 0 0 1 8 8Z"/><path d="M8 11h8M8 14h5"/></svg></span>
                <h3 className="mt-4 text-lg font-bold text-primary-900">How can we help?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">Send us a message and our support team will get back to you.</p>
              </div>
            )}
            {chatMessages.map((msg) => (
              <div key={msg.id} className={`flex min-w-0 ${msg.sender_type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`group relative max-w-[88%] min-w-0 rounded-2xl px-3.5 py-3 shadow-sm ${msg.sender_type === 'user' ? 'rounded-br-md bg-primary-700 text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-800'}`}>
                  <div className={`mb-1 text-[11px] font-bold ${msg.sender_type === 'user' ? 'text-blue-100' : 'text-primary-700'}`}>{msg.sender_type === 'user' ? 'You' : 'Support Team'}</div>
                  <div className="whitespace-pre-wrap break-words text-sm leading-6">{msg.content}</div>
                  {msg.sender_type === 'user' && <Button className="mt-2 !min-h-7 !px-2 !text-xs" variant="ghost" size="sm" onClick={() => onDeleteMsg(msg.id)} aria-label="Delete message" loading={deletingId === msg.id} loadingContext="default" icon="trash">Delete</Button>}
                </div>
              </div>
            ))}
            {requestLoading && <p className="text-center text-xs text-slate-500">Loading conversation…</p>}
          </div>

          <form className="flex min-w-0 items-end gap-2 border-t border-slate-200 bg-white p-3 sm:p-4" onSubmit={(event) => { event.preventDefault(); if (chatInput.trim() && !sending) onSend(); }}>
            <textarea className="block max-h-40 min-h-11 min-w-0 flex-1 resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary-500 focus:ring-4 focus:ring-primary-100 disabled:bg-slate-100" placeholder="Type your message…" value={chatInput} onChange={handleInput} onKeyDown={handleKeyPress} rows={1} maxLength={500} aria-label="Message" />
            <Button className="!min-h-11 !shrink-0 !px-3" variant="primary" type="submit" disabled={!chatInput.trim() || sending} loading={sending} loadingContext="brand" loadingLabel="Sending…" icon="paper-plane">Send</Button>
          </form>
        </section>
      )}

      <button type="button" className="pointer-events-auto inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-5 py-3 text-sm font-bold text-white shadow-xl shadow-primary-900/25 transition hover:-translate-y-0.5 hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-500" onClick={onToggle} aria-label={chatOpen ? 'Close live chat' : 'Open live chat'} aria-expanded={chatOpen}>
        {chatOpen ? <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="m6 6 12 12M18 6 6 18" /></svg> : <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 11.5a8 8 0 0 1-8 8H5l-2 2v-10a8 8 0 0 1 8-8h1a8 8 0 0 1 8 8Z"/><path d="M8 11h8M8 14h5"/></svg>}<span>{chatOpen ? 'Close' : 'Live Chat'}</span>
      </button>
    </div>
  );
}
