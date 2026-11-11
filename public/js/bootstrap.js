/* Early runtime diagnostics. Kept external so index.html contains no executable inline JavaScript. */
(function () {
  'use strict';

  var isDebug = /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
    || new URLSearchParams(window.location.search).get('debug') === '1';

  function reportError(kind, detail) {
    try {
      console.error('[' + kind + ']', detail);
    } catch (_) {
      // Diagnostics must never create a second runtime failure.
    }
  }

  function showDebugOverlay(text) {
    var pre = document.createElement('pre');
    pre.style.cssText = 'white-space:pre-wrap;padding:16px;font-size:14px;background:#fbfaf4;color:#10241b;position:fixed;inset:0;overflow:auto;z-index:999999;margin:0;';
    pre.textContent = text;
    document.body.appendChild(pre);
  }

  function showFallback() {
    var root = document.getElementById('root');
    if (!root || root.childElementCount > 0) return;

    var wrapper = document.createElement('main');
    wrapper.style.cssText = 'min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:sans-serif;text-align:center;';

    var content = document.createElement('div');
    var heading = document.createElement('h1');
    heading.textContent = 'Something went wrong';
    heading.style.cssText = 'font-size:18px;margin-bottom:8px;';

    var message = document.createElement('p');
    message.textContent = 'Please refresh the page. If the problem continues, try again shortly.';
    message.style.cssText = 'font-size:14px;color:#385447;margin-bottom:16px;';

    var reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Reload';
    reload.style.cssText = 'padding:10px 20px;border:none;border-radius:6px;background:#19693a;color:#fff;font-size:14px;cursor:pointer;';
    reload.addEventListener('click', function () {
      window.location.reload();
    });

    content.append(heading, message, reload);
    wrapper.appendChild(content);
    document.body.replaceChildren(wrapper);
  }

  window.onerror = function (message, source, line, column, error) {
    var detail = 'MSG: ' + message
      + '\nSRC: ' + source
      + '\nLINE: ' + line
      + '\nCOLUMN: ' + column
      + '\nSTACK: ' + (error && error.stack || 'n/a');

    reportError('window.onerror', detail);
    if (isDebug) showDebugOverlay(detail);
    else window.setTimeout(showFallback, 0);
    return false;
  };

  window.addEventListener('unhandledrejection', function (event) {
    var detail = (event.reason && event.reason.stack) || event.reason;
    reportError('unhandledrejection', detail);
    if (isDebug) showDebugOverlay(String(detail));
  });
})();
