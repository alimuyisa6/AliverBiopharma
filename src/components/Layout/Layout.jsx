 import { lazy, Suspense, useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import Icon from '../Icon/Icon';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
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
const NO_CHROME_PATHS = ['/recall', '/quiz', '/profile', '/notes', '/past-papers'];
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

export default function Layout({ children, showFooter = true }) {
  const [mobileOpen, setMobileOpen] = useState(false), [searchOpen, setSearchOpen] = useState(false), [scrolled, setScrolled] = useState(false), [signingOut, setSigningOut] = useState(false);
  const location = useLocation(), navigate = useNavigate(), navigationType = useNavigationType();
  const { logo, siteName, navigation, footer, theme, toggleTheme, isAuthenticated, refreshUser, features, uiMap } = useLayout();
  const { t } = useI18n();
  const { user } = useAuth();
  const isAuthPage = EXCLUDED_PATHS.includes(location.pathname), isNoteDetailPage = location.pathname.startsWith('/notes/read'), isRoomPage = location.pathname.startsWith('/classroom/'), isNoChromePage = NO_CHROME_PATHS.some((path) => location.pathname.startsWith(path)), isNoFooterPage = NO_FOOTER_PATHS.some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  const hideHeader = isAuthPage || isNoteDetailPage || isNoChromePage, hideFooter = isAuthPage || isRoomPage || isNoteDetailPage || isNoChromePage || isNoFooterPage;
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
    const desktopQuery = window.matchMedia('(min-width: 769px)');
    const closeMenuOnDesktop = (event) => {
      if (event.matches) setMobileOpen(false);
    };
    closeMenuOnDesktop(desktopQuery);
    desktopQuery.addEventListener('change', closeMenuOnDesktop);
    return () => desktopQuery.removeEventListener('change', closeMenuOnDesktop);
  }, []);
  const handleSignout = async () => { setSigningOut(true); try { await signout(); await refreshUser(); navigate('/'); } catch { navigate('/'); } finally { setSigningOut(false); } };
  const blockedHeaderPaths = ['/about', '/classroom', '/blog', '/contact', '/notes', '/quiz', '/flashcards', '/past-papers', '/recall', '/pdfs', '/glossary'];
  const filteredNavigation = navigation.filter((link) => { if (blockedHeaderPaths.includes(link.href)) return false; if (link.href === '/quiz' && features.quizzes === false) return false; if (link.href === '/flashcards' && features.flashcards === false) return false; if (link.href === '/past-papers' && features.past_papers === false) return false; if (link.href === '/recall' && features.recall === false) return false; if (link.href === '/classroom' && features.classrooms === false) return false; return true; });
  const loginButton = uiMap.login_button || { label: 'Sign In', variant: 'outline', color: 'primary', icon: 'right-to-bracket' }, signupButton = uiMap.signup_button || { label: 'Sign Up', variant: 'solid', color: 'primary', icon: 'user-plus' }, isDarkTheme = theme === 'dark';
  const menuLinks = [...filteredNavigation];
  const addMenuLink = (href, label, icon) => { const existing = menuLinks.find((link) => link.href === href); if (existing) { if (!existing.icon && icon) existing.icon = icon; return; } menuLinks.push({ href, label, icon }); };
  addMenuLink('/', t('common.home'), 'home');
  if (isAuthenticated) { addMenuLink('/dashboard', t('common.dashboard'), 'gauge-high'); addMenuLink('/profile', t('common.profile'), 'gear'); } else { addMenuLink('/login', loginButton.label, loginButton.icon); addMenuLink('/register', signupButton.label, signupButton.icon); }
  const primaryMenuOrder = isAuthenticated ? ['/', '/dashboard', '/profile'] : ['/', '/login', '/register'];
  menuLinks.sort((a, b) => {
    const aIndex = primaryMenuOrder.indexOf(a.href);
    const bIndex = primaryMenuOrder.indexOf(b.href);
    return (aIndex < 0 ? primaryMenuOrder.length : aIndex) - (bIndex < 0 ? primaryMenuOrder.length : bIndex);
  });
  return <div className="min-h-screen flex flex-col bg-background text-foreground">
    <NetworkStatus />
    {!hideHeader && <header className={`sticky top-0 z-40 w-full border-b border-border bg-white/95 backdrop-blur-xl transition-shadow ${scrolled ? 'shadow-md' : ''}`}><div className="mx-auto flex min-h-[76px] w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
      <Link to="/" className="inline-flex shrink-0 items-center gap-3 text-xl font-extrabold tracking-tight text-primary-900 no-underline">{logo ? <img src={logo} alt="" aria-hidden="true" /> : siteName}</Link>
      <nav className="hidden items-center justify-center gap-1 lg:flex" aria-label="Primary navigation">{menuLinks.map((link) => <Link key={link.href} to={link.href} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold no-underline transition-colors hover:bg-primary-50 hover:text-primary-700 ${location.pathname === link.href ? 'bg-primary-50 text-primary-800' : 'text-slate-600'}`}>{link.icon && <Icon name={link.icon} />}{link.label}</Link>)}</nav>
      <div className="ml-auto flex shrink-0 items-center gap-2">
        {isAuthenticated && <ClassSwitcher />}
        <button className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-primary-800 transition-colors hover:border-primary-200 hover:bg-primary-50" onClick={() => setSearchOpen(true)} aria-label={t('common.search')} type="button"><SearchGlyph /></button>
        <NotificationCenter />
        <BiopharmToggle checked={isDarkTheme} onChange={toggleTheme} ariaLabel={t('common.toggleTheme')} />
        <button className="lg:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-primary-800 transition-colors hover:border-primary-200 hover:bg-primary-50" onClick={() => setMobileOpen((prev) => !prev)} aria-label={mobileOpen ? t('common.closeMenu') : t('common.menu')} aria-expanded={mobileOpen} type="button"><MenuGlyph isOpen={mobileOpen} /></button>
      </div>
    </div></header>}
    {!hideHeader && <Suspense fallback={null}>{searchOpen && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}</Suspense>}<AdminLauncher />
    {!hideHeader && <>
      <button className={`fixed inset-0 z-40 bg-slate-950/50 transition-all lg:hidden ${mobileOpen ? "visible opacity-100" : "invisible opacity-0"}`} onClick={() => setMobileOpen(false)} aria-label={t('common.closeMenu')} tabIndex={mobileOpen ? 0 : -1} type="button" />
      <div className={`fixed inset-y-0 right-0 z-50 flex w-[min(88vw,380px)] flex-col overflow-y-auto bg-white p-6 shadow-2xl transition-transform duration-300 lg:hidden ${mobileOpen ? "visible translate-x-0" : "invisible translate-x-full"}`} aria-hidden={!mobileOpen}>
        <div className="flex items-center gap-3 text-lg font-bold text-primary-900"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name="bars" /></span><span>{t('common.menu')}</span></div>
        <div className="my-5 h-px bg-border" aria-hidden="true" />
        <nav className="grid gap-2" aria-label={t('common.menu')}>
          {menuLinks.map((link) => <Link key={link.href} to={link.href} className={`flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold no-underline transition-colors hover:bg-primary-50 hover:text-primary-800 ${location.pathname === link.href ? 'bg-primary-50 text-primary-800' : 'text-slate-700'}`} onClick={() => setMobileOpen(false)} tabIndex={mobileOpen ? 0 : -1}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-primary-700">{link.icon && <Icon name={link.icon} />}</span><span className="min-w-0 flex-1">{link.label}</span></Link>)}
          {isAuthenticated && <button className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 py-2 mt-3 border border-red-100 bg-red-50/50 text-left text-sm font-semibold text-red-700 hover:bg-red-50" onClick={handleSignout} disabled={signingOut} type="button" tabIndex={mobileOpen ? 0 : -1}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-primary-700"><Icon name="right-from-bracket" /></span><span className="min-w-0 flex-1">{signingOut ? t('common.signingOut') : t('common.signOut')}</span></button>}
        </nav>
      </div>
    </>}
    <main id="main-content" tabIndex="-1" className={`min-h-[60vh] flex-1 ${location.pathname.startsWith('/profile') ? 'bg-primary-50/30' : ''}`} key={routeKey}>{children}</main>
    {!hideFooter && showFooter && <footer className="relative mt-16 overflow-hidden border-t border-primary-900 bg-primary-900 text-white"><div className="pointer-events-none absolute inset-x-0 -top-1 h-16" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" focusable="false"><path className="fill-primary-700" d="M0 62C180 18 360 96 600 62S1000 8 1200 52 1360 88 1440 56V120H0Z" /><path className="fill-primary-800" d="M0 78C220 34 420 104 680 74S1040 26 1240 70 1380 96 1440 74V120H0Z" /><path className="fill-primary-900" d="M0 92C240 58 460 112 720 90S1080 52 1260 88 1390 106 1440 94V120H0Z" /></svg></div><div className="relative mx-auto grid w-full max-w-7xl gap-12 px-5 pb-12 pt-20 sm:px-8 lg:grid-cols-[1fr_1.5fr]">
      <div className="max-w-sm"><Link to="/" className="inline-flex shrink-0 items-center gap-3 text-xl font-extrabold tracking-tight text-primary-900 no-underline">{logo ? <img src={logo} alt="" aria-hidden="true" className="max-h-12 brightness-0 invert" /> : siteName}</Link><p className="mt-5 max-w-xs text-sm leading-7 text-blue-100">{t('common.footerTagline')}</p>{footer.social_links && Object.keys(footer.social_links).length > 0 && <div className="mt-6 flex flex-wrap gap-3">{Object.entries(footer.social_links).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition-colors hover:bg-white/20" data-platform={platform} aria-label={platform}><Icon name={platform} /></a>)}</div>}</div>
      <div className="grid gap-10 sm:grid-cols-2">
        <div className="grid content-start gap-8 sm:grid-cols-2">
          {footer.community_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.community')}</h4><div className="grid content-start gap-3">{footer.community_links.filter((item) => item.path !== '/about' && item.path !== '/classroom').map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
        </div>
        <div className="grid content-start gap-8 sm:grid-cols-2">
          {footer.quick_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.quickLinks')}</h4><div className="grid content-start gap-3">{footer.quick_links.filter((item) => !['/','/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
          {footer.resource_links?.length > 0 && <section><h4 className="mb-5 text-sm font-bold uppercase tracking-wider text-white">{t('common.resources')}</h4><div className="grid content-start gap-3">{footer.resource_links.filter((item) => !['/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="w-fit text-sm text-blue-100 no-underline transition-colors hover:text-white hover:underline">{item.label}</Link>)}</div></section>}
        </div>
      </div>
    </div><div className="relative mx-auto flex w-full max-w-7xl flex-col gap-4 border-t border-white/15 px-5 py-6 text-sm text-blue-100 sm:px-8 md:flex-row md:items-center md:justify-between"><p className="m-0">&copy; {new Date().getFullYear()} AliverBiopharm. All rights reserved.</p><nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Legal and company links"><Link to="/privacy" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.privacy')}</Link><Link to="/terms" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.terms')}</Link><Link to="/about" className="text-blue-100 no-underline hover:text-white hover:underline">{t('common.about')}</Link></nav></div></footer>}
  </div>;
}
