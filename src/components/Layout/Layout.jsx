 /* src/components/Layout/Layout.jsx */

import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import { Link, useLocation, useNavigate, useNavigationType } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Icon from '../Icon/Icon';
import { useLayout } from '../../contexts/LayoutContext';
import { useAuth } from '../../contexts/AuthContext';
import { signout } from '../../api/client';
import SearchOverlay from '../SearchOverlay/SearchOverlay';
import AdminLauncher from '../AdminLauncher';
import NetworkStatus from '../NetworkStatus/NetworkStatus';

const EXCLUDED_PATHS = ['/login', '/register'];
const SCROLL_STORAGE_KEY = 'scroll-positions';
const NO_CHROME_PATHS = ['/recall', '/quiz', '/profile', '/notes', '/past-papers'];

/*
 * Advertising pages intentionally render without
 * the global site footer.
 *
 * This keeps the advertising flow focused on campaign
 * creation and payment without unrelated site navigation.
 */
const NO_FOOTER_PATHS = [
  '/advertise',
  '/advertise/create',
  '/advertise/payment'
];

function loadScrollMap() {
  try {
    return new Map(
      JSON.parse(sessionStorage.getItem(SCROLL_STORAGE_KEY) || '[]')
    );
  } catch {
    return new Map();
  }
}

function persistScrollMap(map) {
  try {
    sessionStorage.setItem(
      SCROLL_STORAGE_KEY,
      JSON.stringify([...map.entries()])
    );
  } catch {}
}

function HamburgerGlyph({ size = 30 }) {
  const barThickness = Math.round(size * 0.13);
  const fullWidth = size;
  const halfWidth = Math.round(size * 0.5);

  return (
    <span
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Math.round(size * 0.18) + 'px',
        width: size + 'px',
        height: size + 'px'
      }}
    >
      <span
        style={{
          display: 'block',
          width: fullWidth + 'px',
          height: barThickness + 'px',
          background: '#000',
          borderRadius: barThickness + 'px'
        }}
      />
      <span
        style={{
          display: 'block',
          width: halfWidth + 'px',
          height: barThickness + 'px',
          background: '#000',
          borderRadius: barThickness + 'px'
        }}
      />
      <span
        style={{
          display: 'block',
          width: fullWidth + 'px',
          height: barThickness + 'px',
          background: '#000',
          borderRadius: barThickness + 'px'
        }}
      />
    </span>
  );
}

function SearchGlyph({ size = 28 }) {
  const ringSize = Math.round(size * 0.62);
  const ringThickness = Math.round(size * 0.15);
  const handleLength = Math.round(size * 0.4);
  const handleThickness = Math.round(size * 0.15);

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size + 'px',
        height: size + 'px'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: ringSize + 'px',
          height: ringSize + 'px',
          border: `${ringThickness}px solid #000`,
          borderRadius: '50%',
          boxSizing: 'border-box'
        }}
      />
      <span
        style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: handleThickness + 'px',
          height: handleLength + 'px',
          background: '#000',
          borderRadius: handleThickness + 'px',
          transform: 'rotate(45deg)',
          transformOrigin: 'bottom right'
        }}
      />
    </span>
  );
}

function ThemeGlyph({ size = 28, isDark }) {
  const coreSize = Math.round(size * 0.5);
  const rayThickness = Math.round(size * 0.14);
  const rayLength = size;
  const offset = Math.round((size - coreSize) / 2);
  const rayOffset = Math.round((size - rayThickness) / 2);

  if (isDark) {
    return (
      <span
        style={{
          display: 'inline-block',
          width: size + 'px',
          height: size + 'px',
          borderRadius: '50%',
          background: '#000'
        }}
      />
    );
  }

  return (
    <span
      style={{
        position: 'relative',
        display: 'inline-block',
        width: size + 'px',
        height: size + 'px'
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: rayOffset + 'px',
          left: 0,
          width: rayLength + 'px',
          height: rayThickness + 'px',
          background: '#000',
          borderRadius: rayThickness + 'px',
          transform: 'rotate(0deg)'
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: rayOffset + 'px',
          left: 0,
          width: rayLength + 'px',
          height: rayThickness + 'px',
          background: '#000',
          borderRadius: rayThickness + 'px',
          transform: 'rotate(45deg)'
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: rayOffset + 'px',
          left: 0,
          width: rayLength + 'px',
          height: rayThickness + 'px',
          background: '#000',
          borderRadius: rayThickness + 'px',
          transform: 'rotate(90deg)'
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: rayOffset + 'px',
          left: 0,
          width: rayLength + 'px',
          height: rayThickness + 'px',
          background: '#000',
          borderRadius: rayThickness + 'px',
          transform: 'rotate(135deg)'
        }}
      />
      <span
        style={{
          position: 'absolute',
          top: offset + 'px',
          left: offset + 'px',
          width: coreSize + 'px',
          height: coreSize + 'px',
          borderRadius: '50%',
          background: '#000'
        }}
      />
    </span>
  );
}

export default function Layout({ children, showFooter = true }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const navigationType = useNavigationType();

  const {
    logo,
    siteName,
    navigation,
    footer,
    theme,
    toggleTheme,
    isAuthenticated,
    refreshUser,
    features,
    uiMap
  } = useLayout();

  const { user } = useAuth();

  const isAuthPage = EXCLUDED_PATHS.includes(location.pathname);
  const isNoteDetailPage = location.pathname.startsWith('/notes/read');
  const isRoomPage = location.pathname.startsWith('/classroom/');

  const isNoChromePage = NO_CHROME_PATHS.some((path) =>
    location.pathname.startsWith(path)
  );

  const isNoFooterPage = NO_FOOTER_PATHS.some((path) =>
    location.pathname === path
  );

  const hideHeader =
    isAuthPage || isNoteDetailPage || isNoChromePage;

  const hideFooter =
    isAuthPage ||
    isRoomPage ||
    isNoteDetailPage ||
    isNoChromePage ||
    isNoFooterPage;

  const scrollPositions = useRef(loadScrollMap());
  const persistTimeout = useRef(null);
  const routeKey = location.key || 'default';

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  useEffect(() => {
    const handler = () => {
      setScrolled(window.scrollY > 10);

      scrollPositions.current.set(
        routeKey,
        window.scrollY
      );

      clearTimeout(persistTimeout.current);

      persistTimeout.current = setTimeout(() => {
        persistScrollMap(scrollPositions.current);
      }, 200);
    };

    window.addEventListener('scroll', handler, {
      passive: true
    });

    return () => {
      window.removeEventListener('scroll', handler);
      clearTimeout(persistTimeout.current);
    };
  }, [routeKey]);

  useLayoutEffect(() => {
    const restore = () => {
      if (
        navigationType === 'POP' &&
        scrollPositions.current.has(routeKey)
      ) {
        window.scrollTo(
          0,
          scrollPositions.current.get(routeKey)
        );
      } else {
        window.scrollTo(0, 0);
      }
    };

    restore();

    const raf = requestAnimationFrame(restore);

    return () => cancelAnimationFrame(raf);
  }, [routeKey, navigationType]);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  const handleSignout = async () => {
    setSigningOut(true);

    try {
      await signout();
      await refreshUser();

      // After signing out, return to the public Home page.
      navigate('/');
    } catch {
      navigate('/');
    } finally {
      setSigningOut(false);
    }
  };

  /*
   * Navigation policy
   * -----------------
   *
   * The curriculum is already exposed through dedicated
   * content-type cards on the platform.
   *
   * Therefore curriculum resources should NOT be duplicated
   * in the global header or footer.
   *
   * The following are intentionally excluded:
   *
   * - About from the header
   * - Classroom from the header
   * - Blog from the header
   * - Contact from the header
   * - Notes
   * - Quizzes
   * - Flashcards
   * - Past Papers
   * - Recall
   * - PDFs
   * - Glossary
   *
   * About is retained only in the bottom footer navigation.
   */

  const blockedHeaderPaths = [
    '/about',
    '/classroom',
    '/blog',
    '/contact',
    '/notes',
    '/quiz',
    '/flashcards',
    '/past-papers',
    '/recall',
    '/pdfs',
    '/glossary'
  ];

  const filteredNavigation = navigation.filter((link) => {
    if (blockedHeaderPaths.includes(link.href)) {
      return false;
    }

    if (
      link.href === '/quiz' &&
      features.quizzes === false
    ) {
      return false;
    }

    if (
      link.href === '/flashcards' &&
      features.flashcards === false
    ) {
      return false;
    }

    if (
      link.href === '/past-papers' &&
      features.past_papers === false
    ) {
      return false;
    }

    if (
      link.href === '/recall' &&
      features.recall === false
    ) {
      return false;
    }

    if (
      link.href === '/classroom' &&
      features.classrooms === false
    ) {
      return false;
    }

    return true;
  });

  const loginButton =
    uiMap.login_button || {
      label: 'Sign In',
      variant: 'outline',
      color: 'primary',
      icon: 'right-to-bracket'
    };

  const signupButton =
    uiMap.signup_button || {
      label: 'Sign Up',
      variant: 'solid',
      color: 'primary',
      icon: 'user-plus'
    };

  const isDarkTheme = theme === 'dark';

  return (
    <div className="app-layout">
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>

      <NetworkStatus />

      {!hideHeader && (
        <header
          className={`site-header${
            scrolled ? ' scrolled' : ''
          }`}
        >
          <div className="header-container">
            <Link
              to="/"
              className="header-logo"
            >
              {logo ? (
                <img
                  src={logo}
                  alt={siteName}
                />
              ) : (
                siteName
              )}
            </Link>

            <nav className="main-nav">
              {filteredNavigation.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`main-nav-link${
                    location.pathname === link.href
                      ? ' active'
                      : ''
                  }`}
                >
                  {link.icon && (
                    <Icon name={link.icon} />
                  )}

                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="nav-actions">
              {/* Large, clean search control */}
              <button
                className="btn btn-ghost btn-sm btn-icon header-action-button"
                onClick={() =>
                  setSearchOpen(true)
                }
                aria-label="Search"
                type="button"
              >
                <SearchGlyph size={28} />
              </button>

              {/* Large, clean theme control */}
              <button
                className="btn btn-ghost btn-sm btn-icon header-action-button"
                onClick={toggleTheme}
                aria-label="Toggle theme"
                type="button"
              >
                <ThemeGlyph size={28} isDark={isDarkTheme} />
              </button>

              {/* Large, clean hamburger control */}
              <button
                className="hamburger-btn header-action-button"
                onClick={() =>
                  setMobileOpen(true)
                }
                aria-label="Menu"
                type="button"
              >
                <HamburgerGlyph size={30} />
              </button>
            </div>
          </div>
        </header>
      )}

      <SearchOverlay
        open={searchOpen}
        onClose={() =>
          setSearchOpen(false)
        }
      />

      <AdminLauncher />

      <AnimatePresence>
        {mobileOpen && (
          <>
            <div
              className="mobile-nav-overlay"
              onClick={() =>
                setMobileOpen(false)
              }
            />

            <motion.div
              className="mobile-nav-panel"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{
                duration: 0.25
              }}
            >
              <div className="mobile-nav-panel-inner">

                {/*
                 * Mobile navigation uses the same filtered
                 * navigation as the desktop header.
                 *
                 * This prevents old/stale configuration from
                 * reintroducing curriculum links, About, or
                 * Classroom into the mobile menu.
                 */}

                {filteredNavigation.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="mobile-nav-link"
                    onClick={() =>
                      setMobileOpen(false)
                    }
                  >
                    {link.icon && (
                      <Icon name={link.icon} />
                    )}

                    {link.label}
                  </Link>
                ))}

                <div className="dropdown-divider" />

                {isAuthenticated ? (
                  <>
                    <Link
                      to="/"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      <Icon name="house" />
                      Home
                    </Link>

                    <Link
                      to="/dashboard"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      <Icon name="gauge-high" />
                      Dashboard
                    </Link>

                    <Link
                      to="/profile"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      <Icon name="gear" />
                      Profile
                    </Link>

                    <button
                      className="mobile-nav-link"
                      onClick={handleSignout}
                      disabled={signingOut}
                      type="button"
                    >
                      <Icon name="right-from-bracket" />

                      {signingOut
                        ? 'Signing out...'
                        : 'Sign Out'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      <Icon name="house" />
                      Home
                    </Link>

                    <Link
                      to="/login"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      {loginButton.icon && (
                        <Icon
                          name={loginButton.icon}
                        />
                      )}

                      {loginButton.label}
                    </Link>

                    <Link
                      to="/register"
                      className="mobile-nav-link"
                      onClick={() =>
                        setMobileOpen(false)
                      }
                    >
                      {signupButton.icon && (
                        <Icon
                          name={signupButton.icon}
                        />
                      )}

                      {signupButton.label}
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <motion.main
        id="main-content"
        key={routeKey}
        initial={
          navigationType === 'POP'
            ? false
            : {
                opacity: 0,
                y: 20
              }
        }
        animate={{
          opacity: 1,
          y: 0
        }}
        transition={{
          duration: 0.3
        }}
      >
        {children}
      </motion.main>

      {!hideFooter &&
        showFooter && (
          <footer className="footer">
            <div
              className="footer-wave"
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 1440 120"
                preserveAspectRatio="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0,64 C240,120 480,0 720,32 C960,64 1200,112 1440,48 L1440,120 L0,120 Z"
                  className="footer-wave-path"
                />
              </svg>
            </div>

            <div className="footer-inner">
              <div className="footer-brand">
                <Link
                  to="/"
                  className="header-logo"
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={siteName}
                      className="footer-logo"
                    />
                  ) : (
                    siteName
                  )}
                </Link>

                <p className="footer-tagline">
                  Advancing biology and pharmacy education
                  for every learner.
                </p>

                {footer.social_links &&
                  Object.keys(
                    footer.social_links
                  ).length > 0 && (
                    <div className="footer-social">
                      {Object.entries(
                        footer.social_links
                      ).map(
                        ([platform, url]) => (
                          <a
                            key={platform}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="footer-social-link"
                            data-platform={
                              platform
                            }
                            aria-label={
                              platform
                            }
                          >
                            <Icon
                              name={platform}
                            />
                          </a>
                        )
                      )}
                    </div>
                  )}
              </div>

              {footer.quick_links?.length > 0 && (
                <div>
                  <h4 className="footer-heading">
                    Quick Links
                  </h4>

                  <div className="footer-links">
                    {footer.quick_links
                      .filter(
                        (item) =>
                          item.path !==
                            '/about' &&
                          item.path !==
                            '/classroom' &&
                          item.path !==
                            '/notes' &&
                          item.path !==
                            '/quiz' &&
                          item.path !==
                            '/flashcards' &&
                          item.path !==
                            '/past-papers' &&
                          item.path !==
                            '/recall' &&
                          item.path !==
                            '/pdfs' &&
                          item.path !==
                            '/glossary'
                      )
                      .map(
                        (item, index) => (
                          <Link
                            key={index}
                            to={item.path}
                            className="footer-link"
                          >
                            {item.label}
                          </Link>
                        )
                      )}
                  </div>
                </div>
              )}

              {footer.resource_links?.length > 0 && (
                <div>
                  <h4 className="footer-heading">
                    Resources
                  </h4>

                  <div className="footer-links">
                    {footer.resource_links
                      .filter(
                        (item) =>
                          item.path !==
                            '/about' &&
                          item.path !==
                            '/classroom' &&
                          item.path !==
                            '/notes' &&
                          item.path !==
                            '/quiz' &&
                          item.path !==
                            '/flashcards' &&
                          item.path !==
                            '/past-papers' &&
                          item.path !==
                            '/recall' &&
                          item.path !==
                            '/pdfs' &&
                          item.path !==
                            '/glossary'
                      )
                      .map(
                        (item, index) => (
                          <Link
                            key={index}
                            to={item.path}
                            className="footer-link"
                          >
                            {item.label}
                          </Link>
                        )
                      )}
                  </div>
                </div>
              )}

              {footer.community_links?.length > 0 && (
                <div>
                  <h4 className="footer-heading">
                    Community
                  </h4>

                  <div className="footer-links">
                    {footer.community_links
                      .filter(
                        (item) =>
                          item.path !==
                            '/about' &&
                          item.path !==
                            '/classroom'
                      )
                      .map(
                        (item, index) => (
                          <Link
                            key={index}
                            to={item.path}
                            className="footer-link"
                          >
                            {item.label}
                          </Link>
                        )
                      )}
                  </div>
                </div>
              )}
            </div>

            <div className="footer-bottom">
              <p>
                &copy;{' '}
                {new Date().getFullYear()}{' '}
                {siteName}. All rights reserved.
              </p>

              <nav className="footer-bottom-nav">
                <Link
                  to="/privacy"
                  className="footer-link"
                >
                  Privacy
                </Link>

                <Link
                  to="/terms"
                  className="footer-link"
                >
                  Terms
                </Link>

                {/* About intentionally remains here only. */}
                <Link
                  to="/about"
                  className="footer-link"
                >
                  About
                </Link>
              </nav>
            </div>
          </footer>
        )}
    </div>
  );
}
