import { useState, useEffect, useRef, useCallback } from 'react';

const SLOW_EFFECTIVE_TYPES = ['slow-2g', '2g'];
const PING_URL = '/api/server?module=ping';
const PING_INTERVAL = 20000;
const PING_TIMEOUT = 6000;
const SLOW_LATENCY_MS = 2500;

function getConnection() {
  if (typeof navigator === 'undefined') return null;
  return navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}

function evaluateFromApi(connection) {
  if (!connection) return null;

  const { effectiveType, downlink, rtt, saveData } = connection;

  const isSlow =
    SLOW_EFFECTIVE_TYPES.includes(effectiveType) ||
    (typeof downlink === 'number' && downlink > 0 && downlink < 0.5) ||
    (typeof rtt === 'number' && rtt > 900);

  return {
    status: isSlow ? 'slow' : 'good',
    effectiveType: effectiveType || null,
    downlink: typeof downlink === 'number' ? downlink : null,
    rtt: typeof rtt === 'number' ? rtt : null,
    saveData: !!saveData
  };
}

export default function useNetworkStatus() {
  const [state, setState] = useState({
    status: typeof navigator !== 'undefined' && navigator.onLine ? 'good' : 'offline',
    effectiveType: null,
    downlink: null,
    rtt: null,
    saveData: false
  });

  const inFlight = useRef(false);

  const checkReal = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setState((prev) => ({ ...prev, status: 'offline' }));
      return;
    }

    if (inFlight.current) return;
    inFlight.current = true;

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PING_TIMEOUT);
    const started = Date.now();

    try {
      await fetch(PING_URL, { method: 'HEAD', cache: 'no-store', signal: controller.signal });
      const elapsed = Date.now() - started;

      const apiEval = evaluateFromApi(getConnection());

      if (elapsed > SLOW_LATENCY_MS) {
        setState({
          status: 'slow',
          effectiveType: apiEval?.effectiveType ?? null,
          downlink: apiEval?.downlink ?? null,
          rtt: apiEval?.rtt ?? null,
          saveData: apiEval?.saveData ?? false
        });
      } else if (apiEval) {
        setState(apiEval);
      } else {
        setState({ status: 'good', effectiveType: null, downlink: null, rtt: null, saveData: false });
      }
    } catch {
      setState((prev) => ({ ...prev, status: 'slow' }));
    } finally {
      clearTimeout(timer);
      inFlight.current = false;
    }
  }, []);

  useEffect(() => {
    const connection = getConnection();
    let idleId;
    let timeoutId;
    let interval = null;

    const handleOffline = () => setState((prev) => ({ ...prev, status: 'offline' }));
    const handleOnline = () => checkReal();
    const handleConnectionChange = () => checkReal();

    const startMonitoring = () => {
      if (interval !== null || document.visibilityState !== 'visible') return;

      checkReal();
      interval = setInterval(checkReal, PING_INTERVAL);
    };

    const stopMonitoring = () => {
      if (interval === null) return;
      clearInterval(interval);
      interval = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        startMonitoring();
      } else {
        stopMonitoring();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (connection && connection.addEventListener) {
      connection.addEventListener('change', handleConnectionChange);
    }

    if (document.visibilityState === 'visible') {
      const loadInitialStatus = () => startMonitoring();

      if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        idleId = window.requestIdleCallback(loadInitialStatus, { timeout: 1500 });
      } else {
        timeoutId = setTimeout(loadInitialStatus, 0);
      }
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      if (idleId !== undefined && typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
        window.cancelIdleCallback(idleId);
      }
      clearTimeout(timeoutId);
      stopMonitoring();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [checkReal]);

  return state;
}
