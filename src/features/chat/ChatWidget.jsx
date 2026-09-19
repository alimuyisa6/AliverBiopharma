/* features/chat/ChatWidget.jsx */
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';

export function ChatWidget({ chatOpen, chatMessages = [], chatInput, adminOnline, onToggle, onSend, onInputChange, onDeleteMsg, chatBodyRef, sending = false, deletingId = null, requestLoading = false }) {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatInput.trim()) onSend();
    }
  };

  const handleInput = (e) => {
    onInputChange(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + 'px';
  };

  return (
    <div className="chat-widget">
      <button
        className="btn btn-primary btn-icon btn-lg btn-round chat-toggle-btn"
        onClick={onToggle}
        aria-label={chatOpen ? 'Close support chat' : 'Open support chat'}
        aria-expanded={chatOpen}
      >
        <Icon name={chatOpen ? 'xmark' : 'message'} className="chat-icon" />
      </button>

      {chatOpen && (
        <div className="chat-panel">
          <div className="chat-panel-header">
            <div className="chat-panel-header-info">
              <span className="chat-panel-header-avatar">
                <Icon name="headset" className="chat-icon" />
              </span>
              <div className="chat-panel-heading">
                <div className="chat-panel-title">Support</div>
                <div className="chat-panel-description">Questions about your learning experience? We’re here to help.</div>
                <div className="chat-panel-status">
                  <span className={`status-dot ${adminOnline ? 'status-dot-success' : 'status-dot-error'}`} />
                  {adminOnline ? 'We usually reply within minutes' : 'Currently offline — leave a message'}
                </div>
              </div>
            </div>
            <button className="btn btn-ghost btn-sm btn-icon btn-round" onClick={onToggle} aria-label="Close chat">
              <Icon name="xmark" className="chat-icon" />
            </button>
          </div>

          <div ref={chatBodyRef} className="chat-body">
            <div className="chat-welcome" aria-hidden="true">
              <div className="chat-welcome-art">
                <span className="chat-welcome-bubble chat-welcome-bubble-one" />
                <span className="chat-welcome-bubble chat-welcome-bubble-two" />
                <span className="chat-welcome-face">
                  <Icon name="message" className="chat-icon" />
                </span>
              </div>
              <div className="chat-welcome-copy">
                <h3>How can we help?</h3>
                <p>Send us a message and our support team will get back to you.</p>
              </div>
            </div>

            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message-row${msg.sender_type === 'user' ? ' is-own' : ''}`}
              >
                <div className="chat-message-bubble">
                  <div className="chat-message-sender">
                    {msg.sender_type === 'user' ? 'You' : 'Support Team'}
                  </div>
                  <div className="chat-message-content">{msg.content}</div>
                  {msg.sender_type === 'user' && (
                    <Button
                      className="chat-message-delete"
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteMsg(msg.id)}
                      aria-label="Delete message"
                      loading={deletingId === msg.id}
                      loadingContext="default"
                      icon="trash"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="chat-input-row">
            <div className="chat-input-group">
              <textarea
                className="form-textarea chat-textarea"
                placeholder="Type your message..."
                value={chatInput}
                onChange={handleInput}
                onKeyDown={handleKeyPress}
                rows={1}
                maxLength={500}
                aria-label="Message"
              />
              <Button
                className="chat-send-btn"
                variant="primary"
                onClick={onSend}
                disabled={!chatInput.trim()}
                loading={sending}
                loadingContext="brand"
                loadingLabel="Sending…"
                icon="paper-plane"
              >
                Send
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
