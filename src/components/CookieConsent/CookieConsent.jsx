import { useEffect, useState } from 'react';
import { getRequest, apiCall } from '../../api/client';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';

export default function CookieConsent() {
  const { logo, siteName } = useLayout();
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [choices, setChoices] = useState({ preferences: false, analytics: false, marketing: false });
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let active = true;
    getRequest('cookie-consent', 'status')
      .then((data) => {
        if (!active) return;
        setStatus(data);
        if (data?.show_notice) requestAnimationFrame(() => setVisible(true));
        if (data?.consent) setChoices(data.consent);
      })
      .catch(() => setStatus({ show_notice: false }));
    return () => { active = false; };
  }, [user?.id, authLoading]);

  const close = () => setVisible(false);

  const save = async (next) => {
    if (saving) return;
    setSaving(true);
    try {
      const data = await apiCall('cookie-consent', 'consent', next, 'POST');
      if (data?.saved) {
        setVisible(false);
        setTimeout(() => setStatus((prev) => ({ ...(prev || {}), show_notice: false, consent: data.consent })), 420);
      }
    } catch {
      // Keep the notice visible when persistence fails.
    } finally {
      setSaving(false);
    }
  };

  if (!status?.show_notice) return null;

  return (
    <div className={`cookie-consent${visible ? ' cookie-consent-visible' : ''}`} role="dialog" aria-modal="false" aria-labelledby="cookie-consent-title">
      <div className="cookie-consent-card">
        <button type="button" className="cookie-consent-close" aria-label="Close cookie notice" onClick={close} disabled={saving}>×</button>
        <div className="cookie-consent-brand">
          {logo ? <img src={logo} alt={siteName} className="cookie-consent-logo" /> : <span className="cookie-consent-wordmark">{siteName}</span>}
        </div>
        <div className="cookie-consent-content">
          <h2 id="cookie-consent-title">Your cookie preferences</h2>
          <p>AliverBiopharm uses essential cookies for secure account sessions. Optional preferences help remember your choices, while analytics and marketing cookies are used only when you allow them.</p>
          {showSettings && (
            <div className="cookie-consent-options">
              {['preferences','analytics','marketing'].map((key) => (
                <label key={key}><input type="checkbox" checked={choices[key]} onChange={(e) => setChoices((prev) => ({ ...prev, [key]: e.target.checked }))} /> {key[0].toUpperCase() + key.slice(1)}</label>
              ))}
            </div>
          )}
          <div className="cookie-consent-actions">
            <button type="button" className="btn btn-primary" disabled={saving} onClick={() => save({ preferences: true, analytics: true, marketing: true })}>Accept all</button>
            <button type="button" className="btn btn-secondary" disabled={saving} onClick={() => save({ preferences: false, analytics: false, marketing: false })}>Reject optional</button>
            <button type="button" className="btn btn-ghost" disabled={saving} onClick={() => setShowSettings((v) => !v)}>{showSettings ? 'Hide options' : 'Manage preferences'}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
