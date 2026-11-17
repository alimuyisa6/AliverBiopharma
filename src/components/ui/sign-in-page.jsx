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
    <div className="mx-auto w-full max-w-md rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-9">
      <div className="mb-8 space-y-3">
        <span className="inline-flex rounded-full bg-primary-50 px-3 py-1 text-xs font-bold tracking-widest text-primary-800">ALIVERBIOPHARM LEARNING</span>
        <h2 className="text-3xl font-bold tracking-tight text-primary-900 sm:text-4xl">Welcome back</h2>
        <p className="text-base leading-7 text-slate-600">
          Sign in to continue your Biology and Pharmacy learning journey.
        </p>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800" role="alert">
          <Icon name="exclamation-triangle" />
          <span>{error}</span>
        </div>
      )}

      <form className="grid gap-5" onSubmit={handleLogin}>
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

        <div ref={setCaptchaSlot} className="flex min-h-16 items-center justify-center overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-3" />

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

      <div className="mt-7 flex flex-wrap items-center justify-center gap-2 border-t border-slate-100 pt-6 text-sm text-slate-600">
        <span>{t('auth.noAccount')}</span>
        <Button variant="ghost" size="sm" onClick={onSignUp}>
          Sign up
        </Button>
      </div>
    </div>
  );
}
