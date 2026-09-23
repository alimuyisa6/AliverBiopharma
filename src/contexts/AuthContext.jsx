 /* contexts/AuthContext.jsx */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef
} from 'react';

import {
  useLocation,
  useNavigate
} from 'react-router-dom';

import {
  signin,
  signinWithPasskey,
  signout
} from '../api/client';

import { getUser } from '../api/cachedClient';

import Spinner from '../components/Spinner/Spinner';

function getClientDeviceMetadata() {
  if (typeof window === 'undefined') return null;

  let deviceId = null;
  try {
    deviceId = localStorage.getItem('aliver_device_id');
    if (!deviceId && crypto?.randomUUID) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('aliver_device_id', deviceId);
    }
  } catch {}

  const uaData = navigator.userAgentData;
  const base = {
    deviceId,
    model: null,
    platform: uaData?.platform || null,
    platformVersion: null,
    browser: null,
    browserVersion: null
  };

  if (!uaData?.getHighEntropyValues) return base;

  return uaData.getHighEntropyValues([
    'model',
    'platform',
    'platformVersion',
    'fullVersionList'
  ]).then((high) => {
    const chromium = Array.isArray(high.fullVersionList)
      ? high.fullVersionList.find((item) => !/Chromium|Not.?A.?Brand/i.test(item.brand))
      : null;
    return {
      ...base,
      model: high.model || null,
      platform: high.platform || base.platform,
      platformVersion: high.platformVersion || null,
      browser: chromium?.brand || null,
      browserVersion: chromium?.version || null
    };
  }).catch(() => base);
}

export const AuthContext = createContext(null);

const REFRESH_INTERVAL = 12 * 60 * 1000;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

const DEFAULT_PROFILE = {
  role: 'student',
  track: null,
  class_name: null,
  onboarding_completed: false,
  is_approved_teacher: false,
  approved_track: null
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshRef = useRef(null);
  const inactivityRef = useRef(null);
  const activityThrottleRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const navigate = useNavigate();

  /*
   * Check the current authenticated session and
   * retrieve the current user profile.
   */
  const checkAuth = useCallback(async () => {
    try {
      const data = await getUser();

      if (data?.user) {
        setUser({
          ...data.user,
          profile:
            data.user.profile || DEFAULT_PROFILE
        });

        lastActivityRef.current = Date.now();
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
   * Check authentication when the application starts.
   */
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  /*
   * Keep the authenticated session refreshed while
   * the user is active.
   */
  useEffect(() => {
    if (!user) {
      clearInterval(refreshRef.current);
      clearTimeout(inactivityRef.current);
      clearTimeout(activityThrottleRef.current);
      refreshRef.current = null;
      inactivityRef.current = null;
      activityThrottleRef.current = null;
      return;
    }

    const resetTimer = () => {
      lastActivityRef.current = Date.now();

      clearTimeout(inactivityRef.current);

      inactivityRef.current = setTimeout(() => {
        signout().catch(() => {});
        setUser(null);

        /*
         * When the session expires because of inactivity,
         * return the user to the public Home page.
         */
        navigate('/', { replace: true });
      }, INACTIVITY_TIMEOUT);
    };

    const startRefresh = () => {
      if (refreshRef.current !== null || document.visibilityState !== 'visible') {
        return;
      }

      refreshRef.current = setInterval(() => {
        if (
          Date.now() - lastActivityRef.current <
          INACTIVITY_TIMEOUT
        ) {
          checkAuth();
        }
      }, REFRESH_INTERVAL);
    };

    const stopRefresh = () => {
      if (refreshRef.current === null) return;
      clearInterval(refreshRef.current);
      refreshRef.current = null;
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkAuth();
        startRefresh();
      } else {
        stopRefresh();
      }
    };

    /*
     * Mouse movement can fire dozens of times per second.
     * Throttle activity bookkeeping so it cannot repeatedly
     * clear/recreate the inactivity timer during pointer movement.
     */
    const handleActivity = () => {
      if (activityThrottleRef.current) return;

      activityThrottleRef.current = setTimeout(() => {
        activityThrottleRef.current = null;
        resetTimer();
      }, 1000);
    };

    const activityEvents = [
      'mousedown',
      'keydown',
      'touchstart',
      'mousemove'
    ];

    activityEvents.forEach((event) => {
      window.addEventListener(
        event,
        handleActivity,
        { passive: true }
      );
    });

    resetTimer();

    if (document.visibilityState === 'visible') {
      startRefresh();
    }

    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      stopRefresh();
      clearTimeout(inactivityRef.current);
      clearTimeout(activityThrottleRef.current);
      inactivityRef.current = null;
      activityThrottleRef.current = null;

      activityEvents.forEach((event) => {
        window.removeEventListener(
          event,
          handleActivity
        );
      });

      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [user, checkAuth, navigate]);
  /*
   * Sign in.
   *
   * Successful authentication now lands on the
   * public Home page rather than Dashboard.
   *
   * MFA/passkey-required responses are returned first
   * so that the login page can complete those flows
   * before any navigation takes place.
   */
  const login = useCallback(
    async (
      email,
      password,
      turnstileToken,
      mfaCode
    ) => {
      const device = await getClientDeviceMetadata();
      const result = await signin(
        email,
        password,
        turnstileToken,
        mfaCode,
        device
      );

      /*
       * Do not redirect when another authentication
       * step is still required.
       */
      if (
        result?.mfa_required ||
        result?.passkey_required
      ) {
        return result;
      }

      /*
       * Load the authenticated user before navigating.
       */
      await checkAuth();

      /*
       * Default authenticated landing page:
       * Home, not Dashboard.
       */
      navigate('/', { replace: true });

      return result;
    },
    [checkAuth, navigate]
  );

  /*
   * Sign in with a real WebAuthn passkey. The browser first receives
   * a short-lived Supabase access token from the passkey ceremony.
   * The server then verifies that token and creates the same
   * AliverBiopharm session used by password login.
   */
  const loginWithPasskey = useCallback(
    async (existingAccessToken = null, mfaCode = null) => {
      let accessToken = existingAccessToken;

      if (!accessToken) {
        const { signInWithPasskey: runPasskey } = await import('../lib/passkeyClient');
        const { data, error } = await runPasskey();

        if (error) throw error;

        accessToken = data?.session?.access_token;

        if (!accessToken) {
          throw new Error('Passkey authentication did not return a valid session.');
        }
      }

      const device = await getClientDeviceMetadata();
      const result = await signinWithPasskey(
        accessToken,
        mfaCode,
        device
      );

      if (result?.mfa_required) {
        return {
          ...result,
          passkey_access_token: accessToken
        };
      }

      await checkAuth();
      navigate('/', { replace: true });

      return result;
    },
    [checkAuth, navigate]
  );

  /*
   * Sign out and return to the public Home page.
   */
  const logout = useCallback(async () => {
    clearInterval(refreshRef.current);
    clearTimeout(inactivityRef.current);

    try {
      await signout();
    } catch {}

    setUser(null);

    navigate('/', { replace: true });
  }, [navigate]);

  /*
   * Manually refresh the current authentication state.
   */
  const refresh = useCallback(
    () => checkAuth(),
    [checkAuth]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithPasskey,
        logout,
        refresh
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error(
      'useAuth must be used within AuthProvider'
    );
  }

  return ctx;
}

/*
 * Protect authenticated routes.
 */
export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate('/login', {
        replace: true,
        state: {
          from: location
        }
      });
    }
  }, [
    user,
    loading,
    location,
    navigate
  ]);

  if (loading) {
    return (
      <div className="fcd-loading-wrap">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return children;
}
