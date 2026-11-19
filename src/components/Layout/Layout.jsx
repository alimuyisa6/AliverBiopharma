 import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { useLayout } from '../../contexts/LayoutContext';
import { useI18n } from '../../contexts/I18nContext';
import { signout } from '../../api/client';
const SearchOverlay = lazy(() => import('../SearchOverlay/SearchOverlay'));
import AdminLauncher from '../AdminLauncher';
import NetworkStatus from '../NetworkStatus/NetworkStatus';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import ClassSwitcher from '../ClassSwitcher/ClassSwitcher';
import BiopharmToggle from '../BiopharmToggle/BiopharmToggle';

const EXCLUDED_PATHS = ['/login', '/register'];
const SCROLL_STORAGE_KEY = 'scroll-positions';
const NO_FOOTER_PATHS = ['/advertise', '/advertise/create', '/advertise/payment', '/tutors'];

function loadScrollMap() { try { return new Map(JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) || '[]')); } catch { return new Map(); } }
function persistScrollMap(map) { try { sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify([...map.entries()])); } catch {} }

function MenuGlyph({ isOpen }) {
  return (
    <svg className="h-5 w-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path className="menu-line menu-line-top" d={isOpen ? "M6 7l6 10" : "M6 7h14"} />
      <path className="menu-line menu-line-middle" d={isOpen ? "M12 17V7" : "M10 12h10"} />
      <path className="menu-line menu-line-bottom" d={isOpen ? "M12 17l6-10" : "M6 17h14"} />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg className="h-5 w-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.8" cy="10.8" r="5.8" />
      <path d="m15.2 15.2 4.4 4.4" />
    </svg>
  );
}

function ThemeGlyph({ isDark }) {
  return isDark ? (
    <svg className="h-5 w-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 15.4A8.2 8.2 0 0 1 8.6 4a8.2 8.2 0 1 0 11.4 11.4Z" />
    </svg>
  ) : (
    <svg className="h-5 w-5 fill-none stroke-current stroke-[1.8]" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2M12 19.5v2M21.5 12h-2M4.5 12h-2M18.72 5.28l-1.42 1.42M6.7 17.3l-1.42 1.42M18.72 18.72l-1.42-1.42M6.7 6.7 5.28 5.28" />
    </svg>
  );
}

function AccountMenuIcon({ name, size = '2rem' }) {
  const shared = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: false };
  const glyphs = {
    dashboard: <><path d="M4 18a9 9 0 1 1 16 0" /><path d="M12 13 17 8M5 18h14" /><circle cx="12" cy="13" r="1.7" fill="currentColor" stroke="none" /></>,
    profile: <><circle cx="12" cy="8" r="3.2" /><path d="M5.2 20a6.8 6.8 0 0 1 13.6 0" /><path d="M3.5 8.5a9 9 0 0 1 17 0M2.8 14.5a10 10 0 0 0 18.4 0" strokeWidth="1.3" opacity=".65" /></>,
    signin: <><path d="M13 4h5a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5" /><path d="m10 8 4 4-4 4m4-4H3" /></>,
    register: <><circle cx="9" cy="8" r="3.2" /><path d="M3 20a6 6 0 0 1 12 0m3-10v7m-3.5-3.5h7" /></>,
    signout: <><path d="M11 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" /><path d="m14 8 4 4-4 4m4-4H9" /></>,
    arrow: <><path d="M7 17 17 7M8 7h9v9" /></>,
  };
  return <svg {...shared}>{glyphs[name] || glyphs.dashboard}</svg>;
}

export default function Layout({ children, showFooter = true }) {
  const [mobileOpen, setMobileOpen] = useState(false), [searchOpen, setSearchOpen] = useState(false), [scrolled, setScrolled] = useState(false), [signingOut, setSigningOut] = useState(false);
  const location = useLocation(), navigate = useNavigate(), navigationType = useNavigationType();
  const { logo, siteName, footer, theme, toggleTheme, isAuthenticated, refreshUser, uiMap } = useLayout();
  const { t } = useI18n();
  const isAuthPage = EXCLUDED_PATHS.includes(location.pathname);
  const hideHeader = isAuthPage, hideFooter = isAuthPage;
  const scrollPositions = useRef(loadScrollMap()), persistTimeout = useRef(null), scrollFrame = useRef(null), routeKey = location.key || 'default';
  useEffect(() => { if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual'; }, []);
  useEffect(() => { const handler = () => { if (scrollFrame.current !== null) return; scrollFrame.current = requestAnimationFrame(() => { scrollFrame.current = null; const scrollY = window.scrollY; setScrolled(scrollY > 10); scrollPositions.current.set(routeKey, scrollY); clearTimeout(persistTimeout.current); persistTimeout.current = setTimeout(() => persistScrollMap(scrollPositions.current), 200); }); }; window.addEventListener('scroll', handler, { passive: true }); return () => { window.removeEventListener('scroll', handler); if (scrollFrame.current !== null) { cancelAnimationFrame(scrollFrame.current); scrollFrame.current = null; } clearTimeout(persistTimeout.current); }; }, [routeKey]);
  useLayoutEffect(() => {
    const raf = requestAnimationFrame(() => {
      const top = navigationType === 'POP' && scrollPositions.current.has(routeKey)
        ? scrollPositions.current.get(routeKey)
        : 0;
      window.scrollTo({ left: 0, top, behavior: 'instant' });
    });
    return () => cancelAnimationFrame(raf);
  }, [routeKey, navigationType]);
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!mobileOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape') setMobileOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  const handleSignout = async () => { setSigningOut(true); try { await signout(); await refreshUser(); navigate('/'); } catch { navigate('/'); } finally { setSigningOut(false); } };
  const loginButton = uiMap.login_button || { label: 'Sign In', variant: 'outline', color: 'primary' }, signupButton = uiMap.signup_button || { label: 'Sign Up', variant: 'solid', color: 'primary' }, isDarkTheme = theme === 'dark';
  const menuLinks = isAuthenticated
    ? [
        { href: '/dashboard', label: t('common.dashboard'), icon: 'dashboard' },
        { href: '/profile', label: t('common.profile'), icon: 'profile' },
      ]
    : [
        { href: '/login', label: loginButton.label, icon: 'signin' },
        { href: '/register', label: signupButton.label, icon: 'register' },
      ];
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
    <NetworkStatus />
    {!hideHeader && <header className={`sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-xl transition-shadow ${scrolled ? 'shadow-md' : ''}`}><div className="mx-auto flex min-h-[68px] w-full max-w-7xl min-w-0 items-center gap-2 px-3 sm:min-h-[76px] sm:gap-4 sm:px-6 lg:gap-6">
      <Link to="/" className="flex min-w-0 max-w-[min(42vw,13rem)] shrink-0 items-center gap-2 overflow-hidden text-base font-extrabold tracking-tight text-primary-900 no-underline sm:max-w-[14rem] sm:text-lg">{logo ? <img src={logo} alt="" aria-hidden="true" className="block h-9 max-h-9 w-auto max-w-full shrink object-contain sm:h-11 sm:max-h-11" /> : <span className="truncate">{siteName}</span>}</Link>
      <div className="ml-auto flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
        {isAuthenticated && <div className="min-w-0 max-w-[6.5rem] shrink min-[769px]:max-w-[12rem]"><ClassSwitcher /></div>}
        <button className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-primary-800 transition-colors hover:border-primary-200 hover:bg-primary-50 sm:h-10 sm:w-10" onClick={() => setSearchOpen(true)} aria-label={t('common.search')} type="button"><SearchGlyph /></button>
        <span className="inline-flex shrink-0"><NotificationCenter /></span>
        <span className="inline-flex shrink-0"><BiopharmToggle checked={isDarkTheme} onChange={toggleTheme} ariaLabel={t('common.toggleTheme')} /></span>
        <button className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-primary-800 transition-colors hover:border-primary-200 hover:bg-primary-50" onClick={() => setMobileOpen((prev) => !prev)} aria-label={mobileOpen ? t('common.closeMenu') : t('common.menu')} aria-expanded={mobileOpen} type="button"><MenuGlyph isOpen={mobileOpen} /></button>
      </div>
    </div></header>}
    {!hideHeader && <Suspense fallback={null}>{searchOpen && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}</Suspense>}<AdminLauncher />
    {!hideHeader && <>
      <button className={`fixed inset-0 z-40 bg-slate-950/35 backdrop-blur-[2px] transition-opacity duration-300 ${mobileOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setMobileOpen(false)} aria-label={t('common.closeMenu')} tabIndex={mobileOpen ? 0 : -1} type="button" />
      <section
        className={`fixed left-1/2 top-[76px] z-50 w-[min(50vw,640px)] max-w-[calc(100vw-2rem)] max-[640px]:w-[calc(100vw-2rem)] -translate-x-1/2 origin-top rounded-3xl border border-blue-100 bg-white/95 p-5 shadow-[0_24px_70px_-24px_rgba(21,48,75,0.42)] backdrop-blur-xl transition-[opacity,transform,visibility] duration-300 ease-out sm:top-[88px] sm:p-7 ${mobileOpen ? "visible translate-y-0 scale-y-100 opacity-100" : "invisible -translate-y-2 scale-y-75 opacity-0"}`}
        aria-hidden={!mobileOpen}
        aria-label={t('common.menu')}
      >
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="m-0 text-[0.68rem] font-bold uppercase tracking-[0.22em] text-primary-500">{isAuthenticated ? 'Your account' : 'Welcome'}</p>
            <h2 className="mb-0 mt-1 text-xl font-extrabold tracking-tight text-primary-950 sm:text-2xl">{t('common.menu')}</h2>
          </div>
          <button type="button" onClick={() => setMobileOpen(false)} aria-label={t('common.closeMenu')} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-primary-800 transition hover:border-primary-300 hover:bg-primary-50" tabIndex={mobileOpen ? 0 : -1}>
            <Icon name="xmark" size="1.2rem" plain />
          </button>
        </div>
        <nav className="grid grid-cols-2 gap-3 sm:gap-4" aria-label={t('common.menu')}>
          {menuLinks.map((link) => {
            const active = location.pathname === link.href || location.pathname.startsWith(`${link.href}/`);
            return <Link key={link.href} to={link.href} onClick={() => setMobileOpen(false)} tabIndex={mobileOpen ? 0 : -1}
              className={`group flex min-h-28 flex-col items-start justify-between gap-4 rounded-2xl border p-4 text-left no-underline transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:min-h-32 sm:p-5 ${active ? 'border-primary-300 bg-primary-50 text-primary-950 shadow-sm' : 'border-slate-200 bg-white text-primary-900 hover:border-primary-200 hover:bg-blue-50/70'}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-colors sm:h-14 sm:w-14 ${active ? 'bg-primary-700 text-white' : 'bg-primary-50 text-primary-700 group-hover:bg-primary-100'}`}>
                <AccountMenuIcon name={link.icon} size="2rem" />
              </span>
              <span className="flex w-full items-center justify-between gap-2 text-sm font-bold sm:text-base">
                {link.label}
                <span className="shrink-0 opacity-60 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"><AccountMenuIcon name="arrow" size="1rem" /></span>
              </span>
            </Link>;
          })}
          {isAuthenticated && <button className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50/70 px-4 py-3 text-sm font-bold text-red-700 transition hover:border-red-200 hover:bg-red-100" onClick={handleSignout} disabled={signingOut} type="button" tabIndex={mobileOpen ? 0 : -1}>
            <AccountMenuIcon name="signout" size="1.2rem" />
            {signingOut ? t('common.signingOut') : t('common.signOut')}
          </button>}
        </nav>
      </section>
    </>}
    <main id="main-content" tabIndex="-1" className={`min-h-[60vh] flex-1 ${location.pathname.startsWith('/profile') ? 'bg-primary-50/30' : ''}`} key={routeKey}>{children}</main>
    {!hideFooter && showFooter && <footer className="relative isolate mt-0 overflow-hidden text-white"><div className="pointer-events-none relative z-0 block h-28 sm:h-32 lg:h-36" aria-hidden="true"><svg className="block h-full w-full" viewBox="0 0 1440 140" preserveAspectRatio="none" focusable="false"><path className="fill-secondary-400" d="M0 34C170 4 330 78 540 45S900 5 1090 34 1320 70 1440 30V140H0Z" /><path className="fill-primary-500" d="M0 57C190 25 390 94 600 67S960 28 1160 58 1350 88 1440 54V140H0Z" /><path className="fill-primary-900" d="M0 81C210 51 410 112 650 87S1010 50 1200 82 1370 108 1440 78V140H0Z" /></svg></div><div className="relative z-10 mx-auto grid w-full max-w-7xl gap-12 bg-primary-900 px-5 pb-12 pt-10 sm:px-8 sm:pt-12 lg:grid-cols-[1fr_1.5fr] lg:pt-14">
      <div className="max-w-sm"><Link to="/" className="inline-flex min-w-0 max-w-full shrink-0 items-center gap-3 text-xl font-extrabold tracking-tight text-white no-underline">{logo ? <img src={logo} alt="" aria-hidden="true" className="block h-10 max-h-10 w-auto max-w-[12rem] object-contain brightness-0 invert sm:h-12 sm:max-h-12" /> : siteName}</Link><p className="mt-5 max-w-xs text-sm leading-7 text-blue-100">{t('common.footerTagline')}</p>{footer.social_links && Object.keys(footer.social_links).length > 0 && <div className="mt-6 flex flex-wrap gap-3">{Object.entries(footer.social_links).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20" data-platform={platform} aria-label={platform}><Icon name={platform} /></a>)}</div>}</div>
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="grid content-start gap-8 sm:grid-cols-2">
          {footer.community_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.community')}</h4><div className="grid content-start gap-3">{footer.community_links.filter((item) => item.path !== '/about' && item.path !== '/classroom').map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
        </div>
        <div className="grid content-start gap-8 sm:grid-cols-2">
          {footer.quick_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.quickLinks')}</h4><div className="grid content-start gap-3">{footer.quick_links.filter((item) => !['/','/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
          {footer.resource_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.resources')}</h4><div className="grid content-start gap-3">{footer.resource_links.filter((item) => !['/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
        </div>
      </div>
    </div><div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/15 bg-primary-900 px-5 py-6 text-sm text-blue-100 sm:px-8 md:flex-row md:items-center md:justify-between"><p className="m-0">&copy; {new Date().getFullYear()} AliverBiopharm. All rights reserved.</p><nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal and company links"><Link to="/privacy" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.privacy')}</Link><Link to="/terms" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.terms')}</Link><Link to="/about" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.about')}</Link></nav></div></footer>}
  </div>;
}