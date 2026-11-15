export function showFatalError(title, message, stack) {
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

export function installRuntimeErrorHandlers() {
  window.addEventListener('vite:preloadError', (event) => {
    event.preventDefault();
    recoverFromStaleChunk(event);
  });

  window.onerror = (message, source, lineno, colno, error) => {
    if (isCrossOriginScriptError(message, source, error)) {
      console.warn('Cross-origin script error', source || 'unknown');
      return true;
    }

    showFatalError('Runtime Error', message, error?.stack);
    return false;
  };

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = (reason && reason.message) || String(reason);

    if (isCrossOriginScriptError(message, null, reason)) {
      console.warn('Cross-origin promise rejection', reason);
      return;
    }

    showFatalError('Unhandled Promise Rejection', message, reason?.stack);
  });
}
