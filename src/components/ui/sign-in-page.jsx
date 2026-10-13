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

export function AuthFormWatermark() {
  return (
    <svg
      className="auth-form-watermark"
      viewBox="0 0 620 760"
      fill="none"
      aria-hidden="true"
      focusable="false"
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="aliver-form-helix" x1="90" y1="70" x2="490" y2="650" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--palette-blue)" />
          <stop offset="1" stopColor="var(--palette-mint)" />
        </linearGradient>
        <radialGradient id="aliver-form-cell" cx="0" cy="0" r="1" gradientTransform="translate(380 300) rotate(90) scale(175)" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--palette-mint)" stopOpacity=".34" />
          <stop offset="1" stopColor="var(--palette-blue)" stopOpacity=".02" />
        </radialGradient>
      </defs>
      <circle cx="380" cy="300" r="174" fill="url(#aliver-form-cell)" />
      <circle cx="380" cy="300" r="173" stroke="url(#aliver-form-helix)" strokeWidth="1.4" strokeDasharray="4 11" />
      <circle cx="380" cy="300" r="139" stroke="url(#aliver-form-helix)" strokeWidth="1.2" opacity=".72" />
      <circle cx="380" cy="300" r="96" stroke="url(#aliver-form-helix)" strokeWidth="1.1" opacity=".48" />
      <path d="M118 44C118 105 296 114 296 175S118 244 118 305 296 374 296 435 118 504 118 565 296 634 296 695" stroke="url(#aliver-form-helix)" strokeWidth="3" strokeLinecap="round" opacity=".85" />
      <path d="M296 44C296 105 118 114 118 175S296 244 296 305 118 374 118 435 296 504 296 565 118 634 118 695" stroke="url(#aliver-form-helix)" strokeWidth="3" strokeLinecap="round" opacity=".72" />
      <g stroke="url(#aliver-form-helix)" strokeWidth="1.8" strokeLinecap="round" opacity=".72">
        <path d="M139 91H275M184 132H230M122 174H292M148 217H266M197 260H217M122 305H292M148 348H266M197 391H217M122 435H292M148 478H266M197 521H217M122 565H292M148 608H266M197 651H217" />
      </g>
      <g stroke="url(#aliver-form-helix)" strokeWidth="1.4" opacity=".8">
        <path d="M380 126V174M380 426V474M206 300H254M506 300H554M257 177L291 211M469 389L503 423M257 423L291 389M469 211L503 177" />
        <circle cx="380" cy="126" r="5" fill="var(--palette-mint)" />
        <circle cx="380" cy="474" r="5" fill="var(--palette-blue)" />
        <circle cx="206" cy="300" r="5" fill="var(--palette-blue)" />
        <circle cx="554" cy="300" r="5" fill="var(--palette-mint)" />
        <circle cx="257" cy="177" r="4" fill="var(--palette-mint)" />
        <circle cx="503" cy="423" r="4" fill="var(--palette-blue)" />
      </g>
    </svg>
  );
}

export function MolecularBrandIllustration() {
  return (
    <svg
      className="auth-science-art"
      viewBox="0 0 520 430"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id="aliver-dna-a" x1="120" y1="25" x2="410" y2="405" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--palette-periwinkle)" />
          <stop offset="1" stopColor="var(--palette-mint)" />
        </linearGradient>
        <linearGradient id="aliver-dna-b" x1="380" y1="20" x2="115" y2="400" gradientUnits="userSpaceOnUse">
          <stop stopColor="var(--palette-mint)" />
          <stop offset="1" stopColor="var(--palette-periwinkle)" />
        </linearGradient>
      </defs>
      <g opacity=".72" stroke="url(#aliver-dna-a)" strokeWidth="3.2" strokeLinecap="round">
        <path d="M142 20C142 75 325 83 325 140S142 205 142 260 325 337 325 410" />
        <path d="M325 20C325 75 142 83 142 140S325 205 325 260 142 337 142 410" stroke="url(#aliver-dna-b)" />
        <path d="M178 55L288 55M215 91L252 91M160 125L307 125M172 164L294 164M218 202L249 202M158 238L309 238M176 278L292 278M218 318L251 318M158 356L309 356" opacity=".82" />
      </g>
      <g stroke="var(--palette-periwinkle)" strokeWidth="1.2" opacity=".35">
        <path d="M56 102H118L151 135M374 92H433V145M66 315H115L143 287M358 334H421V291" />
        <circle cx="56" cy="102" r="4" fill="var(--palette-mint)" />
        <circle cx="433" cy="145" r="4" fill="var(--palette-periwinkle)" />
        <circle cx="66" cy="315" r="4" fill="var(--palette-periwinkle)" />
        <circle cx="421" cy="291" r="4" fill="var(--palette-mint)" />
      </g>
      <g fill="var(--palette-ink)" stroke="var(--palette-mint)" strokeWidth="2">
        <circle cx="142" cy="140" r="7" />
        <circle cx="325" cy="260" r="7" />
        <circle cx="232" cy="202" r="5" />
      </g>
    </svg>
  );
}
