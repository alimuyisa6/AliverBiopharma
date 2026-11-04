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
import './styles/lernwick-academy-architecture.css';
import './styles/lernwick-visual-balance.css';


function showFatalError(title, message, stack) {
  const root = document.getElementById('root') || document.body;
  root.innerHTML = `
    <div style="padding:20px;font-family:monospace;color:var(--text);background:var(--white);">
      <h2 style="color:var(--danger-color);margin:0 0 8px;">${title}</h2>
      <div style="margin-bottom:10px;">${message || 'Unknown error'}</div>
      ${stack ? `<pre style="white-space:pre-wrap;background:var(--soft);padding:10px;border-radius:6px;font-size:12px;max-height:240px;overflow:auto;">${stack}</pre>` : ''}
      <button onclick="window.location.reload()" style="margin-top:12px;padding:8px 16px;background:var(--danger-color);color:var(--white);border:none;border-radius:6px;cursor:pointer;">Reload</button>
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
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSelector = [
    '#main-content [data-scroll-reveal]',
    '#main-content .section',
    '#main-content .section > .card',
    '#main-content .section > .grid > *',
    '#main-content .section > .section-grid > *',
    '#main-content .reveal',
    '#main-content .scroll-reveal'
  ].join(', ');

  const revealImmediately = () => {
    document.querySelectorAll(revealSelector).forEach((element) => {
      element.classList.add('scroll-reveal', 'is-visible');
      element.classList.add('in');
    });
  };

  if (!('IntersectionObserver' in window) || motionQuery.matches) {
    revealImmediately();
    return () => {};
  }

  const observer = new IntersectionObserver((entries, activeObserver) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible', 'in');
      activeObserver.unobserve(entry.target);
    });
  }, {
    threshold: 0.04,
    rootMargin: '0px 0px -32px 0px'
  });

  const prepare = (root = document) => {
    if (root.nodeType === Node.ELEMENT_NODE && root.matches?.(revealSelector)) {
      root.classList.add('scroll-reveal');
      if (!root.classList.contains('is-visible')) observer.observe(root);
    }

    root.querySelectorAll?.(revealSelector).forEach((element) => {
      element.classList.add('scroll-reveal');
      if (!element.classList.contains('is-visible')) observer.observe(element);
    });
  };

  prepare();

  let frame = 0;
  const mutations = new MutationObserver((records) => {
    if (!records.some((record) => record.addedNodes.length)) return;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      records.forEach((record) => {
        record.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) prepare(node);
        });
      });
    });
  });

  mutations.observe(document.body, { childList: true, subtree: true });

  const handleMotionChange = (event) => {
    if (!event.matches) return;
    revealImmediately();
    observer.disconnect();
  };
  motionQuery.addEventListener?.('change', handleMotionChange);

  return () => {
    observer.disconnect();
    mutations.disconnect();
    motionQuery.removeEventListener?.('change', handleMotionChange);
    if (frame) cancelAnimationFrame(frame);
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