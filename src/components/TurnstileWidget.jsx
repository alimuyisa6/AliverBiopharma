import { useEffect, useRef, useState } from 'react';

const TURNSTILE_SITE_KEY = '0x4AAAAAADknPpI_XcH1KfPe';

export default function TurnstileWidget({
  onTokenChange,
  className = 'auth-captcha',
  disabled = false
}) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onTokenChangeRef = useRef(onTokenChange);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    onTokenChangeRef.current = onTokenChange;
  }, [onTokenChange]);

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let interval = null;

    const render = () => {
      if (
        cancelled ||
        !containerRef.current ||
        !window.turnstile ||
        widgetIdRef.current !== null
      ) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => {
            if (!cancelled) {
              setReady(true);
              onTokenChangeRef.current?.(token || '');
            }
          },
          'expired-callback': () => {
            setReady(false);
            onTokenChangeRef.current?.('');
          },
          'error-callback': () => {
            setReady(false);
            onTokenChangeRef.current?.('');
          }
        });
        if (!cancelled) setReady(true);
      } catch {
        widgetIdRef.current = null;
        setReady(false);
        onTokenChangeRef.current?.('');
      }
    };

    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    interval = setInterval(() => {
      attempts += 1;
      render();
      if (widgetIdRef.current !== null || attempts >= 50) {
        clearInterval(interval);
      }
    }, 100);

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
      if (window.turnstile && widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }
      widgetIdRef.current = null;
      setReady(false);
      onTokenChangeRef.current?.('');
    };
  }, []);

  useEffect(() => {
    if (disabled && window.turnstile && widgetIdRef.current !== null) {
      try {
        window.turnstile.reset(widgetIdRef.current);
      } catch {}
      setReady(false);
      onTokenChangeRef.current?.('');
    }
  }, [disabled]);

  return (
    <div
      ref={containerRef}
      className={className}
      aria-busy={!ready}
      aria-label="Security verification"
    />
  );
}
