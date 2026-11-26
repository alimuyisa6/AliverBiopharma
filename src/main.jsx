/* main.jsx */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles.css';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { showFatalError, installRuntimeErrorHandlers } from './utils/runtimeErrors';
import { initRevealObserver } from './utils/scrollReveal';

installRuntimeErrorHandlers();

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Component error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-error-screen">
          <h2 className="fatal-error-title">Something went wrong</h2>
          <p className="fatal-error-message">{this.state.error?.message || 'Unknown error'}</p>
          {this.state.error?.stack && (
            <pre className="fatal-error-stack">{this.state.error.stack}</pre>
          )}
          <button
            type="button"
            className="fatal-error-reload"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </main>
      );
    }
    return this.props.children;
  }
}

let cleanupReveal;
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    cleanupReveal = initRevealObserver();
  }, { once: true });
} else {
  cleanupReveal = initRevealObserver();
}

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element with id "root" not found in DOM');
  }

  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <AuthProvider>
            <I18nProvider>
              <App />
            </I18nProvider>
          </AuthProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  showFatalError('Initialization Error', error.message, error.stack);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (cleanupReveal) cleanupReveal();
  });
}
