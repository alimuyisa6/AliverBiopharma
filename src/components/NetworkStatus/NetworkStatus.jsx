import { useEffect, useState } from 'react';
import Icon from '../Icon/Icon';
import { useAuth } from '../../contexts/AuthContext';
import useNetworkStatus from '../../hooks/useNetworkStatus';

const MIN_READ_MS = 3500;
const MS_PER_WORD = 320;

function getFirstName(user) {
  const raw =
    user?.profile?.display_name ||
    user?.profile?.full_name ||
    user?.display_name ||
    user?.full_name ||
    '';

  return raw.trim().split(' ')[0] || '';
}

function getReadDuration(text) {
  const words = text.trim().split(/\\s+/).length;
  return Math.max(MIN_READ_MS, words * MS_PER_WORD);
}

const TONE_STYLES = {
  offline: {
    panel: 'border-red-200 bg-red-50 text-red-950',
    icon: 'bg-red-100 text-red-700 ring-red-200',
    label: 'Connection lost',
    labelText: 'text-red-700',
    close: 'text-red-700 hover:bg-red-100 focus-visible:outline-red-500'
  },
  slow: {
    panel: 'border-amber-200 bg-amber-50 text-amber-950',
    icon: 'bg-amber-100 text-amber-700 ring-amber-200',
    label: 'Slow connection',
    labelText: 'text-amber-800',
    close: 'text-amber-800 hover:bg-amber-100 focus-visible:outline-amber-500'
  },
  good: {
    panel: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    icon: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
    label: 'Connection restored',
    labelText: 'text-emerald-800',
    close: 'text-emerald-800 hover:bg-emerald-100 focus-visible:outline-emerald-500'
  }
};

export default function NetworkStatus() {
  const { status, effectiveType, downlink, rtt } = useNetworkStatus();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [displayStatus, setDisplayStatus] = useState(status);
  const [wasDown, setWasDown] = useState(false);

  const firstName = getFirstName(user);

  const messages = {
    offline: {
      icon: 'wifi-slash',
      text: firstName
        ? `${firstName}, you're offline — check that mobile data or Wi-Fi is on and airplane mode is off.`
        : "You're offline. Check that mobile data or Wi-Fi is on and airplane mode is off.",
      tone: 'offline'
    },
    slow: {
      icon: 'triangle-exclamation',
      text: firstName
        ? `${firstName}, your connection is slower than usual. Some content may take longer to load.`
        : 'Your connection is slower than usual. Some content may take longer to load.',
      tone: 'slow'
    },
    good: {
      icon: 'wifi',
      text: firstName
        ? `${firstName}, your network is back — continue browsing. Enjoy your studies at AliverBiopharm. Thanks!`
        : "Your network is back — continue browsing. Enjoy your studies at AliverBiopharm. Thanks!",
      tone: 'good'
    }
  };

  useEffect(() => {
    if (status === 'offline' || status === 'slow') {
      setDisplayStatus(status);
      setVisible(true);
      setWasDown(true);
      return;
    }

    if (status === 'good' && wasDown) {
      setDisplayStatus('good');
      setVisible(true);
      setWasDown(false);

      const duration = getReadDuration(messages.good.text);
      const timer = setTimeout(() => setVisible(false), duration);
      return () => clearTimeout(timer);
    }

    setVisible(false);
  }, [status, wasDown]);

  const message = messages[displayStatus];
  const tone = message ? TONE_STYLES[message.tone] : null;

  const showDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('debug') === 'network';

  return (
    <>
      {visible && message && tone && (
        <div
          className={`fixed inset-x-3 top-[5.25rem] z-[60] mx-auto flex max-w-3xl items-start gap-3 rounded-2xl border px-3.5 py-3.5 shadow-xl shadow-slate-900/10 backdrop-blur sm:inset-x-5 sm:items-center sm:gap-4 sm:px-5 sm:py-4 ${tone.panel}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span
            className={`mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 sm:mt-0 sm:h-11 sm:w-11 ${tone.icon}`}
            aria-hidden="true"
          >
            <Icon name={message.icon} />
          </span>

          <div className="min-w-0 flex-1">
            <p className={`mb-0.5 text-[11px] font-extrabold uppercase tracking-[0.14em] ${tone.labelText}`}>
              {tone.label}
            </p>
            <p className="m-0 text-sm font-medium leading-6 sm:text-[15px]">
              {message.text}
            </p>
          </div>

          <button
            type="button"
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-current/20 bg-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${tone.close}`}
            onClick={() => setVisible(false)}
            aria-label="Close network status"
            title="Close"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5"><path d="M6 6l12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>
          </button>
        </div>
      )}

      {showDebug && (
        <div className="fixed bottom-3 left-3 z-[70] max-w-[calc(100vw-1.5rem)] rounded-xl border border-slate-700 bg-slate-950/95 px-3 py-2 font-mono text-[11px] leading-5 text-emerald-300 shadow-lg">
          <span className="font-bold text-white">NETWORK</span>
          <span className="mx-2 text-slate-500">|</span>
          status: {status} · online: {String(typeof navigator !== 'undefined' && navigator.onLine)} · type: {String(effectiveType)} · downlink: {String(downlink)} · rtt: {String(rtt)}
        </div>
      )}
    </>
  );
}
