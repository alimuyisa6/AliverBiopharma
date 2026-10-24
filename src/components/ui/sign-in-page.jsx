import { useId } from 'react';
import Input from '../Input/Input';
import Button from '../Button/Button';
import Icon from '../Icon/Icon';

/**
 * Sign-in form presentation for AliverBiopharm.
 * Authentication, CAPTCHA, MFA and passkey handling remain owned by AuthContext/Auth.jsx.
 */
export function LoginPage({
  email,
  setEmail,
  password,
  setPassword,
  error,
  setCaptchaSlot,
  handleLogin,
  handlePasskeyLogin,
  submitting,
  passkeySubmitting,
  onSignUp,
  t
}) {
  const emailId = useId();

  return (
    <div className="auth-form-block auth-login-block">
      <div className="auth-form-head">
        <span className="auth-login-kicker">ALIVERBIOPHARM LEARNING</span>
        <h2 className="auth-heading">Welcome back</h2>
        <p className="auth-subheading">
          Sign in to continue your Biology and Pharmacy learning journey.
        </p>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" role="alert">
          <Icon name="exclamation-triangle" />
          <span>{error}</span>
        </div>
      )}

      <form className="auth-form" onSubmit={handleLogin}>
        <Input
          id={emailId}
          label={t('auth.emailAddress')}
          type="email"
          autoComplete="email"
          placeholder={t('auth.enterEmail')}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={submitting}
          className="auth-field"
        />

        <Input
          label={t('auth.password')}
          type="password"
          autoComplete="current-password"
          placeholder={t('auth.enterPassword')}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          disabled={submitting}
          className="auth-field"
        />

        <div ref={setCaptchaSlot} className="auth-captcha" />

        <Button
          type="submit"
          loading={submitting}
          loadingContext="brand"
          variant="primary"
          className="auth-submit auth-login-submit"
        >
          {t('common.signIn')}
        </Button>
      </form>

      <Button
        type="button"
        variant="secondary"
        loading={passkeySubmitting}
        loadingContext="brand"
        onClick={handlePasskeyLogin}
        className="auth-submit auth-passkey"
      >
        Sign in with a Passkey
      </Button>

      <div className="auth-switch">
        <span>{t('auth.noAccount')}</span>
        <Button variant="ghost" size="sm" onClick={onSignUp}>
          Sign up
        </Button>
      </div>
    </div>
  );
}
