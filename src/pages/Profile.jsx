import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
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
  requestAccountDeletion
} from '../api/client';

import PageHeader from '../components/PageHeader/PageHeader';
import Container from '../components/Container/Container';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import ProfilePictureUpload from '../components/ProfilePictureUpload/ProfilePictureUpload';
import Spinner from '../components/Spinner/Spinner';
import Skeleton from '../components/Skeleton/Skeleton';
import Card from '../components/Card/Card';
import Icon from '../components/Icon/Icon';
import { useToast } from '../components/Toast/Toast';

const SECTIONS = [
  { id: 'overview', label: 'Profile Overview' },
  { id: 'curriculum', label: 'Learning Curriculum' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'security', label: 'Security & Login' },
  { id: 'devices', label: 'Connected Devices' },
  { id: 'preferences', label: 'Preferences & Theme' },
  { id: 'referral', label: 'Referral Program' },
  { id: 'parent', label: 'Parent / Guardian' },
  { id: 'billing', label: 'Billing & Payments' },
  { id: 'certificates', label: 'Certificates' },
  { id: 'api', label: 'API Access' },
  { id: 'webhooks', label: 'Webhooks' },
  { id: 'account', label: 'Account & Data' }
];

function Toggle({ active, onClick }) {
  return (
    <button
      type="button"
      className={`toggle-switch${active ? ' active' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    />
  );
}

function getExactErrorMessage(error, fallback = 'An unexpected error occurred.') {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error.trim();
  }

  if (typeof error.error?.message === 'string' && error.error.message.trim()) {
    return error.error.message.trim();
  }

  if (typeof error.details === 'string' && error.details.trim()) {
    return error.details.trim();
  }

  if (typeof error.hint === 'string' && error.hint.trim()) {
    return error.hint.trim();
  }

  if (typeof error.data?.message === 'string' && error.data.message.trim()) {
    return error.data.message.trim();
  }

  if (typeof error.data?.error === 'string' && error.data.error.trim()) {
    return error.data.error.trim();
  }

  try {
    const serialized = JSON.stringify(error);

    if (serialized && serialized !== '{}') {
      return serialized;
    }
  } catch {
    return fallback;
  }

  return fallback;
}

function logProfileError(context, error) {
  console.error(`[PROFILE] ${context}`, error);
}

function ProfileError({
  error,
  title = 'Unable to load this section',
  onRetry
}) {
  if (!error) {
    return null;
  }

  return (
    <div
      className="profile-error"
      role="alert"
      aria-live="assertive"
    >
      <div className="profile-error-icon">
        <Icon name="alert-circle" />
      </div>

      <div className="profile-error-body">
        <h4 className="profile-error-title">
          {title}
        </h4>

        <p className="profile-error-message">
          {error}
        </p>

        {onRetry && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRetry}
          >
            Try Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default function Profile() {
  const { user, refresh } = useAuth();
  const addToast = useToast();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingBio, setSavingBio] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

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
    if (user?.full_name) {
      setFullName(user.full_name);
    }

    if (user?.profile?.display_name) {
      setDisplayName(user.profile.display_name);
    }
  }, [user]);

  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError('');

    try {
      const data = await getProfile();

      if (!data || typeof data !== 'object') {
        throw new Error(
          `Profile request succeeded but returned invalid data: ${JSON.stringify(data)}`
        );
      }

      setProfileMeta(data);
      setBio(data?.bio || '');

      console.info('[PROFILE] Profile loaded successfully', data);
    } catch (error) {
      const message = getExactErrorMessage(
        error,
        'Failed to load your profile.'
      );

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
        throw new Error(
          `Settings bundle request succeeded but returned invalid data: ${JSON.stringify(data)}`
        );
      }

      setBundle(data);

      console.info(
        '[PROFILE] Settings bundle loaded successfully',
        data
      );
    } catch (error) {
      const message = getExactErrorMessage(
        error,
        'Failed to load profile settings.'
      );

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
        throw new Error(
          `Curriculum levels request returned invalid data: ${JSON.stringify(data)}`
        );
      }

      setAvailableLevels(data);

      console.info(
        '[PROFILE] Curriculum levels loaded successfully',
        data
      );
    } catch (error) {
      const message = getExactErrorMessage(
        error,
        'Failed to load curriculum levels.'
      );

      logProfileError('getCurriculumLevels failed', error);
      setCurriculumError(message);

      addToast(message, 'error');
    } finally {
      setAvailableLevelsLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    if (
      !profileMeta ||
      profileMeta.role === 'teacher' ||
      availableLevels.length ||
      availableLevelsLoading
    ) {
      return;
    }

    loadCurriculumLevels();
  }, [
    profileMeta,
    availableLevels.length,
    availableLevelsLoading,
    loadCurriculumLevels
  ]);

  const loadSection = useCallback(
    async (id) => {
      setSectionLoading(true);
      setSectionError('');

      try {
        let data;

        if (id === 'notifications') {
          data = await getProfileNotificationPreferences();

          if (!Array.isArray(data)) {
            throw new Error(
              `Notifications request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setNotifPrefs(data);
        } else if (id === 'devices') {
          data = await getDevices();

          if (!Array.isArray(data)) {
            throw new Error(
              `Devices request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setDevices(data);
        } else if (id === 'billing') {
          data = await getBillingSummary();

          if (!data || typeof data !== 'object') {
            throw new Error(
              `Billing request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setBilling(data);
        } else if (id === 'referral') {
          data = await getReferralStats();

          if (!data || typeof data !== 'object') {
            throw new Error(
              `Referral request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setReferral(data);
        } else if (id === 'certificates') {
          data = await getCertificates();

          if (!Array.isArray(data)) {
            throw new Error(
              `Certificates request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setCertificates(data);
        } else if (id === 'api') {
          data = await getApiKeys();

          if (!Array.isArray(data)) {
            throw new Error(
              `API keys request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setApiKeys(data);
        } else if (id === 'webhooks') {
          data = await getWebhooks();

          if (!Array.isArray(data)) {
            throw new Error(
              `Webhooks request returned invalid data: ${JSON.stringify(data)}`
            );
          }

          setWebhooks(data);
        }

        console.info(
          `[PROFILE] Section "${id}" loaded successfully`,
          data
        );
      } catch (error) {
        const message = getExactErrorMessage(
          error,
          `Failed to load the ${id} section.`
        );

        logProfileError(
          `loadSection("${id}") failed`,
          error
        );

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
      if (event.key === 'Escape') {
        setSidebarOpen(false);
      }
    };

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [sidebarOpen]);

  const selectSection = (id) => {
    setActiveSection(id);
    setSidebarOpen(false);
    setSectionError('');
  };

  const levelChangeOptions = useMemo(
    () =>
      availableLevels.filter(
        (lvl) => lvl.display_name !== profileMeta?.track
      ),
    [availableLevels, profileMeta]
  );

  const passwordStrength = useMemo(() => {
    if (!newPassword) {
      return { score: 0, label: '', color: '' };
    }

    let score = 0;

    if (newPassword.length >= 10) score++;
    if (newPassword.length >= 14) score++;
    if (/[A-Z]/.test(newPassword) && /[a-z]/.test(newPassword)) score++;
    if (/[0-9]/.test(newPassword)) score++;
    if (/[^A-Za-z0-9]/.test(newPassword)) score++;

    if (score <= 2) {
      return { score: 1, label: 'Weak', color: 'var(--error)' };
    }

    if (score <= 3) {
      return { score: 2, label: 'Fair', color: 'var(--warning)' };
    }

    return { score: 3, label: 'Strong', color: 'var(--success)' };
  }, [newPassword]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    const trimmed = fullName.trim();
    const trimmedDisplayName = displayName.trim();

    if (trimmed.length < 2 || trimmed.length > 100) {
      addToast('Name must be between 2 and 100 characters', 'error');
      return;
    }

    setSavingProfile(true);

    try {
      await updateProfile(trimmed);

      if (trimmedDisplayName && trimmedDisplayName.length >= 2) {
        await updateDisplayName(trimmedDisplayName);
      }

      await refresh();

      addToast('Profile updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to update profile'
      );

      logProfileError('handleProfileSubmit failed', err);
      addToast(message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBioSubmit = async (e) => {
    e.preventDefault();
    setSavingBio(true);

    try {
      await updateBio(bio.trim());
      addToast('Bio updated', 'success');
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to update bio'
      );

      logProfileError('handleBioSubmit failed', err);
      addToast(message, 'error');
    } finally {
      setSavingBio(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      addToast('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 10) {
      addToast(
        'Password must be at least 10 characters',
        'error'
      );
      return;
    }

    setSavingPassword(true);

    try {
      await changePassword(currentPassword, newPassword);

      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      addToast('Password changed', 'success');
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to change password'
      );

      logProfileError('handlePasswordSubmit failed', err);
      addToast(message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleLevelChangeRequest = async (e) => {
    e.preventDefault();

    if (!levelReqTrack || !levelReqReason.trim()) {
      addToast('Please complete all fields', 'error');
      return;
    }

    setLevelReqLoading(true);

    try {
      await requestLevelChange(
        levelReqTrack,
        null,
        levelReqReason
      );

      setLevelReqTrack('');
      setLevelReqReason('');

      addToast(
        'Level change request submitted',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to submit request'
      );

      logProfileError(
        'handleLevelChangeRequest failed',
        err
      );

      addToast(message, 'error');
    } finally {
      setLevelReqLoading(false);
    }
  };

  const handleThemeChange = async (color) => {
    try {
      const updated = await updatePreferences({
        theme_color: color
      });

      setBundle((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                ...updated.profile
              }
            }
          : prev
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to update theme'
      );

      logProfileError('handleThemeChange failed', err);
      addToast(message, 'error');
    }
  };

  const handleAccessibilityToggle = async (
    key,
    currentValue
  ) => {
    const accessibility = {
      ...(bundle?.profile?.accessibility || {}),
      [key]: !currentValue
    };

    try {
      const updated = await updatePreferences({
        accessibility
      });

      setBundle((prev) =>
        prev
          ? {
              ...prev,
              profile: {
                ...prev.profile,
                ...updated.profile
              }
            }
          : prev
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to update accessibility setting'
      );

      logProfileError(
        'handleAccessibilityToggle failed',
        err
      );

      addToast(message, 'error');
    }
  };

  const handleNotifToggle = async (
    module,
    field,
    current
  ) => {
    setNotifPrefs((prev) =>
      prev.map((p) =>
        p.module === module
          ? { ...p, [field]: !current }
          : p
      )
    );

    try {
      await updateProfileNotificationPreference(
        module,
        {
          [field]: !current
        }
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to update notification setting'
      );

      logProfileError(
        'handleNotifToggle failed',
        err
      );

      addToast(message, 'error');
      loadSection('notifications');
    }
  };

  const handleRevokeDevice = async (sessionId) => {
    try {
      await revokeDevice(sessionId);

      setDevices((prev) =>
        prev.filter((d) => d.id !== sessionId)
      );

      addToast('Device signed out', 'success');
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to revoke device'
      );

      logProfileError(
        'handleRevokeDevice failed',
        err
      );

      addToast(message, 'error');
    }
  };

  const handleCreateApiKey = async () => {
    setCreatingKey(true);

    try {
      const result = await createApiKey(
        'Default Key'
      );

      if (!result?.raw_key) {
        throw new Error(
          `API key was created but no raw_key was returned: ${JSON.stringify(
            result
          )}`
        );
      }

      setRevealedKey(result.raw_key);
      loadSection('api');
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to create key'
      );

      logProfileError(
        'handleCreateApiKey failed',
        err
      );

      addToast(message, 'error');
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeApiKey = async (keyId) => {
    try {
      await revokeApiKey(keyId);

      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === keyId
            ? { ...k, is_active: false }
            : k
        )
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to revoke key'
      );

      logProfileError(
        'handleRevokeApiKey failed',
        err
      );

      addToast(message, 'error');
    }
  };

  const handleCreateWebhook = async () => {
    if (!/^https:\/\//.test(newWebhookUrl)) {
      addToast(
        'Enter a valid https:// URL',
        'error'
      );
      return;
    }

    setCreatingWebhook(true);

    try {
      await createWebhook(
        newWebhookUrl,
        ['*']
      );

      setNewWebhookUrl('');
      loadSection('webhooks');

      addToast(
        'Webhook created',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to create webhook'
      );

      logProfileError(
        'handleCreateWebhook failed',
        err
      );

      addToast(message, 'error');
    } finally {
      setCreatingWebhook(false);
    }
  };

  const handleDeleteWebhook = async (id) => {
    try {
      await deleteWebhook(id);

      setWebhooks((prev) =>
        prev.filter((w) => w.id !== id)
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to delete webhook'
      );

      logProfileError(
        'handleDeleteWebhook failed',
        err
      );

      addToast(message, 'error');
    }
  };

  const handleSaveGuardian = async (e) => {
    e.preventDefault();

    if (
      !guardianName.trim() ||
      !guardianEmail.trim()
    ) {
      addToast(
        'Guardian name and email are required',
        'error'
      );
      return;
    }

    setSavingGuardian(true);

    try {
      await saveParentGuardian({
        guardian_name: guardianName.trim(),
        guardian_email: guardianEmail.trim(),
        guardian_relationship:
          guardianRelationship
      });

      addToast(
        'Guardian information saved',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to save guardian information'
      );

      logProfileError(
        'handleSaveGuardian failed',
        err
      );

      addToast(message, 'error');
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleDataExport = async () => {
    try {
      const result = await requestDataExport();

      addToast(
        result.already_pending
          ? 'Export already in progress'
          : 'Export requested — we will email you a link',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to request export'
      );

      logProfileError(
        'handleDataExport failed',
        err
      );

      addToast(message, 'error');
    }
  };

  const handleAccountDeletion = async () => {
    if (
      !window.confirm(
        'This will schedule your account for deletion. Continue?'
      )
    ) {
      return;
    }

    try {
      const result =
        await requestAccountDeletion();

      addToast(
        result.already_pending
          ? 'Deletion already requested'
          : 'Account deletion requested',
        'success'
      );
    } catch (err) {
      const message = getExactErrorMessage(
        err,
        'Failed to request account deletion'
      );

      logProfileError(
        'handleAccountDeletion failed',
        err
      );

      addToast(message, 'error');
    }
  };

  if (profileLoading) {
    return (
      <Container>
        <PageHeader
          title="Profile & Settings"
          subtitle="Manage your account, curriculum, preferences, security, and more"
        />

        <div className="profile-loading-skeleton">
          <Skeleton
            variant="avatar"
            width={96}
            height={96}
          />
        </div>

        <div className="grid grid-cols-2 profile-skeleton-grid">
          <Card
            variant="inset"
            loading={true}
            loadingLines={4}
          />
          <Card
            variant="inset"
            loading={true}
            loadingLines={4}
          />
        </div>

        {profileError && (
          <ProfileError
            error={profileError}
            title="Profile could not be loaded"
            onRetry={loadProfile}
          />
        )}

        {bundleError && (
          <ProfileError
            error={bundleError}
            title="Settings could not be loaded"
            onRetry={loadBundle}
          />
        )}
      </Container>
    );
  }

  const initial = (
    profileMeta?.display_name ||
    profileMeta?.full_name ||
    user?.email ||
    'S'
  )
    .charAt(0)
    .toUpperCase();

  return (
    <Container>
      <PageHeader
        title="Profile & Settings"
        subtitle="Manage your account, curriculum, preferences, security, and more"
      />

      {profileError && (
        <ProfileError
          error={profileError}
          title="Profile data could not be loaded"
          onRetry={loadProfile}
        />
      )}

      {bundleError && (
        <ProfileError
          error={bundleError}
          title="Settings data could not be loaded"
          onRetry={loadBundle}
        />
      )}

      <div className="profile-toolbar">
        <div className="profile-toolbar-copy">
          <span className="profile-toolbar-label">
            Settings
          </span>

          <span className="profile-toolbar-current">
            {
              SECTIONS.find(
                (section) =>
                  section.id === activeSection
              )?.label
            }
          </span>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="profile-sidebar-toggle"
          onClick={() =>
            setSidebarOpen((open) => !open)
          }
          aria-expanded={sidebarOpen}
          aria-controls="profile-sidebar"
        >
          {sidebarOpen
            ? 'Hide Sections'
            : 'Show Sections'}
        </Button>
      </div>

      <div
        className={`profile-layout${
          sidebarOpen
            ? ' sidebar-open'
            : ''
        }`}
      >
        <button
          type="button"
          className="profile-sidebar-backdrop"
          aria-label="Close profile sections"
          onClick={() => setSidebarOpen(false)}
        />

        <aside
          id="profile-sidebar"
          className="profile-sidebar"
          aria-label="Profile settings sections"
        >
          <div className="profile-sidebar-inner">
            <div className="profile-sidebar-profile">
              <div className="profile-avatar-lg">
                {initial}
              </div>

              <div className="profile-sidebar-details">
                <div className="profile-sidebar-name">
                  {profileMeta?.display_name ||
                    profileMeta?.full_name ||
                    'Student'}
                </div>

                <div className="profile-sidebar-level">
                  {profileMeta?.track ||
                    'No level set'}

                  <span aria-hidden="true">
                    {' · '}
                  </span>

                  {profileMeta?.class_name ||
                    'No class set'}
                </div>
              </div>
            </div>

            <div className="profile-stats-grid">
              <div className="profile-stat-tile">
                <div className="profile-stat-num">
                  {bundle?.active_device_count ??
                    '—'}
                </div>

                <div className="profile-stat-label">
                  Devices
                </div>
              </div>

              <div className="profile-stat-tile">
                <div className="profile-stat-num">
                  {bundle?.referral_count ??
                    '—'}
                </div>

                <div className="profile-stat-label">
                  Referrals
                </div>
              </div>
            </div>

            <nav
              className="profile-nav"
              aria-label="Profile sections"
            >
              <ul className="profile-nav-list">
                {SECTIONS.map((section) => (
                  <li key={section.id}>
                    <button
                      type="button"
                      className={
                        activeSection ===
                        section.id
                          ? 'active'
                          : ''
                      }
                      onClick={() =>
                        selectSection(
                          section.id
                        )
                      }
                      aria-current={
                        activeSection ===
                        section.id
                          ? 'page'
                          : undefined
                      }
                    >
                      {section.label}
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
              title={`Unable to load ${SECTIONS.find(
                (section) =>
                  section.id ===
                  activeSection
              )?.label || 'this section'}`}
              onRetry={() =>
                loadSection(
                  activeSection
                )
              }
            />
          )}

          {activeSection === 'overview' && (
            <>
              <div className="profile-avatar-wrapper">
                <ProfilePictureUpload
                  currentUrl={
                    user?.profile
                      ?.profile_picture_url
                  }
                  onUpdate={() =>
                    refresh()
                  }
                  size={96}
                />
              </div>

              <form
                onSubmit={
                  handleProfileSubmit
                }
              >
                <Card
                  variant="inset"
                  className="profile-card-main"
                >
                  <h3 className="profile-section-title">
                    <Icon
                      name="id-card"
                      className="profile-icon-primary"
                    />
                    Personal Info
                  </h3>

                  <p className="profile-section-subtitle">
                    Update your name and display
                    name. Your display name appears
                    publicly on reviews and comments.
                  </p>

                  <Input
                    label="Full Name"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(
                        e.target.value
                      )
                    }
                    required
                    disabled={
                      savingProfile
                    }
                  />

                  <Input
                    label="Display Name"
                    value={displayName}
                    onChange={(e) =>
                      setDisplayName(
                        e.target.value
                      )
                    }
                    disabled={
                      savingProfile
                    }
                    hint="Shown publicly on reviews and comments"
                  />

                  <Input
                    label="Email"
                    value={
                      profileMeta?.email ||
                      user?.email ||
                      ''
                    }
                    disabled
                  />

                  <Button
                    type="submit"
                    loading={
                      savingProfile
                    }
                    loadingContext="brand"
                    variant="outline"
                    icon="check"
                  >
                    Save Changes
                  </Button>
                </Card>
              </form>

              <form
                onSubmit={handleBioSubmit}
              >
                <Card
                  variant="inset"
                  className="profile-card"
                >
                  <h3 className="profile-section-title">
                    <Icon
                      name="pen"
                      className="profile-icon-secondary"
                    />
                    Bio
                  </h3>

                  <p className="profile-section-subtitle">
                    Tell others a little about
                    yourself — your interests, goals,
                    or what you're studying.
                  </p>

                  <textarea
                    className="form-textarea profile-reading-field"
                    rows={3}
                    maxLength={500}
                    value={bio}
                    onChange={(e) =>
                      setBio(
                        e.target.value
                      )
                    }
                    placeholder="Tell us about yourself..."
                  />

                  <Button
                    type="submit"
                    loading={
                      savingBio
                    }
                    loadingContext="brand"
                    variant="outline"
                    icon="check"
                    className="profile-action-spaced"
                  >
                    Save Bio
                  </Button>
                </Card>
              </form>
            </>
          )}

          {activeSection ===
            'curriculum' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="route"
                  className="profile-icon-warm"
                />
                Learning Curriculum
              </h3>

              <p className="profile-section-subtitle">
                Your current level is{' '}
                <strong>
                  {profileMeta?.track ||
                    'Not set'}
                </strong>
                , class{' '}
                <strong>
                  {profileMeta
                    ?.class_name ||
                    'Not set'}
                </strong>
                . Changing levels requires admin
                approval.
              </p>

              {curriculumError && (
                <ProfileError
                  error={
                    curriculumError
                  }
                  title="Curriculum levels could not be loaded"
                  onRetry={
                    loadCurriculumLevels
                  }
                />
              )}

              {profileMeta?.role !==
                'teacher' && (
                <form
                  onSubmit={
                    handleLevelChangeRequest
                  }
                >
                  <div className="form-group">
                    <label className="form-label">
                      New Level
                    </label>

                    <select
                      className="form-select profile-reading-field"
                      value={
                        levelReqTrack
                      }
                      onChange={(e) =>
                        setLevelReqTrack(
                          e.target.value
                        )
                      }
                      required
                      disabled={
                        availableLevelsLoading
                      }
                    >
                      <option value="">
                        Select Level
                      </option>

                      {levelChangeOptions.map(
                        (lvl) => (
                          <option
                            key={
                              lvl.id ||
                              lvl.key ||
                              lvl.display_name
                            }
                            value={
                              lvl.display_name
                            }
                          >
                            {
                              lvl.display_name
                            }
                          </option>
                        )
                      )}
                    </select>

                    {availableLevelsLoading && (
                      <Spinner
                        context="data"
                        size="sm"
                      />
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Reason
                    </label>

                    <textarea
                      className="form-textarea profile-reading-field"
                      rows={3}
                      value={
                        levelReqReason
                      }
                      onChange={(e) =>
                        setLevelReqReason(
                          e.target.value
                        )
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    loading={
                      levelReqLoading
                    }
                    loadingContext="brand"
                    variant="outline"
                    icon="route"
                  >
                    Submit Request
                  </Button>
                </form>
              )}
            </Card>
          )}

          {activeSection ===
            'notifications' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="bell"
                  className="profile-icon-primary"
                />
                Notifications
              </h3>

              <p className="profile-section-subtitle">
                Choose how you want to receive
                updates — in-app, via email, or push
                notifications.
              </p>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                notifPrefs.map((p) => (
                  <div
                    className="notification-row"
                    key={p.module}
                  >
                    <div className="profile-row-copy">
                      <div className="notif-title">
                        {p.module.replace(
                          /_/g,
                          ' '
                        )}
                      </div>

                      <div className="notif-desc">
                        In-app · Email · Push
                      </div>
                    </div>

                    <div className="profile-toggle-group">
                      <Toggle
                        active={p.in_app}
                        onClick={() =>
                          handleNotifToggle(
                            p.module,
                            'in_app',
                            p.in_app
                          )
                        }
                      />

                      <Toggle
                        active={p.email}
                        onClick={() =>
                          handleNotifToggle(
                            p.module,
                            'email',
                            p.email
                          )
                        }
                      />

                      <Toggle
                        active={p.push}
                        onClick={() =>
                          handleNotifToggle(
                            p.module,
                            'push',
                            p.push
                          )
                        }
                      />
                    </div>
                  </div>
                ))
              )}

              {!sectionLoading &&
                notifPrefs.length ===
                  0 &&
                !sectionError && (
                  <p className="profile-empty-text">
                    No notification modules
                    configured yet.
                  </p>
                )}
            </Card>
          )}

          {activeSection === 'security' && (
            <form
              onSubmit={
                handlePasswordSubmit
              }
            >
              <Card
                variant="inset"
                className="profile-card"
              >
                <h3 className="profile-section-title">
                  <Icon
                    name="key"
                    className="profile-icon-accent"
                  />
                  Security
                </h3>

                <p className="profile-section-subtitle">
                  Change your password regularly to
                  keep your account secure. Use a
                  strong, unique password.
                </p>

                <Input
                  label="Current Password"
                  type="password"
                  value={
                    currentPassword
                  }
                  onChange={(e) =>
                    setCurrentPassword(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    savingPassword
                  }
                />

                <Input
                  label="New Password"
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={(e) =>
                    setNewPassword(
                      e.target.value
                    )
                  }
                  hint="Minimum 10 characters"
                  required
                  disabled={
                    savingPassword
                  }
                />

                {newPassword && (
                  <div className="profile-pw-strength-wrap">
                    <div className="progress-track profile-pw-strength-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${
                            (passwordStrength.score /
                              3) *
                            100
                          }%`,
                          background:
                            passwordStrength.color
                        }}
                      />
                    </div>

                    <span
                      className="profile-pw-strength-label"
                      style={{
                        color:
                          passwordStrength.color
                      }}
                    >
                      {
                        passwordStrength.label
                      }
                    </span>
                  </div>
                )}

                <Input
                  label="Confirm New Password"
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(e) =>
                    setConfirmPassword(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    savingPassword
                  }
                />

                <Button
                  type="submit"
                  loading={
                    savingPassword
                  }
                  loadingContext="conic"
                  variant="outline"
                  icon="lock"
                >
                  Update Password
                </Button>
              </Card>
            </form>
          )}

          {activeSection ===
            'devices' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="laptop"
                  className="profile-icon-primary"
                />
                Connected Devices
              </h3>

              <p className="profile-section-subtitle">
                View and manage devices that have
                access to your account. Revoke any
                device you don't recognise.
              </p>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                <ul className="device-list">
                  {devices.map((d) => (
                    <li key={d.id}>
                      <Icon name="laptop" />

                      <div className="profile-row-copy">
                        <div className="device-name">
                          {d.user_agent ||
                            'Unknown device'}
                        </div>

                        <div className="device-meta">
                          {d.ip_address ||
                            'Unknown IP'}{' '}
                          · Signed in{' '}
                          {new Date(
                            d.created_at
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRevokeDevice(
                            d.id
                          )
                        }
                      >
                        Revoke
                      </Button>
                    </li>
                  ))}

                  {devices.length ===
                    0 &&
                    !sectionError && (
                      <li className="profile-empty-list">
                        No active sessions
                        found.
                      </li>
                    )}
                </ul>
              )}
            </Card>
          )}

          {activeSection ===
            'preferences' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="sliders"
                  className="profile-icon-secondary"
                />
                Preferences & Theme
              </h3>

              <p className="profile-section-subtitle">
                Customise your experience by choosing
                an accent colour and adjusting
                accessibility settings.
              </p>

              <div className="form-group">
                <label className="form-label">
                  Accent Color
                </label>

                <div className="theme-swatch-group">
                  {[
                    {
                      key: 'blue',
                      color:
                        'var(--blue-600)'
                    },
                    {
                      key: 'teal',
                      color:
                        'var(--teal-600)'
                    },
                    {
                      key: 'emerald',
                      color:
                        'var(--emerald-600)'
                    },
                    {
                      key: 'amber',
                      color:
                        'var(--amber-600)'
                    },
                    {
                      key: 'grey',
                      color:
                        'var(--grey-700)'
                    }
                  ].map(
                    (themeOption) => (
                      <button
                        type="button"
                        key={
                          themeOption.key
                        }
                        className={`theme-swatch-option${
                          bundle?.profile
                            ?.theme_color ===
                          themeOption.key
                            ? ' active'
                            : ''
                        }`}
                        onClick={() =>
                          handleThemeChange(
                            themeOption.key
                          )
                        }
                        style={{
                          '--swatch-color':
                            themeOption.color
                        }}
                        aria-pressed={
                          bundle?.profile
                            ?.theme_color ===
                          themeOption.key
                        }
                      >
                        <span className="theme-swatch" />

                        <span>
                          {
                            themeOption.key
                          }
                        </span>
                      </button>
                    )
                  )}
                </div>
              </div>

              <hr className="divider profile-divider-lg" />

              <h4 className="profile-subheading">
                Accessibility
              </h4>

              {[
                [
                  'large_text',
                  'Large text mode'
                ],
                [
                  'high_contrast',
                  'High contrast mode'
                ],
                [
                  'reduce_motion',
                  'Reduce motion'
                ],
                [
                  'dyslexia_font',
                  'Dyslexia-friendly font'
                ]
              ].map(
                ([key, label]) => {
                  const current =
                    !!bundle?.profile
                      ?.accessibility?.[
                      key
                    ];

                  return (
                    <div
                      className="notification-row"
                      key={key}
                    >
                      <div className="notif-title profile-row-copy">
                        {label}
                      </div>

                      <Toggle
                        active={
                          current
                        }
                        onClick={() =>
                          handleAccessibilityToggle(
                            key,
                            current
                          )
                        }
                      />
                    </div>
                  );
                }
              )}
            </Card>
          )}

          {activeSection ===
            'referral' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="gift"
                  className="profile-icon-warm"
                />
                Referral Program
              </h3>

              <p className="profile-section-subtitle">
                Share your referral code with friends
                and earn XP when they join. Every new
                member helps grow the community.
              </p>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : referral ? (
                <>
                  <p className="profile-reading-text">
                    Your Referral Code:{' '}
                    <strong className="profile-accent-text">
                      {
                        referral.referral_code
                      }
                    </strong>
                  </p>

                  <Button
                    variant="outline"
                    icon="copy"
                    className="profile-action-spaced"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        referral.referral_code
                      );

                      addToast(
                        'Referral code copied',
                        'success'
                      );
                    }}
                  >
                    Copy Referral Code
                  </Button>

                  <p className="profile-text-muted profile-action-description">
                    {
                      referral.referral_count
                    }{' '}
                    friends joined ·{' '}
                    {
                      referral.total_xp_earned
                    }{' '}
                    XP earned
                  </p>
                </>
              ) : (
                !sectionError && (
                  <p className="profile-empty-text">
                    No referral data yet.
                  </p>
                )
              )}
            </Card>
          )}

          {activeSection ===
            'parent' && (
            <form
              onSubmit={
                handleSaveGuardian
              }
            >
              <Card
                variant="inset"
                className="profile-card"
              >
                <h3 className="profile-section-title">
                  <Icon
                    name="user-group"
                    className="profile-icon-primary"
                  />
                  Parent / Guardian Information
                </h3>

                <p className="profile-section-subtitle">
                  Provide contact details for a parent
                  or guardian. This information is used
                  for emergency contact and consent.
                </p>

                <Input
                  label="Guardian Name"
                  value={guardianName}
                  onChange={(e) =>
                    setGuardianName(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    savingGuardian
                  }
                />

                <Input
                  label="Guardian Email"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) =>
                    setGuardianEmail(
                      e.target.value
                    )
                  }
                  required
                  disabled={
                    savingGuardian
                  }
                />

                <div className="form-group">
                  <label className="form-label">
                    Relationship
                  </label>

                  <select
                    className="form-select profile-reading-field"
                    value={
                      guardianRelationship
                    }
                    onChange={(e) =>
                      setGuardianRelationship(
                        e.target.value
                      )
                    }
                  >
                    <option>
                      Parent
                    </option>
                    <option>
                      Guardian
                    </option>
                    <option>
                      Other
                    </option>
                  </select>
                </div>

                <Button
                  type="submit"
                  loading={
                    savingGuardian
                  }
                  loadingContext="brand"
                  variant="outline"
                  icon="check"
                >
                  Save Guardian Info
                </Button>
              </Card>
            </form>
          )}

          {activeSection ===
            'billing' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="credit-card"
                  className="profile-icon-success"
                />
                Billing & Payments
              </h3>

              <p className="profile-section-subtitle">
                View your current subscription plan and
                available upgrade options.
              </p>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                <>
                  <p className="profile-reading-text">
                    <strong>
                      Current Plan:
                    </strong>{' '}
                    {billing
                      ?.current_plan
                      ?.name ||
                      'Free'}{' '}
                    {billing?.subscription
                      ?.expires_at
                      ? `— expires ${new Date(
                          billing.subscription.expires_at
                        ).toLocaleDateString()}`
                      : ''}
                  </p>

                  <div className="profile-plan-list">
                    <h4 className="profile-subheading">
                      Available Plans
                    </h4>

                    {(
                      billing?.available_plans ||
                      []
                    ).map((plan) => (
                      <div
                        key={plan.id}
                        className="chart-bar-row profile-align-center"
                      >
                        <span className="chart-bar-label">
                          {plan.name}
                        </span>

                        <span className="profile-reading-text">
                          {
                            plan.currency
                          }{' '}
                          {
                            plan.price_amount
                          }{' '}
                          /{' '}
                          {
                            plan.duration_days
                          }{' '}
                          days
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>
          )}

          {activeSection ===
            'certificates' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="award"
                  className="profile-icon-warm"
                />
                Certificates Earned
              </h3>

              <p className="profile-section-subtitle">
                View and verify certificates you've
                earned for completing courses and
                assessments.
              </p>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>
                          Certificate
                        </th>
                        <th>
                          Date Earned
                        </th>
                        <th>
                          Score
                        </th>
                        <th>
                          Verify
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {certificates.map(
                        (certificate) => (
                          <tr
                            key={
                              certificate.id
                            }
                          >
                            <td>
                              {
                                certificate.title
                              }
                            </td>

                            <td>
                              {new Date(
                                certificate.issued_at
                              ).toLocaleDateString()}
                            </td>

                            <td>
                              {certificate.score !=
                              null
                                ? `${certificate.score}%`
                                : '—'}
                            </td>

                            <td>
                              <code>
                                {
                                  certificate.verification_code
                                }
                              </code>
                            </td>
                          </tr>
                        )
                      )}

                      {certificates.length ===
                        0 &&
                        !sectionError && (
                          <tr>
                            <td
                              colSpan={4}
                              className="profile-empty-table"
                            >
                              No certificates yet.
                            </td>
                          </tr>
                        )}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {activeSection === 'api' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="terminal"
                  className="profile-icon-primary"
                />
                API Access
              </h3>

              <p className="profile-section-subtitle">
                Generate API keys to integrate
                AliverBiopharm with external tools and
                applications.
              </p>

              {revealedKey && (
                <div className="notification-row profile-notification-highlight">
                  <div>
                    <div className="notif-title">
                      Copy this key now — it
                      will not be shown again
                    </div>

                    <code className="profile-api-key">
                      {revealedKey}
                    </code>
                  </div>
                </div>
              )}

              <Button
                loading={
                  creatingKey
                }
                loadingContext="brand"
                variant="outline"
                icon="plus"
                onClick={
                  handleCreateApiKey
                }
                className="profile-action-spaced"
              >
                Generate New Key
              </Button>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                apiKeys.map((key) => (
                  <div
                    className="notification-row"
                    key={key.id}
                  >
                    <div className="profile-row-copy">
                      <div className="notif-title">
                        {key.name}
                      </div>

                      <div className="notif-desc">
                        <code>
                          {
                            key.key_prefix
                          }
                          …
                        </code>{' '}
                        ·{' '}
                        {key.is_active
                          ? 'Active'
                          : 'Revoked'}
                      </div>
                    </div>

                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleRevokeApiKey(
                            key.id
                          )
                        }
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                ))
              )}
            </Card>
          )}

          {activeSection ===
            'webhooks' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="webhook"
                  className="profile-icon-secondary"
                />
                Webhooks
              </h3>

              <p className="profile-section-subtitle">
                Configure webhooks to receive real-time
                event notifications from the platform.
              </p>

              <div className="profile-webhook-input-row">
                <Input
                  value={
                    newWebhookUrl
                  }
                  onChange={(e) =>
                    setNewWebhookUrl(
                      e.target.value
                    )
                  }
                  placeholder="https://example.com/webhook"
                  className="profile-webhook-input"
                />

                <Button
                  loading={
                    creatingWebhook
                  }
                  loadingContext="brand"
                  variant="outline"
                  icon="plus"
                  onClick={
                    handleCreateWebhook
                  }
                >
                  Add Webhook
                </Button>
              </div>

              {sectionLoading ? (
                <Spinner
                  context="data"
                  size="sm"
                />
              ) : (
                webhooks.map(
                  (webhook) => (
                    <div
                      className="notification-row"
                      key={
                        webhook.id
                      }
                    >
                      <div className="profile-row-copy">
                        <div className="notif-title">
                          {
                            webhook.url
                          }
                        </div>

                        <div className="notif-desc">
                          {(
                            webhook.events ||
                            []
                          ).join(
                            ', '
                          )}{' '}
                          ·{' '}
                          {webhook.is_active
                            ? 'Active'
                            : 'Disabled'}
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDeleteWebhook(
                            webhook.id
                          )
                        }
                      >
                        Delete
                      </Button>
                    </div>
                  )
                )
              )}
            </Card>
          )}

          {activeSection ===
            'account' && (
            <Card
              variant="inset"
              className="profile-card"
            >
              <h3 className="profile-section-title">
                <Icon
                  name="shield"
                  className="profile-icon-error"
                />
                Account & Data
              </h3>

              <p className="profile-section-subtitle">
                Manage your account status, export your
                data, or request account deletion.
              </p>

              <div className="profile-flex-center profile-status-row">
                <span
                  className={`status-indicator-dot ${
                    profileMeta?.is_active ===
                    false
                      ? 'status-inactive'
                      : 'status-active'
                  }`}
                />

                <span className="profile-reading-text">
                  {profileMeta?.is_active ===
                  false
                    ? 'Inactive'
                    : 'Active'}{' '}
                  account
                </span>
              </div>

              <hr className="divider profile-divider" />

              <p className="profile-text-muted">
                Account created{' '}
                {profileMeta
                  ?.created_at
                  ? new Date(
                      profileMeta.created_at
                    ).toLocaleDateString()
                  : '—'}
              </p>

              <div className="profile-flex-wrap">
                <Button
                  variant="outline"
                  icon="download"
                  onClick={
                    handleDataExport
                  }
                >
                  Export All Data
                </Button>

                <Button
                  variant="danger"
                  icon="trash"
                  onClick={
                    handleAccountDeletion
                  }
                >
                  Request Account Deletion
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </Container>
  );
}
