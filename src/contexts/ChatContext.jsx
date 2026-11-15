import { createContext, useCallback, useContext, useRef } from 'react';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const openerRef = useRef(null);
  const pendingOpenRef = useRef(false);

  const registerChatOpener = useCallback((opener) => {
    openerRef.current = opener;

    if (pendingOpenRef.current) {
      pendingOpenRef.current = false;
      opener();
    }

    return () => {
      if (openerRef.current === opener) {
        openerRef.current = null;
      }
    };
  }, []);

  const openLiveChat = useCallback(() => {
    if (openerRef.current) {
      openerRef.current();
      return true;
    }

    pendingOpenRef.current = true;
    return false;
  }, []);

  return (
    <ChatContext.Provider value={{ openLiveChat, registerChatOpener }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }

  return context;
}
