 /* main.jsx */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import './styles/colors.css';
import './styles/lernwick-tokens.css';
import './styles/semantics.css';
import './styles/spacing.css';
import './styles/animation.css';
import './styles/global.css';
import './styles/layout.css';
import './styles/components.css';
import './styles/uiverse-tokens.css';
import './styles/content-switcher.css';
import './styles/biopharm-toggle.css';
import './styles/slide-to-confirm.css';
import './styles/three-d-button.css';
import './styles/section-bands.css';
import './styles/lernwick-app-pages.css';
import './styles/lernwick-content-pages.css';
import './styles/lernwick-learning-pages.css';
import './styles/lernwick-remaining-pages.css';
import './styles/lernwick-utility-components.css';
import './styles/lernwick-system.css';


function showFatalError(title, message, stack) {
  const root = document.getElementById('root') || document.body;
  root.innerHTML = `
    <div style="padding:20px;font-family:monospace;color:#111;background:#fff;">
      <h2 style="color:#c0392b;margin:0 0 8px;">${title}</h2>
      <div style="margin-bottom:10px;">${message || 'Unknown error'}</div>
      ${stack ? `<pre style="white-space:pre-wrap;background:#f5f5f5;padding:10px;border-radius:6px;font-size:12px;max-height:240px;overflow:auto;">${stack}</pre>` : ''}
      <button onclick="window.location.reload()" style="margin-top:12px;padding:8px 16px;background:#c0392b;color:#fff;border:none;border-radius:6px;cursor:pointer;">Reload</button>
    </div>
  `;
}

function recoverFromStaleChunk(event) {
  try {
    const key = 'aliverbiopharma:chunk-reload';
    if (sessionStorage.getItem(key) === '1') {
      console.error('Dynamic module failed after cache recovery attempt:', event?.payload);
      return;
    }

    sessionStorage.setItem(key, '1');

    const url = new URL(window.location.href);
    url.searchParams.set('__chunk_reload', Date.now().toString());
    window.location.replace(url.toString());
  } catch (error) {
    console.error('Unable to recover from stale dynamic module:', error);
  }
}

window.addEventListener('vite:preloadError', function (event) {
  event.preventDefault();
  recoverFromStaleChunk(event);
});

function isCrossOriginScriptError(message, source, error) {
  if (message !== 'Script error.') return false;
  if (error && error.stack) return false;
  try {
    if (!source) return true;
    const srcUrl = new URL(source, location.href);
    return srcUrl.origin !== location.origin;
  } catch {
    return true;
  }
}

window.onerror = function (message, source, lineno, colno, error) {
  if (isCrossOriginScriptError(message, source, error)) {
    console.warn('Cross-origin script error', source || 'unknown');
    return true;
  }
  showFatalError('Runtime Error', message, error?.stack);
  return false;
};

window.addEventListener('unhandledrejection', function (event) {
  const reason = event.reason;
  const message = (reason && reason.message) || String(reason);
  if (isCrossOriginScriptError(message, null, reason)) {
    console.warn('Cross-origin promise rejection', reason);
    return;
  }
  showFatalError('Unhandled Promise Rejection', message, reason?.stack);
});

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
        <div style={{ padding: 20, fontFamily: 'monospace', background: '#fff' }}>
          <h2 style={{ color: '#c0392b', margin: '0 0 8px' }}>Something went wrong</h2>
          <div style={{ marginBottom: 10 }}>{this.state.error?.message || 'Unknown error'}</div>
          {this.state.error?.stack && (
            <pre style={{
              whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 10,
              borderRadius: 6, fontSize: 12, maxHeight: 240, overflow: 'auto'
            }}>
              {this.state.error.stack}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            style={{ marginTop: 12, padding: '8px 16px', background: '#c0392b', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function initRevealObserver() {
  if (!('IntersectionObserver' in window)) {
    document.querySelectorAll('.reveal, .scroll-reveal').forEach((element) => {
      element.classList.add('in', 'is-visible');
    });
    return () => {};
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) {
    document.querySelectorAll('.reveal, .scroll-reveal').forEach((element) => {
      element.classList.add('in', 'is-visible');
    });
    return () => {};
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in', 'is-visible');
      activeObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.08,
    rootMargin: '0px 0px -48px 0px'
  });

  const observeElements = (root = document) => {
    root.querySelectorAll?.('.reveal:not(.in), .scroll-reveal:not(.is-visible)').forEach((element) => {
      observer.observe(element);
    });
  };

  observeElements();

  let observeFrame = 0;
  const mutationObserver = new MutationObserver((mutations) => {
    if (!mutations.some((mutation) => mutation.addedNodes.length)) return;
    if (observeFrame) return;
    observeFrame = requestAnimationFrame(() => {
      observeFrame = 0;
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.matches?.('.reveal, .scroll-reveal')) {
              observer.observe(node);
            }
            observeElements(node);
          }
        });
      });
    });
  });

  mutationObserver.observe(document.body, { childList: true, subtree: true });

  return () => {
    observer.disconnect();
    mutationObserver.disconnect();
    if (observeFrame) cancelAnimationFrame(observeFrame);
  };
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

import './styles/typography.css';