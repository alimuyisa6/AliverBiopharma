 import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLayout } from '../contexts/LayoutContext';
import { useI18n } from '../contexts/I18nContext';
import { SUPPORTED_LOCALES } from '../i18n/locales';
import {
  updateProfile,
  changePassword,
  requestLevelChange,
  getProfile,
  getCurriculumLevels,
  updateDisplayName,
  getSettingsBundle,
  getProfileNotificationPreferences,
  updateProfileNotificationPreference,
  getDevices,
  updateDeviceMetadata,
  revokeDevice,
  getBillingSummary,
  getReferralStats,
  getCertificates,
  getApiKeys,
  createApiKey,
  revokeApiKey,
  getWebhooks,
  createWebhook,
  deleteWebhook,
  updateBio,
  updatePreferences,
  saveParentGuardian,
  requestDataExport,
  requestAccountDeletion,
  getPasskeys,
  deletePasskey
} from '../api/client';

import PageHeader from '../components/PageHeader/PageHeader';
import Container from '../components/Container/Container';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import ProfilePictureUpload from '../components/ProfilePictureUpload/ProfilePictureUpload';
import Spinner from '../components/Spinner/Spinner';
import TurnstileWidget from '../components/TurnstileWidget';
import Skeleton from '../components/Skeleton/Skeleton';
import Card from '../components/Card/Card';
import Icon from '../components/Icon/Icon';
import { useToast } from '../components/Toast/Toast';
import { registerPasskey, signInForPasskeyEnrollment } from '../lib/passkeyClient';

const THEME = {
  textMain: 'var(--text-main)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textInverse: 'var(--text-inverse)',
  accent: 'var(--primary)',
  success: 'var(--success)',
  error: 'var(--danger)',
  bgCard: 'var(--bg-card)',
  border: 'var(--border-default)',
  font: 'var(--font-maven)'
};

function collectBrowserDeviceMetadata() {
  if (typeof window === 'undefined') return null;

  const uaData = navigator.userAgentData;
  let deviceId = null;

  try {
    deviceId = localStorage.getItem('aliver_device_id');

    if (!deviceId) {
      const randomId =
        globalThis.crypto?.randomUUID?.() ||
        `web-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

      deviceId = `ALV-${randomId}`;
      localStorage.setItem('aliver_device_id', deviceId);
    }
  } catch {
    deviceId = null;
  }

  const uaString = navigator.userAgent || '';

  // Android Chrome may expose the exact model through User-Agent Client Hints.
  // When the legacy UA also contains a manufacturer token, preserve it so the
  // profile can show a useful device name such as "TECNO KJ5" rather than only
  // the raw model code.
  const manufacturerMatch = uaString.match(
    /(?:Linux;\\s*Android[^;]*;\\s*)([A-Za-z][A-Za-z0-9._-]*)\\s+([A-Za-z0-9._-]+)/i
  );
  const legacyDeviceName = manufacturerMatch
    ? `${manufacturerMatch[1]} ${manufacturerMatch[2]}`
    : null;

  const fallback = {
    deviceId,
    model: legacyDeviceName,

    platform: uaData?.platform || null,
    platformVersion: null,
    browser: null,
    browserVersion: null
  };

  if (!uaData?.getHighEntropyValues) {
    return Promise.resolve(fallback);
  }

  return uaData.getHighEntropyValues([
    'model',
    'platform',
    'platformVersion',
    'fullVersionList'
  ]).then((high) => {
    const browser = Array.isArray(high.fullVersionList)
      ? high.fullVersionList.find(
          (item) => !/Chromium|Not.?A.?Brand/i.test(item.brand)
        ) || high.fullVersionList[0]
      : null;

    return {
      ...fallback,
      model: high.model || null,
      platform: high.platform || fallback.platform,
      platformVersion: high.platformVersion || null,
      browser: browser?.brand || null,
      browserVersion: browser?.version || null
    };
  }).catch(() => fallback);
}

const SECTIONS = [
  { id: 'overview', key: 'profileOverview' },
  { id: 'curriculum', key: 'learningCurriculum' },
  { id: 'notifications', key: 'notifications' },
  { id: 'security', key: 'securityLogin' },
  { id: 'devices', key: 'connectedDevices' },
  { id: 'preferences', key: 'preferencesTheme' },
  { id: 'referral', key: 'referralProgram' },
  { id: 'parent', key: 'parentGuardian' },
  { id: 'billing', key: 'billingPayments' },
  { id: 'certificates', key: 'certificates' },
  { id: 'api', key: 'apiAccess' },
  { id: 'webhooks', key: 'webhooks' },
  { id: 'account', key: 'accountData' }
];

function Toggle({ active, onClick, label }) {
  return (
    <button
      type="button"
      className={`toggle-switch${active ? ' active' : ''}`}
      onClick={onClick}
      role="switch"
      aria-checked={active}
      aria-label={label}
    />
  );
}

function getExactErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error && error.message) return error.message;
  if (typeof error.message === 'string' && error.message.trim()) return error.message.trim();
  if (typeof error.error === 'string' && error.error.trim()) return error.error.trim();
  if (typeof error.error?.message === 'string' && error.error.message.trim()) return error.error.message.trim();
  if (typeof error.details === 'string' && error.details.trim()) return error.details.trim();
  if (typeof error.hint === 'string' && error.hint.trim()) return error.hint.trim();
  if (typeof error.data?.message === 'string' && error.data.message.trim()) return error.data.message.trim();
  if (typeof error.data?.error === 'string' && error.data.error.trim()) return error.data.error.trim();
  try {
    const serialized = JSON.stringify(error);
    if (serialized && serialized !== '{}') return serialized;
  } catch {
    return fallback;
  }
  return fallback;
}

function logProfileError(context, error) {
  console.error(`[PROFILE] ${context}`, error);
}

function ProfileError({ error, title = 'Unable to load this section', onRetry, t }) {
  if (!error) return null;

  return (
    <div className="profile-error" role="alert" aria-live="assertive">
      <div className="profile-error-icon">
        <Icon name="alert-circle" />
      </div>
      <div className="profile-error-body">
        <h4 style={{ color: THEME.error, fontFamily: THEME.font, margin: 0 }}>{title}</h4>
        <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, margin: '4px 0 12px' }}>{error}</p>
        {onRetry && (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            {t('common.retry')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, refresh, logout } = useAuth();
  const { theme, toggleTheme, uiPreferences } = useLayout();
  const { locale, setLocale, t } = useI18n();
  const addToast = useToast();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [passwordCaptchaToken, setPasswordCaptchaToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passkeys, setPasskeys] = useState([]);
  const [passkeyPassword, setPasskeyPassword] = useState('');
  const [passkeyCaptchaToken, setPasskeyCaptchaToken] = useState('');
  const [registeringPasskey, setRegisteringPasskey] = useState(false);
  const [deletingPasskeyId, setDeletingPasskeyId] = useState(null);

  const [levelReqTrack, setLevelReqTrack] = useState('');
  const [levelReqReason, setLevelReqReason] = useState('');
  const [levelReqLoading, setLevelReqLoading] = useState(false);

  const [profileMeta, setProfileMeta] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [availableLevels, setAvailableLevels] = useState([]);
  const [availableLevelsLoading, setAvailableLevelsLoading] = useState(false);

  const [bundle, setBundle] = useState(null);
  const [bundleLoading, setBundleLoading] = useState(true);

  const [notifPrefs, setNotifPrefs] = useState([]);
  const [devices, setDevices] = useState([]);
  const [billing, setBilling] = useState(null);
  const [referral, setReferral] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [apiKeys, setApiKeys] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [revokingDeviceId, setRevokingDeviceId] = useState(null);
  const [revokingKeyId, setRevokingKeyId] = useState(null);
  const [deletingWebhookId, setDeletingWebhookId] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deletionLoading, setDeletionLoading] = useState(false);
  const [savingUIPreference, setSavingUIPreference] = useState(null);
  const [saveStatus, setSaveStatus] = useState({});


  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');
  const [guardianRelationship, setGuardianRelationship] = useState('Parent');
  const [savingGuardian, setSavingGuardian] = useState(false);

  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);
  const [revealedKey, setRevealedKey] = useState(null);

  const [profileError, setProfileError] = useState('');
  const [bundleError, setBundleError] = useState('');
  const [curriculumError, setCurriculumError] = useState('');
  const [sectionError, setSectionError] = useState('');

  useEffect(() => {
    if (user?.full_name) setFullName(user.full_name);
    if (user?.profile?.display_name) setDisplayName(user.profile.display_name);
  }, [user]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');
    try {
      const data = await getProfile();
      if (!data || typeof data !== 'object') {
        throw new Error(`Profile request succeeded but returned invalid data: ${JSON.stringify(data)}`);
      }
      setProfileMeta(data);
      setBio(data?.bio || '');

      // Keep the editable fields aligned with the authoritative profile response.
      // This prevents an unchanged form from being treated as a new save.
      const loadedFullName = String(
        data?.full_name ?? data?.name ?? user?.full_name ?? ''
      );
      const loadedDisplayName = String(
        data?.display_name ?? data?.profile?.display_name ?? user?.profile?.display_name ?? ''
      );
      setFullName(loadedFullName);
      setDisplayName(loadedDisplayName);
      console.info('[PROFILE] Profile loaded successfully', data);
    } catch (error) {
      const message = getExactErrorMessage(error, 'Failed to load your profile.');
      logProfileError('getProfile failed', error);
      setProfileError(message);
      addToast(message, 'error');
    } finally {
      setProfileLoading(false);
    }
  }, [addToast]);

  const loadBundle = useCallback(async () => {
    setBundleLoading(true);
    setBundleError('');
    try {
      const data = await getSettingsBundle();
      if (!data || typeof data !== 'object') {
        throw new Error(`Settings bundle request succeeded but returned invalid data: ${JSON.stringify(data)}`);
      }
      setBundle(data);
      console.info('[PROFILE] Settings bundle loaded successfully', data);
    } catch (error) {
      const message = getExactErrorMessage(error, 'Failed to load profile settings.');
      logProfileError('getSettingsBundle failed', error);
      setBundleError(message);
      addToast(message, 'error');
    } finally {
      setBundleLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!user) {
      setProfileLoading(false);
      setBundleLoading(false);
      setProfileMeta(null);
      setBundle(null);
      return;
    }
    loadProfile();
    loadBundle();
  }, [user, loadProfile, loadBundle]);

  const loadCurriculumLevels = useCallback(async () => {
    setAvailableLevelsLoading(true);
    setCurriculumError('');
    try {
      const data = await getCurriculumLevels();
      if (!Array.isArray(data)) {
        throw new Error(`Curriculum levels request returned invalid data: ${JSON.stringify(data)}`);
      }
      setAvailableLevels(data);
      console.info('[PROFILE] Curriculum levels loaded successfully', data);
    } catch (error) {
      const message = getExactErrorMessage(error, 'Failed to load curriculum levels.');
      logProfileError('getCurriculumLevels failed', error);
      setCurriculumError(message);
      addToast(message, 'error');
    } finally {
      setAvailableLevelsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (!profileMeta || profileMeta.role === 'teacher' || availableLevels.length || availableLevelsLoading) {
      return;
    }
    loadCurriculumLevels();
  }, [profileMeta, availableLevels.length, availableLevelsLoading, loadCurriculumLevels]);

  const loadSection = useCallback(
    async (id) => {
      setSectionLoading(true);
      setSectionError('');
      try {
        let data;
        if (id === 'security') {
          data = await getPasskeys();
          if (!Array.isArray(data)) throw new Error(`Passkeys request returned invalid data: ${JSON.stringify(data)}`);
          setPasskeys(data);
        } else if (id === 'notifications') {
          data = await getProfileNotificationPreferences();
          if (!Array.isArray(data)) throw new Error(`Notifications request returned invalid data: ${JSON.stringify(data)}`);
          setNotifPrefs(data);
        } else if (id === 'devices') {
          const device = await collectBrowserDeviceMetadata();
          if (device) await updateDeviceMetadata(device);
          data = await getDevices();
          if (!Array.isArray(data)) throw new Error(`Devices request returned invalid data: ${JSON.stringify(data)}`);
          setDevices(data);
        } else if (id === 'billing') {
          data = await getBillingSummary();
          if (!data || typeof data !== 'object') throw new Error(`Billing request returned invalid data: ${JSON.stringify(data)}`);
          setBilling(data);
        } else if (id === 'referral') {
          data = await getReferralStats();
          if (!data || typeof data !== 'object') throw new Error(`Referral request returned invalid data: ${JSON.stringify(data)}`);
          setReferral(data);
        } else if (id === 'certificates') {
          data = await getCertificates();
          if (!Array.isArray(data)) throw new Error(`Certificates request returned invalid data: ${JSON.stringify(data)}`);
          setCertificates(data);
        } else if (id === 'api') {
          data = await getApiKeys();
          if (!Array.isArray(data)) throw new Error(`API keys request returned invalid data: ${JSON.stringify(data)}`);
          setApiKeys(data);
        } else if (id === 'webhooks') {
          data = await getWebhooks();
          if (!Array.isArray(data)) throw new Error(`Webhooks request returned invalid data: ${JSON.stringify(data)}`);
          setWebhooks(data);
        }
        console.info(`[PROFILE] Section "${id}" loaded successfully`, data);
      } catch (error) {
        const message = getExactErrorMessage(error, `Failed to load the ${id} section.`);
        logProfileError(`loadSection("${id}") failed`, error);
        setSectionError(message);
        addToast(message, 'error');
      } finally {
        setSectionLoading(false);
      }
    },
    [addToast]
  );

  useEffect(() => {
    loadSection(activeSection);
  }, [activeSection, loadSection]);

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') setSidebarOpen(false);
    };
    if (sidebarOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [sidebarOpen]);

  const selectSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    setSectionError('');
  };

  const levelChangeOptions = useMemo(
    () => availableLevels.filter((lvl) => lvl.display_name !== profileMeta?.track),
    [availableLevels, profileMeta]
  );

  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: '', color: '' };
    let score = 0;
    if (newPassword.length >= 10) score++;
    if (newPassword.length >= 14) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;
    if (score <= 2) return { score: 1, label: 'Weak', color: THEME.error };
    if (score <= 3) return { score: 2, label: 'Fair', color: 'var(--warning)' };
    return { score: 3, label: 'Strong', color: THEME.success };
  }, [newPassword]);

  const setSaveResult = (key, status) => {
    setSaveStatus((prev) => ({ ...prev, [key]: status }));
    window.setTimeout(() => setSaveStatus((prev) => ({ ...prev, [key]: null })), 1800);
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    const trimmed = fullName.trim();
    const trimmedDisplayName = displayName.trim();
    if (trimmed.length < 2 || trimmed.length > 100) {
      addToast('Name must be between 2 and 100 characters', 'error');
      return;
    }
    const currentName = String(
      user?.full_name ?? profileMeta?.full_name ?? profileMeta?.name ?? ''
    ).trim();
    const currentDisplayName = String(
      user?.profile?.display_name ?? profileMeta?.display_name ?? profileMeta?.profile?.display_name ?? ''
    ).trim();
    if (trimmed === currentName && trimmedDisplayName === currentDisplayName) {
      setSaveResult('profile', null);
      addToast('No changes to save', 'error');
      return;
    }
    setSaveResult('profile', null);
    setSavingProfile(true);
    try {
      await updateProfile(trimmed);
      if (trimmedDisplayName && trimmedDisplayName.length >= 2) {
        await updateDisplayName(trimmedDisplayName);
      }
      await refresh();
      setSaveResult('profile', 'success');
      addToast('Profile updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update profile');
      logProfileError('handleProfileSubmit failed', err);
      setSaveResult('profile', 'error');
      addToast(message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    if (bio.trim() === String(profileMeta?.bio || '').trim()) {
      setSaveResult('bio', null);
      addToast('No changes to save', 'error');
      return;
    }
    setSaveResult('bio', null);
    setSavingBio(true);
    try {
      await updateBio(bio.trim());
      setSaveResult('bio', 'success');
      addToast('Biography updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update biography');
      logProfileError('handleBioSubmit failed', err);
      setSaveResult('bio', 'error');
      addToast(message, 'error');
    } finally {
      setSavingBio(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setSaveResult('password', null);
    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }
    if (newPassword.length < 10) {
      addToast('Password must be at least 10 characters', 'error');
      return;
    }
    if (!passwordCaptchaToken) {
      addToast('Please complete the security verification before changing your password.', 'error');
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword, passwordCaptchaToken);
      setCurrentPassword('');
      setPasswordCaptchaToken('');
      setNewPassword('');
      setConfirmPassword('');
      setSaveResult('password', 'success');
      addToast('Password changed', 'success');
    } catch (err) {
      setPasswordCaptchaToken('');
      const message = getExactErrorMessage(err, 'Failed to change password');
      logProfileError('handlePasswordSubmit failed', err);
      setSaveResult('password', 'error');
      addToast(message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleRegisterPasskey = async () => {
    if (!user?.email) {
      addToast('Your account email is unavailable. Please refresh and try again.', 'error');
      return;
    }

    if (!passkeyPassword) {
      addToast('Enter your current password to authorize adding this passkey.', 'error');
      return;
    }

    if (typeof window === 'undefined' || !window.isSecureContext || !window.PublicKeyCredential) {
      addToast('This browser does not currently support secure passkey registration.', 'error');
      return;
    }

    if (!passkeyCaptchaToken) {
      addToast('Please complete the security verification before adding a passkey.', 'error');
      return;
    }

    setRegisteringPasskey(true);

    try {
      await signInForPasskeyEnrollment(user.email, passkeyPassword, passkeyCaptchaToken);
      const { data, error } = await registerPasskey();
      if (error) throw error;

      setPasskeyPassword('');
      setPasskeyCaptchaToken('');
      await loadSection('security');
      addToast(
        data?.friendly_name
          ? `Passkey added: ${data.friendly_name}`
          : 'Passkey added successfully',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(err, 'Passkey registration failed.');
      logProfileError('handleRegisterPasskey failed', err);
      addToast(message, 'error');
    } finally {
      setRegisteringPasskey(false);
    }
  };

  const handleDeletePasskey = async (passkeyId) => {
    if (!passkeyId) return;

    if (!window.confirm('Remove this passkey from your account? You will no longer be able to use it to sign in.')) {
      return;
    }

    setDeletingPasskeyId(passkeyId);

    try {
      await deletePasskey(passkeyId);
      setPasskeys((prev) => prev.filter((passkey) => passkey.id !== passkeyId));
      addToast('Passkey removed', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to remove passkey.');
      logProfileError('handleDeletePasskey failed', err);
      addToast(message, 'error');
    } finally {
      setDeletingPasskeyId(null);
    }
  };

  const handleLevelChangeRequest = async (e) => {
    e.preventDefault();
    setSaveResult('level', null);
    if (!levelReqTrack || !levelReqReason.trim()) {
      addToast('Please complete all fields', 'error');
      return;
    }
    setLevelReqLoading(true);
    try {
      await requestLevelChange(levelReqTrack, null, levelReqReason);
      setLevelReqTrack('');
      setLevelReqReason('');
      setSaveResult('level', 'success');
      addToast('Level change request submitted', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to submit request');
      logProfileError('handleLevelChangeRequest failed', err);
      setSaveResult('level', 'error');
      addToast(message, 'error');
    } finally {
      setLevelReqLoading(false);
    }
  };

  const handleThemeChange = async (color) => {
    try {
      const updated = await updatePreferences({ theme_color: color });
      setBundle((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...updated.profile } } : prev));
      await refresh();
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update theme');
      logProfileError('handleThemeChange failed', err);
      addToast(message, 'error');
    }
  };

  const handleUIPreferenceChange = async (key, value) => {
    const previous = uiPreferences?.[key];
    const nextUI = { ...(bundle?.profile?.preferences?.ui || uiPreferences || {}), [key]: value };

    setSavingUIPreference(key);
    try {
      const updated = await updatePreferences({
        preferences: { ui: nextUI }
      });

      setBundle((prev) => (
        prev
          ? { ...prev, profile: { ...prev.profile, ...updated.profile } }
          : prev
      ));
      await refresh();
      addToast('Display preference updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update display preference');
      logProfileError('handleUIPreferenceChange failed', err);
      addToast(message, 'error');
    } finally {
      setSavingUIPreference(null);
    }

    return previous;
  };

  const handlePreferenceChange = async (field, value) => {
    try {
      const updated = await updatePreferences({ [field]: value });
      setBundle((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...updated.profile } } : prev));
      await refresh();
      addToast(field === 'language' ? 'Language preference updated' : 'Timezone preference updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update preference');
      logProfileError('handlePreferenceChange failed', err);
      addToast(message, 'error');
    }
  };

  const handleAccessibilityToggle = async (key, currentValue) => {
    const accessibility = { ...(bundle?.profile?.accessibility || {}), [key]: !currentValue };
    try {
      const updated = await updatePreferences({ accessibility });
      setBundle((prev) => (prev ? { ...prev, profile: { ...prev.profile, ...updated.profile } } : prev));
      await refresh();
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update accessibility setting');
      logProfileError('handleAccessibilityToggle failed', err);
      addToast(message, 'error');
    }
  };

  const handleNotifToggle = async (module, field, current) => {
    setNotifPrefs((prev) => prev.map((p) => (p.module === module ? { ...p, [field]: !current } : p)));
    try {
      await updateProfileNotificationPreference(module, { [field]: !current });
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to update notification setting');
      logProfileError('handleNotifToggle failed', err);
      addToast(message, 'error');
      loadSection('notifications');
    }
  };

  const handleRevokeDevice = async (sessionId) => {
    setRevokingDeviceId(sessionId);
    try {
      await revokeDevice(sessionId);
      setDevices((prev) => prev.filter((d) => d.id !== sessionId));
      addToast('Device signed out', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to revoke device');
      logProfileError('handleRevokeDevice failed', err);
      addToast(message, 'error');
    } finally {
      setRevokingDeviceId(null);
    }
  };

  const handleCreateApiKey = async () => {
    setCreatingKey(true);
    try {
      const result = await createApiKey('Default Key');
      if (!result?.raw_key) {
        throw new Error(`API key was created but no raw_key was returned: ${JSON.stringify(result)}`);
      }
      setRevealedKey(result.raw_key);
      loadSection('api');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to create key');
      logProfileError('handleCreateApiKey failed', err);
      addToast(message, 'error');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    setRevokingKeyId(keyId);
    try {
      await revokeApiKey(keyId);
      setApiKeys((prev) => prev.map((k) => (k.id === keyId ? { ...k, is_active: false } : k)));
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to revoke key');
      logProfileError('handleRevokeApiKey failed', err);
      addToast(message, 'error');
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleCreateWebhook = async () => {
    if (!/^https:\/\//.test(newWebhookUrl)) {
      addToast('Enter a valid https:// URL', 'error');
      return;
    }
    setCreatingWebhook(true);
    try {
      await createWebhook(newWebhookUrl, ['*']);
      setNewWebhookUrl('');
      loadSection('webhooks');
      addToast('Webhook created', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to create webhook');
      logProfileError('handleCreateWebhook failed', err);
      addToast(message, 'error');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    setDeletingWebhookId(id);
    try {
      await deleteWebhook(id);
      setWebhooks((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to delete webhook');
      logProfileError('handleDeleteWebhook failed', err);
      addToast(message, 'error');
    } finally {
      setDeletingWebhookId(null);
    }
  };

  const handleSaveGuardian = async (e) => {
    e.preventDefault();
    setSaveResult('guardian', null);
    if (!guardianName.trim() || !guardianEmail.trim()) {
      addToast('Guardian name and email are required', 'error');
      return;
    }
    setSavingGuardian(true);
    try {
      await saveParentGuardian({
        guardian_name: guardianName.trim(),
        guardian_email: guardianEmail.trim(),
        guardian_relationship: guardianRelationship
      });
      setSaveResult('guardian', 'success');
      addToast('Guardian information saved', 'success');
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to save guardian information');
      logProfileError('handleSaveGuardian failed', err);
      setSaveResult('guardian', 'error');
      addToast(message, 'error');
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleDataExport = async () => {
    setExportLoading(true);
    try {
      const result = await requestDataExport();
      const downloadUrl = result?.request?.download_url;

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = 'aliverbiopharma-data.json';
        link.target = '_blank';
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
        addToast('Your data export is ready and downloading now', 'success');
      } else {
        addToast('Your data export could not be prepared', 'error');
      }
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to export your data');
      logProfileError('handleDataExport failed', err);
      addToast(message, 'error');
    } finally {
      setExportLoading(false);
    }
  };

  const handleAccountDeletion = async () => {
    if (!window.confirm('This permanently deletes your account and associated personal data. Continue?')) return;
    setDeletionLoading(true);
    try {
      const result = await requestAccountDeletion();

      if (result?.deleted) {
        addToast('Your account and associated personal data have been deleted', 'success');
        await logout();
      } else {
        throw new Error('Account deletion was not completed');
      }
    } catch (err) {
      const message = getExactErrorMessage(err, 'Failed to delete your account');
      logProfileError('handleAccountDeletion failed', err);
      addToast(message, 'error');
      setDeletionLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <Container>
        <PageHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
        />
        <div className="profile-loading-skeleton">
          <Skeleton variant="avatar" width={96} height={96} />
        </div>
        <div className="grid grid-cols-2 profile-skeleton-grid">
          <Card variant="inset" loading={true} loadingLines={4} />
          <Card variant="inset" loading={true} loadingLines={4} />
        </div>
        {profileError && <ProfileError error={profileError} title={t('profile.profileLoadError')} onRetry={loadProfile} t={t} />}
        {bundleError && <ProfileError error={bundleError} title={t('profile.settingsLoadError')} onRetry={loadBundle} t={t} />}
      </Container>
    );
  }

  const initial = (profileMeta?.display_name || profileMeta?.full_name || user?.email || 'S').charAt(0).toUpperCase();

  return (
    <div style={{ background: THEME.bgCard, minHeight: '100vh', fontFamily: THEME.font }}>
      <Container>
        <PageHeader
          title={t('profile.title')}
          subtitle={t('profile.subtitle')}
        />

        {profileError && <ProfileError error={profileError} title={t('profile.profileDataLoadError')} onRetry={loadProfile} />}
        {bundleError && <ProfileError error={bundleError} title={t('profile.settingsDataLoadError')} onRetry={loadBundle} />}

        <div className="profile-toolbar">
          <div className="profile-toolbar-copy">
            <span style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12, textTransform: 'uppercase' }}>
              {t('profile.settings')}
            </span>
            <span style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
              {t(`profile.${SECTIONS.find((section) => section.id === activeSection)?.key || 'profileOverview'}`)}
            </span>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="profile-sidebar-toggle"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-expanded={sidebarOpen}
            aria-controls="profile-sidebar"
          >
            {sidebarOpen ? t('profile.closeSections') : t('profile.profileSections')}
          </Button>
        </div>

        <div className={`profile-layout${sidebarOpen ? ' sidebar-open' : ''}`}>
          <button
            type="button"
            className="profile-sidebar-backdrop"
            aria-label={t('profile.closeSections')}
            onClick={() => setSidebarOpen(false)}
          />

          <aside id="profile-sidebar" className="profile-sidebar" aria-label={t('profile.profileSections')}>
            <div className="profile-sidebar-inner" style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}` }}>
              <div className="profile-sidebar-profile">
                <div className="profile-avatar-lg" style={{ color: THEME.accent, fontFamily: THEME.font }}>
                  {initial}
                </div>
                <div className="profile-sidebar-details">
                  <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 13, fontWeight: 600 }}>
                    {profileMeta?.display_name || profileMeta?.full_name || 'Student'}
                  </div>
                  <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 11 }}>
                    {profileMeta?.track || 'No level set'}
                    <span aria-hidden="true"> · </span>
                    {profileMeta?.class_name || 'No class set'}
                  </div>
                </div>
              </div>

              <div className="profile-stats-grid">
                <div className="profile-stat-tile" style={{ border: `1px solid ${THEME.border}` }}>
                  <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 500 }}>
                    {bundle?.active_device_count ?? '—'}
                  </div>
                  <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>{t('profile.devices')}</div>
                </div>
                <div className="profile-stat-tile" style={{ border: `1px solid ${THEME.border}` }}>
                  <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 500 }}>
                    {bundle?.referral_count ?? '—'}
                  </div>
                  <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>{t('profile.referrals')}</div>
                </div>
              </div>

              <nav className="profile-nav" aria-label={t('profile.profileSections')}>
                <ul className="profile-nav-list">
                  {SECTIONS.map((section) => (
                    <li key={section.id}>
                      <button
                        type="button"
                        className={activeSection === section.id ? 'active' : ''}
                        onClick={() => selectSection(section.id)}
                        aria-current={activeSection === section.id ? 'page' : undefined}
                        style={{
                          color: activeSection === section.id ? THEME.accent : THEME.textSecondary,
                          fontFamily: THEME.font,
                          fontSize: 14
                        }}
                      >
                        {t(`profile.${section.key}`)}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </aside>

          <div className="profile-content">
            {sectionError && (
              <ProfileError
                error={sectionError}
                title={t('profile.sectionLoadError')}
                onRetry={() => loadSection(activeSection)} t={t}
              />
            )}

            {activeSection === 'overview' && (
              <>
                <div className="profile-avatar-wrapper">
                  <ProfilePictureUpload currentUrl={user?.profile?.profile_picture_url} onUpdate={() => refresh()} size={96} />
                </div>

                <form onSubmit={handleProfileSubmit}>
                  <Card variant="inset" className="profile-card-main card-lifted">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                      <Icon name="id-card" style={{ color: THEME.accent }} />
                      Personal Information
                    </h3>
                    <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                      Update your legal and display name. Your display name is shown publicly across reviews and comments.
                    </p>

                    <Input label="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={savingProfile} />
                    <Input
                      label={t('profile.displayName')}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={savingProfile}
                      hint={t('profile.displayNameHint')}
                    />
                    <Input label={t('profile.email')} value={profileMeta?.email || user?.email || ''} disabled />

                    <Button type="submit" loading={savingProfile} status={saveStatus.profile} loadingContext="brand" variant="outline" icon="check">
                      Save Changes
                    </Button>
                  </Card>
                </form>

                <form onSubmit={handleBioSubmit}>
                  <Card variant="inset" className="profile-card card-lifted">
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                      <Icon name="pen" style={{ color: 'var(--secondary)' }} />
                      Professional Biography
                    </h3>
                    <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                      Share a brief professional biography outlining your background, interests, and current course of study.
                    </p>

                    <textarea
                      className="form-textarea"
                      style={{ color: THEME.textMain, fontFamily: THEME.font, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}
                      rows={3}
                      maxLength={500}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder={t('profile.bioPlaceholder')}
                    />

                    <Button type="submit" loading={savingBio} status={saveStatus.bio} loadingContext="brand" variant="outline" icon="check" style={{ marginTop: 12 }}>
                      Save Biography
                    </Button>
                  </Card>
                </form>
              </>
            )}

            {activeSection === 'curriculum' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="route" style={{ color: 'var(--accent)' }} />
                  Learning Curriculum
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Your current level is <strong style={{ color: THEME.textMain }}>{profileMeta?.track || 'Not set'}</strong>, class{' '}
                  <strong style={{ color: THEME.textMain }}>{profileMeta?.class_name || 'Not set'}</strong>. Level changes require
                  administrator approval.
                </p>

                {curriculumError && (
                  <ProfileError error={curriculumError} title="Curriculum levels could not be loaded" onRetry={loadCurriculumLevels} />
                )}

                {profileMeta?.role !== 'teacher' && (
                  <form onSubmit={handleLevelChangeRequest}>
                    <div className="form-group">
                      <label style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14 }}>New Level</label>
                      <select
                        className="form-select"
                        style={{ color: THEME.textMain, fontFamily: THEME.font, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}
                        value={levelReqTrack}
                        onChange={(e) => setLevelReqTrack(e.target.value)}
                        required
                        disabled={availableLevelsLoading}
                      >
                        <option value="">{t('profile.selectLevel')}</option>
                        {levelChangeOptions.map((lvl) => (
                          <option key={lvl.id || lvl.key || lvl.display_name} value={lvl.display_name}>
                            {lvl.display_name}
                          </option>
                        ))}
                      </select>
                      {availableLevelsLoading && <Spinner context="data" size="sm" />}
                    </div>

                    <div className="form-group">
                      <label style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14 }}>Reason</label>
                      <textarea
                        className="form-textarea"
                        style={{ color: THEME.textMain, fontFamily: THEME.font, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}
                        rows={3}
                        value={levelReqReason}
                        onChange={(e) => setLevelReqReason(e.target.value)}                        required
                      />
                    </div>

                    <Button type="submit" loading={levelReqLoading} status={saveStatus.level} loadingContext="brand" variant="outline" icon="route">
                      Submit Request
                    </Button>
                  </form>
                )}
              </Card>
            )}

            {activeSection === 'notifications' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="bell" style={{ color: THEME.accent }} />
                  Notifications
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Select how you would like to receive updates across in-app, email, and push notification channels.
                </p>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  notifPrefs.map((p) => (
                    <div className="notification-row" key={p.module}>
                      <div className="profile-row-copy">
                        <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>
                          {p.module.replace(/_/g, ' ')}
                        </div>
                        <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>In-app · Email · Push</div>
                      </div>
                      <div className="profile-toggle-group">
                        <Toggle active={p.in_app} onClick={() => handleNotifToggle(p.module, 'in_app', p.in_app)} />
                        <Toggle active={p.email} onClick={() => handleNotifToggle(p.module, 'email', p.email)} />
                        <Toggle active={p.push} onClick={() => handleNotifToggle(p.module, 'push', p.push)} />
                      </div>
                    </div>
                  ))
                )}

                {!sectionLoading && notifPrefs.length === 0 && !sectionError && (
                  <p style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 14 }}>
                    No notification modules have been configured yet.
                  </p>
                )}
              </Card>
            )}

            {activeSection === 'security' && (
              <>
              <form onSubmit={handlePasswordSubmit}>
                <Card variant="inset" className="profile-card card-lifted">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                    <Icon name="key" style={{ color: 'var(--warning)' }} />
                    Password & Security
                  </h3>
                  <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                    We recommend updating your password periodically to maintain account security. Please choose a strong, unique password.
                  </p>

                  <Input
                    label={t('profile.currentPassword')}
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                  />
                  <Input
                    label={t('profile.newPassword')}
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    hint={t('profile.passwordMin')}
                    required
                    disabled={savingPassword}
                  />

                  {newPassword && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                      <div className="progress-track" style={{ flex: 1 }}>
                        <div
                          className="progress-fill"
                          style={{ width: `${(passwordStrength.score / 3) * 100}%`, background: passwordStrength.color }}
                        />
                      </div>
                      <span style={{ color: passwordStrength.color, fontFamily: THEME.font, fontSize: 12, fontWeight: 500, minWidth: 56, textAlign: 'right' }}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  )}

                  <Input
                    label={t('profile.confirmPassword')}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={savingPassword}
                  />

                  <TurnstileWidget
                    onTokenChange={setPasswordCaptchaToken}
                    disabled={savingPassword}
                  />

                  <Button type="submit" loading={savingPassword} status={saveStatus.password} loadingContext="conic" variant="outline" icon="lock">
                    Update Password
                  </Button>
                </Card>
              </form>

              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="fingerprint" style={{ color: THEME.accent }} />
                  Passkeys
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Sign in securely with a passkey stored on your phone, computer, password manager, or security key.
                  Your passkey is handled by your authenticator; AliverBiopharm never receives the private key.
                </p>

                <div className="profile-passkey-verification" style={{ marginTop: 16, padding: 16, border: `1px solid ${THEME.border}`, borderRadius: 10, background: 'var(--bg-subtle, transparent)' }}>
                  <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600, marginBottom: 6 }}>
                    Verify your identity
                  </div>
                  <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 13, margin: '0 0 12px' }}>
                    Enter your current password to authorize adding a new passkey to this account. Your password is used only for this verification step.
                  </p>
                  <Input
                    label={t('profile.currentPassword')}
                    type="password"
                    value={passkeyPassword}
                    onChange={(e) => setPasskeyPassword(e.target.value)}
                    autoComplete="current-password"
                    disabled={registeringPasskey}
                    hint="After verification, your device will ask you to approve the passkey with your screen lock, PIN, fingerprint, or face."
                  />
                  <Button
                    type="button"
                    variant="outline"
                    icon="fingerprint"
                    loading={registeringPasskey}
                    loadingContext="brand"
                    onClick={handleRegisterPasskey}
                    disabled={!passkeyPassword || registeringPasskey}
                  >
                    Verify & Add Passkey
                  </Button>
                  <TurnstileWidget
                    onTokenChange={setPasskeyCaptchaToken}
                    disabled={registeringPasskey}
                  />
                </div>

                <div style={{ marginTop: 18 }}>
                  {sectionLoading ? (
                    <Spinner context="data" size="sm" />
                  ) : passkeys.length > 0 ? (
                    passkeys.map((passkey) => (
                      <div className="notification-row" key={passkey.id}>
                        <div className="profile-row-copy">
                          <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>
                            {passkey.friendly_name || t('profile.passkey')}
                          </div>
                          <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>
                            Added {passkey.created_at ? new Date(passkey.created_at).toLocaleDateString() : '—'}
                            {passkey.last_used_at
                              ? ` · Last used ${new Date(passkey.last_used_at).toLocaleDateString()}`
                              : ''}
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          loading={deletingPasskeyId === passkey.id}
                          onClick={() => handleDeletePasskey(passkey.id)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 14, marginTop: 12 }}>
                      No passkeys are registered yet.
                    </p>
                  )}
                </div>
              </Card>
              </>
            )}

            {activeSection === 'devices' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="laptop" style={{ color: THEME.accent }} />
                  Connected Devices
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Review and manage devices with access to your account. Revoke access for any device you do not recognize.
                </p>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  <ul className="device-list">
                    {devices.map((d) => (
                      <li key={d.id}>
                        <Icon name={/Android/i.test(d.device_platform || d.user_agent || '') ? 'smartphone' : 'laptop'} />
                        <div className="profile-row-copy">
                          <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>
                            {d.device_model || (d.device_platform ? `${d.device_platform} ${t('profile.device')}` : t('profile.unknownDevice'))}
                          </div>
                          <div style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 12, marginTop: 3 }}>
                            {d.device_platform || t('profile.unknownPlatform')}{d.device_os_version ? ` ${d.device_os_version}` : ''}{d.device_browser ? ` · ${d.device_browser}${d.device_browser_version ? ` ${d.device_browser_version}` : ''}` : ''}
                          </div>
                          <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 11, marginTop: 3, overflowWrap: 'anywhere' }}>
                            Device ID: {d.device_id || `Session ${d.id}`} · {d.ip_address || 'Unknown IP'} · Signed in {new Date(d.created_at).toLocaleDateString()}
                          </div>
                        </div>
                        <Button variant="outline" size="sm" loading={revokingDeviceId === d.id} onClick={() => handleRevokeDevice(d.id)}>
                          Revoke
                        </Button>
                      </li>
                    ))}
                    {devices.length === 0 && !sectionError && (
                      <li style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 14, padding: 16 }}>
                        No active sessions found.
                      </li>
                    )}
                  </ul>
                )}
              </Card>
            )}

            {activeSection === 'preferences' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 className="profile-preferences-title">
                  <Icon name="sliders" style={{ color: 'var(--secondary)' }} />
                  {t('profile.preferencesTheme')}
                </h3>
                <p className="profile-preferences-description">
                  {t('profile.preferencesDescription')}
                </p>

                <div className="form-group">
                  <label>{t('profile.appearance')}</label>
                  <div className="theme-swatch-group">
                    {[
                      { key: 'light', label: t('profile.light') },
                      { key: 'dark', label: t('profile.dark') }
                    ].map((option) => (
                      <button
                        type="button"
                        key={option.key}
                        className={`theme-swatch-option${theme === option.key ? ' active' : ''}`}
                        onClick={() => { if (theme !== option.key) toggleTheme(); }}
                        aria-pressed={theme === option.key}
                      >
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('profile.language')}</label>
                  <select
                    className="form-select"
                    value={locale}
                    onChange={(e) => setLocale(e.target.value).catch((error) => {
                      logProfileError('setLocale failed', error);
                      addToast('Language could not be saved. Please try again.', 'error');
                    })}
                    aria-label={t('profile.language')}
                  >
                    {SUPPORTED_LOCALES.map((option) => (
                      <option key={option.code} value={option.code}>{option.nativeLabel}</option>
                    ))}
                  </select>
                  <p className="profile-text-muted">{t('profile.languageDescription')}</p>
                </div>

                <div className="form-group">
                  <label>Timezone</label>
                  <select
                    className="form-select"
                    value={bundle?.profile?.timezone || user?.profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'}
                    onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                    aria-label={t('profile.timezonePreference')}
                  >
                    {[
                      ['Africa/Kampala', 'East Africa Time (Kampala)'],
                      ['Africa/Nairobi', 'East Africa Time (Nairobi)'],
                      ['Africa/Dar_es_Salaam', 'East Africa Time (Dar es Salaam)'],
                      ['UTC', 'UTC'],
                      ['Europe/London', 'United Kingdom'],
                      ['America/New_York', 'Eastern Time (US)'],
                      ['America/Chicago', 'Central Time (US)'],
                      ['America/Denver', 'Mountain Time (US)'],
                      ['America/Los_Angeles', 'Pacific Time (US)']
                    ].map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </div>

                <hr className="divider profile-divider-lg" />

                <h4 className="profile-preferences-subtitle">{t('profile.displayReading')}</h4>
                <div className="profile-preference-grid">
                  <label className="profile-preference-control">
                    <span>{t('profile.fontFamily')}</span>
                    <select
                      value={uiPreferences.font_family}
                      disabled={savingUIPreference === 'font_family'}
                      onChange={(e) => handleUIPreferenceChange('font_family', e.target.value)}
                    >
                      <option value="maven">Maven Pro</option>
                      <option value="system">System Sans</option>
                      <option value="serif">Serif</option>
                      <option value="mono">Monospace</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.textSize')}</span>
                    <select
                      value={uiPreferences.font_size}
                      disabled={savingUIPreference === 'font_size'}
                      onChange={(e) => handleUIPreferenceChange('font_size', e.target.value)}
                    >
                      <option value="90">{t('profile.smaller')}</option>
                      <option value="100">Default</option>
                      <option value="110">Large</option>
                      <option value="120">{t('profile.extraLarge')}</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.contentWidth')}</span>
                    <select
                      value={uiPreferences.content_width}
                      disabled={savingUIPreference === 'content_width'}
                      onChange={(e) => handleUIPreferenceChange('content_width', e.target.value)}
                    >
                      <option value="readable">{t('profile.readable')}</option>
                      <option value="wide">{t('profile.wide')}</option>
                      <option value="full">{t('profile.full')}</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.sectionSpacing')}</span>
                    <select
                      value={uiPreferences.section_spacing}
                      disabled={savingUIPreference === 'section_spacing'}
                      onChange={(e) => handleUIPreferenceChange('section_spacing', e.target.value)}
                    >
                      <option value="compact">{t('profile.compact')}</option>
                      <option value="comfortable">{t('profile.comfortable')}</option>
                      <option value="spacious">{t('profile.spacious')}</option>
                    </select>
                  </label>
                </div>

                <h4 className="profile-preferences-subtitle">{t('profile.layoutControls')}</h4>
                <div className="profile-preference-grid">
                  <label className="profile-preference-control">
                    <span>{t('profile.contentDensity')}</span>
                    <select
                      value={uiPreferences.density}
                      disabled={savingUIPreference === 'density'}
                      onChange={(e) => handleUIPreferenceChange('density', e.target.value)}
                    >
                      <option value="compact">{t('profile.compact')}</option>
                      <option value="comfortable">{t('profile.comfortable')}</option>
                      <option value="spacious">{t('profile.spacious')}</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.cardsSurfaces')}</span>
                    <select
                      value={uiPreferences.surface_style}
                      disabled={savingUIPreference === 'surface_style'}
                      onChange={(e) => handleUIPreferenceChange('surface_style', e.target.value)}
                    >
                      <option value="card">{t('profile.cardSurfaces')}</option>
                      <option value="flat">{t('profile.flatSurfaces')}</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.buttonSize')}</span>
                    <select
                      value={uiPreferences.button_size}
                      disabled={savingUIPreference === 'button_size'}
                      onChange={(e) => handleUIPreferenceChange('button_size', e.target.value)}
                    >
                      <option value="small">{t('profile.small')}</option>
                      <option value="medium">{t('profile.default')}</option>
                      <option value="large">{t('profile.large')}</option>
                    </select>
                  </label>

                  <label className="profile-preference-control">
                    <span>{t('profile.buttonWidth')}</span>
                    <select
                      value={uiPreferences.button_width}
                      disabled={savingUIPreference === 'button_width'}
                      onChange={(e) => handleUIPreferenceChange('button_width', e.target.value)}
                    >
                      <option value="auto">{t('profile.fitText')}</option>
                      <option value="full">{t('profile.fullWidth')}</option>
                    </select>
                  </label>
                </div>

                <hr className="divider profile-divider-lg" style={{ borderColor: THEME.border }} />

                <h4 className="profile-preferences-subtitle">{t('profile.accentColor')}</h4>
                <div className="theme-swatch-group">
                  {[
                    { key: 'blue', color: 'var(--blue-600)' },
                    { key: 'teal', color: 'var(--teal-600)' },
                    { key: 'emerald', color: 'var(--emerald-600)' },
                    { key: 'amber', color: 'var(--amber-600)' },
                    { key: 'grey', color: 'var(--grey-700)' }
                  ].map((option) => (
                    <button
                      type="button"
                      key={option.key}
                      className={`theme-swatch-option${bundle?.profile?.theme_color === option.key ? ' active' : ''}`}
                      onClick={() => handleThemeChange(option.key)}
                      aria-pressed={bundle?.profile?.theme_color === option.key}
                    >
                      <span className="theme-swatch" style={{ background: option.color }} />
                      <span>{option.key}</span>
                    </button>
                  ))}
                </div>

                <hr className="divider profile-divider-lg" />

                <h4 className="profile-preferences-subtitle">{t('profile.accessibility')}</h4>
                {[
                  ['large_text', t('profile.largeTextMode')],
                  ['high_contrast', t('profile.highContrastMode')],
                  ['reduce_motion', t('profile.reduceMotion')],
                  ['dyslexia_font', t('profile.dyslexiaFont')]
                ].map(([key, label]) => {
                  const current = !!bundle?.profile?.accessibility?.[key];
                  return (
                    <div className="notification-row" key={key}>
                      <div className="profile-row-copy">{label}</div>
                      <Toggle active={current} label={label} onClick={() => handleAccessibilityToggle(key, current)} />
                    </div>
                  );
                })}
              </Card>
            )}

            {activeSection === 'referral' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="gift" style={{ color: 'var(--accent)' }} />
                  {t('profile.referralProgram')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Share your referral code with colleagues and peers to earn experience points when they join. Every new member
                  contributes to the growth of our community.
                </p>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : referral ? (
                  <>
                    <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15 }}>
                      Your Referral Code: <strong style={{ color: THEME.accent }}>{referral.referral_code}</strong>
                    </p>

                    <Button
                      variant="outline"
                      icon="copy"
                      style={{ marginTop: 12 }}
                      onClick={() => {
                        navigator.clipboard.writeText(referral.referral_code);
                        addToast(t('profile.referralCopied'), 'success');
                      }}
                    >
                      Copy Referral Code
                    </Button>

                    <p style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 13, marginTop: 8 }}>
                      {referral.referral_count} friends joined · {referral.total_xp_earned} XP earned
                    </p>
                  </>
                ) : (
                  !sectionError && (
                    <p style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 14 }}>
                      No referral data is currently available.
                    </p>
                  )
                )}
              </Card>
            )}

            {activeSection === 'parent' && (
              <form onSubmit={handleSaveGuardian}>
                <Card variant="inset" className="profile-card card-lifted">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                    <Icon name="user-group" style={{ color: THEME.accent }} />
                    {t('profile.parentGuardianInformation')}
                  </h3>
                  <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                    Provide contact information for a parent or guardian. This information is used for emergency contact
                    purposes and consent verification.
                  </p>

                  <Input label={t('profile.guardianName')} value={guardianName} onChange={(e) => setGuardianName(e.target.value)} required disabled={savingGuardian} />
                  <Input
                    label={t('profile.guardianEmail')}
                    type="email"
                    value={guardianEmail}
                    onChange={(e) => setGuardianEmail(e.target.value)}
                    required
                    disabled={savingGuardian}
                  />

                  <div className="form-group">
                    <label style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14 }}>{t('profile.relationship')}</label>
                    <select
                      className="form-select"
                      style={{ color: THEME.textMain, fontFamily: THEME.font, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}
                      value={guardianRelationship}
                      onChange={(e) => setGuardianRelationship(e.target.value)}
                    >
                      <option value="Parent">{t('profile.parent')}</option>
                      <option value="Guardian">{t('profile.guardian')}</option>
                      <option value="Other">{t('profile.other')}</option>
                    </select>
                  </div>

                  <Button type="submit" loading={savingGuardian} status={saveStatus.guardian} loadingContext="brand" variant="outline" icon="check">
                    {t('profile.saveGuardianInfo')}
                  </Button>
                </Card>
              </form>
            )}

            {activeSection === 'billing' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="credit-card" style={{ color: THEME.success }} />
                  {t('profile.billingPayments')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  Review your current subscription plan and explore available upgrade options.
                </p>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  <>
                    <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15 }}>
                      <strong style={{ color: THEME.textMain }}>{t('profile.currentPlan')}:</strong> {billing?.current_plan?.name || 'Free'}{' '}
                      {billing?.subscription?.expires_at ? `— expires ${new Date(billing.subscription.expires_at).toLocaleDateString()}` : ''}
                    </p>

                    <div className="profile-plan-list">
                      <h4 style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 16, fontWeight: 600 }}>{t('profile.availablePlans')}</h4>
                      {(billing?.available_plans || []).map((plan) => (
                        <div key={plan.id} className="chart-bar-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ color: THEME.textMain, fontFamily: THEME.font }}>{plan.name}</span>
                          <span style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15 }}>
                            {plan.currency} {plan.price_amount} / {plan.duration_days} days
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            )}

            {activeSection === 'certificates' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="award" style={{ color: 'var(--accent)' }} />
                  {t('profile.certificatesEarned')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  {t('profile.certificatesDescription')}
                </p>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  <div className="table-wrapper">
                    <table className="data-table" style={{ color: THEME.textMain, fontFamily: THEME.font }}>
                      <thead>
                        <tr style={{ color: THEME.textMain }}>
                          <th>{t('profile.certificate')}</th>
                          <th>{t('profile.dateEarned')}</th>
                          <th>{t('profile.score')}</th>
                          <th>{t('profile.verify')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {certificates.map((certificate) => (
                          <tr key={certificate.id} style={{ color: THEME.textMain }}>
                            <td>{certificate.title}</td>
                            <td>{new Date(certificate.issued_at).toLocaleDateString()}</td>
                            <td>{certificate.score != null ? `${certificate.score}%` : '—'}</td>
                            <td>
                              <code style={{ color: THEME.textMain, fontFamily: THEME.font }}>{certificate.verification_code}</code>
                            </td>
                          </tr>
                        ))}
                        {certificates.length === 0 && !sectionError && (
                          <tr>
                            <td colSpan={4} style={{ color: THEME.textMuted, textAlign: 'center' }}>
                              {t('profile.noCertificates')}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>                  </div>
                )}
              </Card>
            )}

            {activeSection === 'api' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="terminal" style={{ color: THEME.accent }} />
                  {t('profile.apiAccess')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  {t('profile.apiDescription')}
                </p>

                {revealedKey && (
                  <div className="notification-row" style={{ border: '1px solid var(--warning)', borderRadius: 8, padding: 16 }}>
                    <div>
                      <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>
                        {t('profile.copyKeyWarning')}
                      </div>
                      <code style={{ color: THEME.textMain, fontFamily: THEME.font, display: 'block', marginTop: 8, fontSize: 12 }}>
                        {revealedKey}
                      </code>
                    </div>
                  </div>
                )}

                <Button loading={creatingKey} loadingContext="brand" variant="outline" icon="plus" onClick={handleCreateApiKey} style={{ marginTop: 12 }}>
                  {t('profile.generateNewKey')}
                </Button>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  apiKeys.map((key) => (
                    <div className="notification-row" key={key.id}>
                      <div className="profile-row-copy">
                        <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>{key.name}</div>
                        <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>
                          <code style={{ color: THEME.textMuted }}>{key.key_prefix}…</code> · {key.is_active ? t('profile.active') : t('profile.revoked')}
                        </div>
                      </div>
                      {key.is_active && (
                        <Button variant="outline" size="sm" loading={revokingKeyId === key.id} onClick={() => handleRevokeApiKey(key.id)}>
                          Revoke
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </Card>
            )}

            {activeSection === 'webhooks' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="webhook" style={{ color: 'var(--secondary)' }} />
                  {t('profile.webhooks')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  {t('profile.webhooksDescription')}
                </p>

                <div className="profile-webhook-input-row">
                  <Input
                    value={newWebhookUrl}
                    onChange={(e) => setNewWebhookUrl(e.target.value)}
                    placeholder="https://example.com/webhook"
                    className="profile-webhook-input"
                  />
                  <Button loading={creatingWebhook} loadingContext="brand" variant="outline" icon="plus" onClick={handleCreateWebhook}>
                    {t('profile.addWebhook')}
                  </Button>
                </div>

                {sectionLoading ? (
                  <Spinner context="data" size="sm" />
                ) : (
                  webhooks.map((webhook) => (
                    <div className="notification-row" key={webhook.id}>
                      <div className="profile-row-copy">
                        <div style={{ color: THEME.textMain, fontFamily: THEME.font, fontSize: 14, fontWeight: 600 }}>{webhook.url}</div>
                        <div style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 12 }}>
                          {(webhook.events || []).join(', ')} · {webhook.is_active ? t('profile.active') : t('profile.disabled')}
                        </div>
                      </div>
                      <Button variant="outline" size="sm" loading={deletingWebhookId === webhook.id} onClick={() => handleDeleteWebhook(webhook.id)}>
                        {t('profile.delete')}
                      </Button>
                    </div>
                  ))
                )}
              </Card>
            )}

            {activeSection === 'account' && (
              <Card variant="inset" className="profile-card card-lifted">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, color: THEME.textMain, fontFamily: THEME.font, fontSize: 18, fontWeight: 600 }}>
                  <Icon name="shield" style={{ color: THEME.error }} />
                  {t('profile.accountData')}
                </h3>
                <p style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15, marginBottom: 16 }}>
                  {t('profile.accountDescription')}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span
                    className="status-indicator-dot"
                    style={{ background: profileMeta?.is_active === false ? THEME.error : THEME.success }}
                  />
                  <span style={{ color: THEME.textSecondary, fontFamily: THEME.font, fontSize: 15 }}>
                    {profileMeta?.is_active === false ? t('profile.inactiveAccount') : t('profile.activeAccount')}
                  </span>
                </div>

                <hr className="divider profile-divider" style={{ borderColor: THEME.border }} />

                <p style={{ color: THEME.textMuted, fontFamily: THEME.font, fontSize: 14 }}>
                  {t('profile.accountCreated', { date: profileMeta?.created_at ? new Date(profileMeta.created_at).toLocaleDateString() : '—' })}
                </p>

                <div className="profile-flex-wrap">
                  <Button variant="outline" icon="download" loading={exportLoading} loadingContext="brand" loadingLabel={t('profile.preparing')} onClick={handleDataExport}>
                    {t('profile.exportAllData')}
                  </Button>
                  <Button variant="danger" icon="trash" loading={deletionLoading} loadingContext="default" loadingLabel={t('profile.requesting')} onClick={handleAccountDeletion}>
                    {t('profile.requestAccountDeletion')}
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div style={{ textAlign: 'right', marginTop: 32, marginBottom: 8, fontFamily: THEME.font, fontStyle: 'italic', color: THEME.textMuted, fontSize: 14 }}>
          — Ali
        </div>
      </Container>
    </div>
  );
}