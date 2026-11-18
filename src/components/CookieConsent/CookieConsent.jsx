import { useEffect, useRef, useState } from 'react';
import { getRequest, apiCall } from '../../api/client';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';

const EMPTY_CHOICES = {
  preferences: false,
  analytics: false,
  marketing: false
};

export default function CookieConsent() {
  const { logo, siteName } = useLayout();
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [choices, setChoices] = useState(EMPTY_CHOICES);
  const [visible, setVisible] = useState(false);

  const authInitialized = useRef(false);
  const previousUserId = useRef(null);

  useEffect(() => {
    if (authLoading) return;

    const userId = user?.id || null;

    // Do not treat the initial auth hydration as a sign-in.
    // A real null -> user transition is a sign-in/sign-up and must reopen
    // the notice, even when the account has an older valid consent record.
    if (!authInitialized.current) {
      authInitialized.current = true;
      previousUserId.current = userId;
      return;
    }

    const signedIn = !previousUserId.current && userId;
    previousUserId.current = userId;

    if (signedIn) {
      setShowSettings(false);
      setChoices(EMPTY_CHOICES);
      setVisible(false);
      setStatus((prev) => ({
        ...(prev || {}),
        show_notice: true,
        force_auth_notice: true
      }));
      requestAnimationFrame(() => setVisible(true));
    }
  }, [user?.id, authLoading]);

  useEffect(() => {
    if (authLoading || !user?.id) {
      if (!user?.id && !authLoading) {
        setStatus(null);
        setVisible(false);
      }
      return undefined;
    }

    let active = true;

    getRequest('cookie-consent', 'status')
      .then((data) => {
        if (!active) return;

        setStatus(data);

        if (data?.consent) {
          setChoices({
            preferences: data.consent.preferences === true,
            analytics: data.consent.analytics === true,
            marketing: data.consent.marketing === true
          });
        } else {
          setChoices(EMPTY_CHOICES);
        }

        if (data?.show_notice) {
          requestAnimationFrame(() => {
            if (active) setVisible(true);
          });
        }
      })
      .catch(() => {
        if (active) setStatus({ show_notice: false });
      });

    return () => {
      active = false;
    };
  }, [user?.id, authLoading]);

  const close = () => {
    setVisible(false);
  };

  const save = async (next) => {
    if (saving || !user?.id) return;

    setSaving(true);

    try {
      const data = await apiCall('cookie-consent', 'consent', {
        preferences: next.preferences === true,
        analytics: next.analytics === true,
        marketing: next.marketing === true
      }, 'POST');

      if (data?.saved) {
        setChoices({
          preferences: data.consent.preferences === true,
          analytics: data.consent.analytics === true,
          marketing: data.consent.marketing === true
        });
        setShowSettings(false);
        setVisible(false);

        window.setTimeout(() => {
          setStatus((prev) => ({
            ...(prev || {}),
            show_notice: false,
            force_auth_notice: false,
            consent: data.consent
          }));
        }, 520);
      }
    } catch {
      // Keep the notice open so the user can retry if persistence fails.
    } finally {
      setSaving(false);
    }
  };

  if (!user?.id || !status?.show_notice) return null;

  return (
    <div
      className={`cookie-consent${visible ? ' cookie-consent-visible' : ''}`}
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-consent-title"
    >
      <div className="relative rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-7">
        <button
          type="button"
          className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-700 hover:bg-slate-200"
          aria-label="Close cookie notice"
          onClick={close}
          disabled={saving}
        >
          ×
        </button>

        <div className="mb-4 pr-10">
          {logo ? (
            <img src={logo} alt={siteName} className="cookie-consent-logo" />
          ) : (
            <span className="font-bold text-primary-900">{siteName}</span>
          )}
        </div>

        <div className="space-y-4">
          <h2 id="cookie-consent-title" className="text-2xl font-bold text-primary-900">Your cookie preferences</h2>
          <p>
            AliverBiopharm uses essential cookies for secure account sessions.
            You can accept all cookies, reject all optional cookies, or choose
            exactly which optional categories you want to allow.
          </p>

          {showSettings && (
            <div className="grid gap-3 rounded-xl bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-3 text-sm text-slate-700">
                <div>
                  <strong>Essential</strong>
                  <span>Always active for secure sign-in and core site functions.</span>
                </div>
                <input type="checkbox" checked disabled aria-label="Essential cookies always active" className="h-4 w-4 shrink-0 accent-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700">
              </div>

              {[
                ['preferences', 'Preferences', 'Remember choices such as interface and accessibility preferences.'],
                ['analytics', 'Analytics', 'Allow anonymous usage measurement where enabled by the platform.'],
                ['marketing', 'Marketing', 'Allow advertising and campaign measurement cookies where enabled.']
              ].map(([key, label, description]) => (
                <label key={key} className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                  <div>
                    <strong>{label}</strong>
                    <span>{description}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={choices[key]}
                    onChange={(event) = className="h-4 w-4 shrink-0 accent-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"> setChoices((prev) => ({
                      ...prev,
                      [key]: event.target.checked
                    }))}
                  />
                </label>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 [&>button]:min-h-10 [&>button]:rounded-xl [&>button]:px-4 [&>button]:py-2 [&>button]:font-semibold">
            <button
              type="button"
              className="btn btn-primary"
              disabled={saving}
              onClick={() => save({ preferences: true, analytics: true, marketing: true })}
            >
              Accept all
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={() => save({ preferences: false, analytics: false, marketing: false })}
            >
              Reject all
            </button>

            {showSettings ? (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => save(choices)}
              >
                Save preferences
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-ghost"
                disabled={saving}
                onClick={() => setShowSettings(true)}
              >
                Manage cookies
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
