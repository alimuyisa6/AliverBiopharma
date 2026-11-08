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
  const screen = document.createElement('main');
  const heading = document.createElement('h2');
  const detail = document.createElement('p');
  const reload = document.createElement('button');

  screen.className = 'fatal-error-screen';
  heading.className = 'fatal-error-title';
  detail.className = 'fatal-error-message';
  reload.className = 'fatal-error-reload';
  heading.textContent = title;
  detail.textContent = message || 'Unknown error';
  reload.type = 'button';
  reload.textContent = 'Reload';
  reload.addEventListener('click', () => window.location.reload());

  screen.append(heading, detail);

  if (stack) {
    const trace = document.createElement('pre');
    trace.className = 'fatal-error-stack';
    trace.textContent = stack;
    screen.append(trace);
  }

  screen.append(reload);
  root.replaceChildren(screen);
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