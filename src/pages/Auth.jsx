 /* pages/Auth.jsx */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signup, getCurriculumLevels } from '../api/client';
import Input from '../components/Input/Input';
import Button from '../components/Button/Button';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { useI18n } from '../contexts/I18nContext';

const TURNSTILE_SITE_KEY = '0x4AAAAAADknPpI_XcH1KfPe';
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validatePasswordRules(password) {
  if (!password || password.length < 10) return 'Password must be at least 10 characters';
  if (password.length > 128) return 'Password must not exceed 128 characters';

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  const categories = [hasUpper, hasLower, hasDigit, hasSpecial].filter(Boolean).length;

  if (categories < 3) {
    return 'Password must contain at least 3 of: uppercase letter, lowercase letter, number, special character';
  }

  return null;
}

function validateFullNameRules(fullName) {
  const trimmed = fullName.trim();

  if (trimmed.length < 2 || trimmed.length > 100) return 'Full name must be between 2 and 100 characters';
  if (/[<>]/.test(trimmed)) return 'Full name contains invalid characters';

  return null;
}

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const mode = location.pathname === '/register' ? 'register' : 'login';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [role, setRole] = useState(null);
  const [track, setTrack] = useState(null);
  const [levels, setLevels] = useState([]);
  const [levelsLoading, setLevelsLoading] = useState(false);
  const [levelsError, setLevelsError] = useState('');
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [passkeyMfaToken, setPasskeyMfaToken] = useState('');
  const [passkeySubmitting, setPasskeySubmitting] = useState(false);

  const { login, loginWithPasskey, refresh } = useAuth();
  const { t } = useI18n();
  const widgetIdRef = useRef(null);
  const widgetReadyRef = useRef(false);
  const [captchaSlot, setCaptchaSlot] = useState(null);

  const redirectTo = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ''}`
    : '/dashboard';

  useEffect(() => {
    if (onboardingStep !== 2 || levels.length || levelsLoading) return;

    setLevelsLoading(true);
    setLevelsError('');

    getCurriculumLevels()
      .then((data) => setLevels(data || []))
      .catch(() => setLevelsError('Could not load available levels. Please try again.'))
      .finally(() => setLevelsLoading(false));
  }, [onboardingStep, levels.length, levelsLoading]);

  const renderWidget = useCallback((container) => {
    if (!window.turnstile || !container || widgetIdRef.current) return;

    try {
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: () => {
          widgetReadyRef.current = true;
        },
        'expired-callback': () => {
          widgetReadyRef.current = false;

          if (window.turnstile && widgetIdRef.current) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch {}
          }
        },
        'error-callback': () => {
          widgetReadyRef.current = false;
          return false;
        }
      });

      widgetReadyRef.current = true;
    } catch {
      widgetIdRef.current = null;
      widgetReadyRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');

      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.async = true;
      script.defer = true;
      script.crossOrigin = 'anonymous';

      document.head.appendChild(script);
    }

    if (!captchaSlot) return;

    let cancelled = false;
    let attempts = 0;

    const interval = setInterval(() => {
      attempts += 1;

      if (cancelled) return;

      if (window.turnstile && captchaSlot && !widgetIdRef.current) {
        renderWidget(captchaSlot);
        clearInterval(interval);
      }

      if (attempts > 50) clearInterval(interval);
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(interval);

      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {}
      }

      widgetIdRef.current = null;
      widgetReadyRef.current = false;
    };
  }, [captchaSlot, renderWidget]);

  function getTurnstileToken() {
    if (!window.turnstile || !widgetIdRef.current || !widgetReadyRef.current) {
      return '';
    }

    try {
      return window.turnstile.getResponse(widgetIdRef.current) || '';
    } catch {
      return '';
    }
  }

  function resetTurnstile() {
    if (!window.turnstile || !widgetIdRef.current) return;

    try {
      window.turnstile.reset(widgetIdRef.current);
    } catch {
      widgetIdRef.current = null;
      widgetReadyRef.current = false;

      if (captchaSlot) {
        renderWidget(captchaSlot);
      }
    }
  }

  async function handleLogin(event) {
    event.preventDefault();
    setError('');

    const token = getTurnstileToken();

    if (!token) {
      setError('Please complete the verification');
      return;
    }

    setSubmitting(true);

    try {
      const result = await login(email, password, token);

      if (result?.mfa_required || result?.passkey_required) {
        setMfaStep(true);
        resetTurnstile();
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed.');
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePasskeyLogin() {
    setError('');

    if (typeof window === 'undefined' || !window.isSecureContext || !window.PublicKeyCredential) {
      setError('This browser does not currently support secure passkey sign-in.');
      return;
    }

    const captchaToken = getTurnstileToken();

    if (!captchaToken) {
      setError('Please complete the verification before signing in with a passkey.');
      return;
    }

    setPasskeySubmitting(true);

    try {
      const result = await loginWithPasskey(null, null, captchaToken);

      if (result?.mfa_required) {
        setPasskeyMfaToken(result.passkey_access_token || '');
        setMfaStep(true);
        setMfaCode('');
        setMfaError('');
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || 'Passkey sign-in failed.');
      resetTurnstile();
    } finally {
      setPasskeySubmitting(false);
    }
  }

  async function handleMfaSubmit(event) {
    event.preventDefault();
    setMfaError('');

    if (!/^\d{6}$/.test(mfaCode.trim())) {
      setMfaError({t('auth.enterMfaCode')});
      return;
    }

    if (!passkeyMfaToken) {
      const token = getTurnstileToken();

      if (!token) {
        setMfaError('Please complete the verification again');
        return;
      }
    }

    setSubmitting(true);

    try {
      const result = passkeyMfaToken
        ? await loginWithPasskey(
            passkeyMfaToken,
            mfaCode.trim()
          )
        : await login(
            email,
            password,
            getTurnstileToken(),
            mfaCode.trim()
          );

      if (result?.mfa_required) {
        setMfaError('Incorrect code. Please try again.');
        if (!passkeyMfaToken) resetTurnstile();
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (err) {
      setMfaError(err.message || 'Verification failed.');
      if (!passkeyMfaToken) resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegister(event) {
    event.preventDefault();
    setError('');

    const nameError = validateFullNameRules(fullName);

    if (nameError) {
      setError(nameError);
      return;
    }

    if (!EMAIL_PATTERN.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    const passwordError = validatePasswordRules(password);

    if (passwordError) {
      setError(passwordError);
      return;
    }

    setOnboardingStep(1);
  }

  async function handleOnboardingFinish(selectedRole, selectedLevel) {
    setError('');

    if (!selectedRole || !selectedLevel) {
      setError('Please complete all onboarding steps');
      return;
    }

    const token = getTurnstileToken();

    if (!token) {
      setError('Verification expired.');
      return;
    }

    setSubmitting(true);

    try {
      const result = await signup(email, password, token, {
        full_name: fullName.trim(),
        role: selectedRole,
        level: selectedLevel
      });

      if (result?.user) {
        await refresh();
        setSuccess(true);

        setTimeout(() => {
          navigate(redirectTo, { replace: true });
        }, 1500);
      } else {
        setConfirmationMessage(
          result?.message ||
          'If this email is valid, please check your inbox to confirm your account.'
        );

        setPendingConfirmation(true);
      }
    } catch (err) {
      setError(err.message || 'Registration failed.');
      resetTurnstile();
    } finally {
      setSubmitting(false);
    }
  }

  function progressPct() {
    if (onboardingStep === 1) return 50;
    if (onboardingStep === 2) return 100;
    return 0;
  }

  function switchMode(nextMode) {
    navigate(
      nextMode === 'register' ? '/register' : '/login',
      {
        state: location.state,
        replace: true
      }
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-form-panel">
        <div className="auth-form-container">
          {pendingConfirmation ? (
            <div className="auth-state">
              <Icon
                name="envelope-circle-check"
                className="auth-state-icon"
              />

              <h2 className="auth-state-title font-fraunces">
                Check Your Inbox
              </h2>

              <p className="auth-state-text font-source-sans">
                {confirmationMessage}
              </p>

              <Button
                variant="ghost"
                onClick={() => switchMode('login')}
              >
                <Icon name="arrow-left" />
                Back to sign in
              </Button>
            </div>
          ) : success ? (
            <div className="auth-state">
              <Icon
                name="circle-check"
                className="auth-state-icon auth-state-icon-success"
              />

              <h2 className="auth-state-title font-fraunces">
                {t('auth.accountCreated')}
              </h2>

              <p className="auth-state-text font-source-sans">
                {t('auth.welcomeRedirecting')}
              </p>

              <Spinner context="brand" />
            </div>
          ) : mfaStep ? (
            <div className="auth-form-block">
              <h2 className="auth-heading font-fraunces">
                {t('auth.twoFactor')}
              </h2>

              <p className="auth-subheading font-source-sans">
                {passkeyMfaToken
                  ? t('auth.confirmPasskeyMfa')}
                  : t('auth.enterMfaCode')}}
              </p>

              {mfaError && (
                <div className="alert alert-error">
                  <Icon name="exclamation-triangle" />
                  <span className="font-open-sans">
                    {mfaError}
                  </span>
                </div>
              )}

              <form onSubmit={handleMfaSubmit}>
                <Input
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="000000"
                  value={mfaCode}
                  onChange={(event) =>
                    setMfaCode(
                      event.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6)
                    )
                  }
                  disabled={submitting}
                />

                {!passkeyMfaToken && (
                  <div
                    ref={setCaptchaSlot}
                    className="auth-captcha"
                  />
                )}

                <Button
                  type="submit"
                  loading={submitting}
                  loadingContext="brand"
                  className="auth-submit"
                >
                  {t('auth.verifyAndSignIn')}
                </Button>
              </form>
            </div>
          ) : onboardingStep > 0 ? (
            <div className="auth-form-block">
              <h2 className="auth-heading font-fraunces">
                {t('auth.completeProfile')}
              </h2>

              <p className="auth-subheading font-source-sans">
                {t('auth.personaliseLearning')}
              </p>

              <div className="progress-track auth-progress">
                <div
                  className="progress-fill progress-gradient"
                  style={{ width: `${progressPct()}%` }}
                />
              </div>

              {error && (
                <div className="alert alert-error">
                  <Icon name="exclamation-triangle" />
                  <span className="font-open-sans">
                    {error}
                  </span>
                </div>
              )}

              {onboardingStep === 1 && (
                <div className="auth-onboarding-step">
                  <h3 className="auth-step-title font-poppins">
                    {t('auth.iAmA')}
                  </h3>

                  <div className="auth-options">
                    <Button
                      variant={
                        role === 'student'
                          ? 'primary'
                          : 'secondary'
                      }
                      onClick={() => {
                        setRole('student');
                        setOnboardingStep(2);
                      }}
                    >
                      <Icon name="user-graduate" />
                      {t('auth.student')}
                    </Button>

                    <Button
                      variant={
                        role === 'teacher'
                          ? 'primary'
                          : 'secondary'
                      }
                      onClick={() => {
                        setRole('teacher');
                        setOnboardingStep(2);
                      }}
                    >
                      <Icon name="user-pen" />
                      {t('auth.teacher')}
                    </Button>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="auth-onboarding-step">
                  <h3 className="auth-step-title font-poppins">
                    {t('auth.selectLevel')}
                  </h3>

                  {levelsLoading && (
                    <Spinner
                      context="data"
                      size="sm"
                    />
                  )}

                  {levelsError && (
                    <p className="form-error font-open-sans">
                      {levelsError}
                    </p>
                  )}

                  {!levelsLoading && !levelsError && (
                    <div className="auth-options">
                      {levels.map((lvl) => {
                        const value = lvl.display_name;
                        const rowKey =
                          lvl.key ||
                          lvl.id ||
                          value;

                        return (
                          <Button
                            key={rowKey}
                            variant={
                              track === value
                                ? 'primary'
                                : 'secondary'
                            }
                            onClick={() => {
                              setTrack(value);
                              handleOnboardingFinish(
                                role,
                                value
                              );
                            }}
                            loading={
                              submitting &&
                              track === value
                            }
                            loadingContext="conic"
                            disabled={submitting}
                          >
                            <Icon
                              name={
                                lvl.icon === 'dna'
                                  ? 'microscope'
                                  : lvl.icon ||
                                    'graduation-cap'
                              }
                            />

                            {lvl.display_name}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="auth-form-block">
              <h2 className="auth-heading font-fraunces">
                {mode === 'login'
                  ? t('common.signIn')}
                  : t('auth.createAccount')}}
              </h2>

              <p className="auth-subheading font-source-sans">
                {mode === 'login'
                  ? t('auth.accessAccount')}
                  : t('auth.joinLearners')}}
              </p>

              {error && (
                <div className="alert alert-error">
                  <Icon name="exclamation-triangle" />
                  <span className="font-open-sans">
                    {error}
                  </span>
                </div>
              )}

              <form
                onSubmit={
                  mode === 'login'
                    ? handleLogin
                    : handleRegister
                }
              >
                {mode === 'register' && (
                  <Input
                    label={t('auth.fullNameLabel')}
                    placeholder={t('auth.enterFullName')}
                    value={fullName}
                    onChange={(event) =>
                      setFullName(event.target.value)
                    }
                    required
                    disabled={submitting}
                    icon="user"
                  />
                )}

                <Input
                  label={t('auth.emailAddress')}
                  type="email"
                  placeholder={t('auth.enterEmail')}
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  disabled={submitting}
                  icon="envelope"
                />

                <Input
                  label={t('auth.password')}
                  type="password"
                  placeholder={
                    mode === 'register'
                      ? 'Create a password'
                      : 'Enter your password'
                  }
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  disabled={submitting}
                  hint={
                    mode === 'register'
                      ? t('auth.passwordHint')
                      : undefined
                  }
                />

                {mode === 'register' && (
                  <Input
                    label={t('auth.confirmPasswordInput')}
                    type="password"
                    placeholder={t('auth.confirmPasswordInput')}
                    value={confirm}
                    onChange={(event) =>
                      setConfirm(event.target.value)
                    }
                    required
                    disabled={submitting}
                  />
                )}

                <div
                  ref={setCaptchaSlot}
                  className="auth-captcha"
                />

                <Button
                  type="submit"
                  loading={submitting}
                  loadingContext="brand"
                  variant="primary"
                  className="auth-submit"
                >
                  {mode === 'login' ? (
                    <>
                      <Icon name="right-to-bracket" />
                      {t('common.signIn')}
                    </>
                  ) : (
                    <>
                      <Icon name="user-plus" />
                      {t('auth.createAccount')}
                    </>
                  )}
                </Button>
              </form>

              {mode === 'login' && (
                <Button
                  type="button"
                  variant="outline"
                  icon="fingerprint"
                  loading={passkeySubmitting}
                  loadingContext="brand"
                  onClick={handlePasskeyLogin}
                  className="auth-submit"
                >
                  Sign in with a Passkey
                </Button>
              )}

              <div className="auth-switch">
                {mode === 'login' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => switchMode('register')}
                  >
                    Sign Up
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => switchMode('login')}
                  >
                    {t('common.signIn')}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
