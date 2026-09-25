/* src/components/Layout/Layout.jsx */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon/Icon';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { signout } from '../../api/client';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import AdminLauncher from '../AdminLauncher';
import NetworkStatus from '../NetworkStatus/NetworkStatus';
import NotificationCenter from '../NotificationCenter/NotificationCenter';
import ClassSwitcher from '../ClassSwitcher/ClassSwitcher';

const EXCLUDED_PATHS = ['/login', '/register'];
const SCROLL_STORAGE_KEY = 'scroll-positions';
const NO_CHROME_PATHS = ['/recall', '/quiz', '/profile', '/notes', '/past-papers'];
const NO_FOOTER_PATHS = ['/advertise', '/advertise/create', '/advertise/payment', '/tutors'];

function loadScrollMap() { try { return new Map(JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) || '[]')); } catch { return new Map(); } }
function persistScrollMap(map) { try { sessionStorage.setItem(SCROLL_STORAGE_KEY, JSON.stringify([...map.entries()])); } catch {} }

function MenuGlyph({ isOpen }) {
  return (
    <svg className="header-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path className="menu-line menu-line-top" d="M4 7h16" />
      <path className="menu-line menu-line-middle" d="M4 12h10" />
      <path className="menu-line menu-line-bottom" d="M4 17h16" />
    </svg>
  );
}

function SearchGlyph() {
  return (
    <svg className="header-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.8" cy="10.8" r="5.8" />
      <path d="m15.2 15.2 4.4 4.4" />
    </svg>
  );
}

function ThemeGlyph({ isDark }) {
  return isDark ? (
    <svg className="header-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M20 15.4A8.2 8.2 0 0 1 8.6 4a8.2 8.2 0 1 0 11.4 11.4Z" />
    </svg>
  ) : (
    <svg className="header-glyph" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
  useLayoutEffect(() => { const restore = () => { if (navigationType === 'POP' && scrollPositions.current.has(routeKey)) window.scrollTo(0, scrollPositions.current.get(routeKey)); else window.scrollTo(0, 0); }; restore(); const raf = requestAnimationFrame(restore); return () => cancelAnimationFrame(raf); }, [routeKey, navigationType]);
  useEffect(() => { setMobileOpen(false); setSearchOpen(false); }, [location.pathname]);
  const handleSignout = async () => { setSigningOut(true); try { await signout(); await refreshUser(); navigate('/'); } catch { navigate('/'); } finally { setSigningOut(false); } };
  const blockedHeaderPaths = ['/about', '/classroom', '/blog', '/contact', '/notes', '/quiz', '/flashcards', '/past-papers', '/recall', '/pdfs', '/glossary'];
  const filteredNavigation = navigation.filter((link) => { if (blockedHeaderPaths.includes(link.href)) return false; if (link.href === '/quiz' && features.quizzes === false) return false; if (link.href === '/flashcards' && features.flashcards === false) return false; if (link.href === '/past-papers' && features.past_papers === false) return false; if (link.href === '/recall' && features.recall === false) return false; if (link.href === '/classroom' && features.classrooms === false) return false; return true; });
  const loginButton = uiMap.login_button || { label: 'Sign In', variant: 'outline', color: 'primary', icon: 'right-to-bracket' }, signupButton = uiMap.signup_button || { label: 'Sign Up', variant: 'solid', color: 'primary', icon: 'user-plus' }, isDarkTheme = theme === 'dark';
  return <div className="app-layout">
    <NetworkStatus />
    {!hideHeader && <header className={`site-header${scrolled ? ' scrolled' : ''}`}><div className="header-container">
      <Link to="/" className="header-logo">{logo ? <img src={logo} alt={siteName} /> : siteName}</Link>
      <nav className="main-nav">{filteredNavigation.map((link) => <Link key={link.href} to={link.href} className={`main-nav-link${location.pathname === link.href ? ' active' : ''}`}>{link.icon && <Icon name={link.icon} />}{link.label}</Link>)}</nav>
      <div className="nav-actions">
        {isAuthenticated && <ClassSwitcher />}
        <button className="btn btn-ghost btn-sm btn-icon header-action-button" onClick={() => setSearchOpen(true)} aria-label={t('common.search')} type="button"><SearchGlyph /></button>
        <NotificationCenter />
        <button className="btn btn-ghost btn-sm btn-icon header-action-button" onClick={toggleTheme} aria-label={t('common.toggleTheme')} type="button"><ThemeGlyph isDark={isDarkTheme} /></button>
        <button className="hamburger-btn header-action-button" style={{ color: 'var(--text-main)', width: 'var(--space-12)', height: 'var(--space-12)' }} onClick={() => setMobileOpen((prev) => !prev)} aria-label={mobileOpen ? t('common.closeMenu') : t('common.menu')} aria-expanded={mobileOpen} type="button"><MenuGlyph isOpen={mobileOpen} /></button>
      </div>
    </div></header>}
    {!hideHeader && <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />}<AdminLauncher />
    <AnimatePresence>{mobileOpen && <><div className="mobile-nav-overlay" onClick={() => setMobileOpen(false)} /><motion.div className="mobile-nav-panel" initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.25 }}><div className="mobile-nav-panel-inner">
      {filteredNavigation.map((link) => <Link key={link.href} to={link.href} className="mobile-nav-link" onClick={() => setMobileOpen(false)}>{link.icon && <Icon name={link.icon} />}{link.label}</Link>)}<div className="dropdown-divider" />
      {isAuthenticated ? <><Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}><Icon name="house" />{t('common.home')}</Link><Link to="/dashboard" className="mobile-nav-link" onClick={() => setMobileOpen(false)}><Icon name="gauge-high" />{t('common.dashboard')}</Link><Link to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}><Icon name="gear" />{t('common.profile')}</Link><button className="mobile-nav-link" onClick={handleSignout} disabled={signingOut} type="button"><Icon name="right-from-bracket" />{signingOut ? t('common.signingOut') : t('common.signOut')}</button></> : <><Link to="/" className="mobile-nav-link" onClick={() => setMobileOpen(false)}><Icon name="house" />Home</Link><Link to="/login" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>{loginButton.icon && <Icon name={loginButton.icon} />}{loginButton.label}</Link><Link to="/register" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>{signupButton.icon && <Icon name={signupButton.icon} />}{signupButton.label}</Link></>}
    </div></motion.div></>}</AnimatePresence>
    <motion.main id="main-content" className="main-content" key={routeKey} initial={navigationType === 'POP' ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{children}</motion.main>
    {!hideFooter && showFooter && <footer className="footer"><div className="footer-wave" aria-hidden="true"><svg viewBox="0 0 1440 120" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0,64 C240,120 480,0 720,32 C960,64 1200,112 1440,48 L1440,120 L0,120 Z" className="footer-wave-path" /></svg></div><div className="footer-inner">
      <div className="footer-brand"><Link to="/" className="header-logo">{logo ? <img src={logo} alt={siteName} className="footer-logo" /> : siteName}</Link><p className="footer-tagline">{t('common.footerTagline')}</p>{footer.social_links && Object.keys(footer.social_links).length > 0 && <div className="footer-social">{Object.entries(footer.social_links).map(([platform, url]) => <a key={platform} href={url} target="_blank" rel="noopener noreferrer" className="footer-social-link" data-platform={platform} aria-label={platform}><Icon name={platform} /></a>)}</div>}</div>
      {footer.quick_links?.length > 0 && <div><h4 className="footer-heading">{t('common.quickLinks')}</h4><div className="footer-links">{footer.quick_links.filter((item) => !['/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="footer-link">{item.label}</Link>)}</div></div>}
      {footer.resource_links?.length > 0 && <div><h4 className="footer-heading">{t('common.resources')}</h4><div className="footer-links">{footer.resource_links.filter((item) => !['/about','/classroom','/notes','/quiz','/flashcards','/past-papers','/recall','/pdfs','/glossary'].includes(item.path)).map((item, index) => <Link key={index} to={item.path} className="footer-link">{item.label}</Link>)}</div></div>}
      {footer.community_links?.length > 0 && <div><h4 className="footer-heading">{t('common.community')}</h4><div className="footer-links">{footer.community_links.filter((item) => item.path !== '/about' && item.path !== '/classroom').map((item, index) => <Link key={index} to={item.path} className="footer-link">{item.label}</Link>)}</div></div>}
    </div><div className="footer-bottom"><p className="footer-copyright">&copy; {new Date().getFullYear()} AliverBiopharm. All rights reserved.</p><nav className="footer-bottom-nav"><Link to="/privacy" className="footer-bottom-link">{t('common.privacy')}</Link><Link to="/terms" className="footer-bottom-link">{t('common.terms')}</Link><Link to="/about" className="footer-bottom-link">{t('common.about')}</Link></nav></div></footer>}
  </div>;
}
