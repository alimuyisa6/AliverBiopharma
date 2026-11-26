import React, { useState, useEffect } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getInfoSection, getAllSiteSections } from '../api/client';
import Spinner from '../components/Spinner/Spinner';
import { UI } from '../design-system';

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  }
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.3
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#039;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getCategoryLabel(category) {
  const map = {
    biology: 'Biology',
    pharmacy: 'Pharmacy',
    safety: 'Safety',
    study: 'Study Guide',
    exam: 'Exam Prep',
    clinical: 'Clinical Practice',
    calculations: 'Calculations',
    general: 'Resource'
  };
  return map[category] || 'Resource';
}

export default function InfoPage() {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const [section, setSection] = useState(null);
  const [siteSections, setSiteSections] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');


  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    getAllSiteSections().then(setSiteSections).catch(() => {});
  }, []);

  useEffect(() => {
    if (!slug) {
      setError('not_found');
      setLoading(false);
      return;
    }
    getInfoSection(slug)
      .then(data => {
        setSection(data);
        document.title = data?.title || slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      })
      .catch(err => {
        console.error('[InfoPage] Fetch error:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const navLinks = siteSections?.navigation?.links || [{ href: '/', label: 'Home' }];

  const header = (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white shadow-sm" id="site-header">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <Link to="/" className="shrink-0 text-lg font-extrabold tracking-tight text-primary-900 no-underline" aria-label="AliverBiopharm Home">
          {siteSections?.site_config?.logo_url ? <img src={siteSections.site_config.logo_url} alt="AliverBiopharm" className="h-14 w-auto object-contain" /> : 'AliverBiopharm'}
        </Link>
        <nav aria-label="Main navigation" className="hidden lg:block"><ul className="flex items-center gap-5">{navLinks.map((link) => <li key={link.href}>{link.href.startsWith('#') || link.href.startsWith('http') ? <a className="text-sm font-semibold text-slate-700 no-underline transition hover:text-primary-800" href={link.href}>{link.label}</a> : <Link className="text-sm font-semibold text-slate-700 no-underline transition hover:text-primary-800" to={link.href}>{link.label}</Link>}</li>)}</ul></nav>
        <div className="flex items-center gap-2">
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-primary-800 hover:bg-primary-50" onClick={() => { const dark = document.body.classList.toggle('dark-mode'); localStorage.setItem('theme', dark ? 'dark' : 'light'); setTheme(dark ? 'dark' : 'light'); }} aria-label="Toggle dark mode"><i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" /></button>
          <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-white text-primary-800 hover:bg-primary-50 lg:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Open menu" aria-expanded={mobileMenuOpen}><i className="fa-solid fa-bars" aria-hidden="true" /></button>
        </div>
      </div>
    </header>
  );

  const mobileNav = (
    <div className={`fixed inset-0 z-50 lg:hidden ${mobileMenuOpen ? 'visible' : 'invisible pointer-events-none'}`} aria-hidden={!mobileMenuOpen}>
      <button type="button" className={`absolute inset-0 h-full w-full bg-slate-950/50 transition-opacity ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation" />
      <aside className={`absolute right-0 top-0 flex h-full w-[min(88vw,360px)] flex-col bg-white p-5 shadow-2xl transition-transform ${mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex items-center justify-between border-b border-border pb-4"><strong className="text-lg font-extrabold text-primary-900">Navigation</strong><button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border text-primary-800 hover:bg-primary-50" onClick={() => setMobileMenuOpen(false)} aria-label="Close menu"><i className="fa-solid fa-xmark" aria-hidden="true" /></button></div>
        <nav className="grid content-start gap-2 py-5" aria-label="Mobile navigation">{navLinks.map((link) => link.href.startsWith('#') || link.href.startsWith('http') ? <a key={link.href} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary-900 no-underline hover:bg-primary-50" href={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</a> : <Link key={link.href} className="rounded-xl px-4 py-3 text-sm font-semibold text-primary-900 no-underline hover:bg-primary-50" to={link.href} onClick={() => setMobileMenuOpen(false)}>{link.label}</Link>)}</nav>
      </aside>
    </div>
  );

  if (loading) {
    return (
      <motion.div
        className="min-h-screen bg-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {header}
        {mobileNav}
        <main className="flex min-h-[60vh] items-center justify-center gap-3 bg-primary-50 px-4 py-16 text-sm font-semibold text-muted" aria-busy="true"><Spinner size="lg" />Loading content...</main>
      </motion.div>
    );
  }

  if (error === 'not_found' || !section || !section.title) {
    return (
      <motion.div
        className="min-h-screen bg-background"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {header}
        {mobileNav}
        <main className="grid min-h-[60vh] justify-items-center content-center gap-4 bg-primary-50 px-4 py-16 text-center"><i className="fa-solid fa-file-circle-question text-4xl text-primary-700" aria-hidden="true" /><h2 className="text-2xl font-extrabold text-primary-900">Section Not Found</h2><p className="text-sm leading-7 text-muted">This page doesn't exist or has been moved.</p><Link to="/" className={UI.primaryButton}><i className="fa-solid fa-house" aria-hidden="true" /> Back to Home</Link></main>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        className="min-h-screen bg-background"
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
      >
        {header}
        {mobileNav}
        <main className="grid min-h-[60vh] justify-items-center content-center gap-4 bg-primary-50 px-4 py-16 text-center"><i className="fa-solid fa-circle-exclamation text-4xl text-red-700" aria-hidden="true" /><h2 className="text-2xl font-extrabold text-primary-900">Something Went Wrong</h2><p className="text-sm leading-7 text-muted">Please try refreshing the page or come back later.</p><Link to="/" className={UI.primaryButton}><i className="fa-solid fa-rotate-right" aria-hidden="true" /> Try Again</Link></main>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      {header}
      {mobileNav}
      <article className="w-full bg-primary-50">
        <div className="mx-auto grid w-full max-w-5xl gap-7 px-4 py-8 sm:px-6 sm:py-12">
          <Link to="/" className="inline-flex min-h-10 w-fit items-center gap-2 text-sm font-bold text-primary-800 no-underline hover:text-primary-950" aria-label="Back to home">
            <i className="fa-solid fa-arrow-left" aria-hidden="true" />
            Back to Home
          </Link>
          <header className="grid gap-4 border-b border-border pb-7">
            
            <h1 className="text-3xl font-extrabold leading-tight text-primary-900 sm:text-4xl">{escapeHtml(section.title)}</h1>
            {section.description && (
              <p className="text-base leading-7 text-muted">{escapeHtml(section.description)}</p>
            )}
          </header>
          <div className="grid gap-6 rounded-2xl border border-border bg-white p-5 sm:p-8">
            <ContentBlocks blocks={section.content || []} />
          </div>
          <nav className="flex justify-start border-t border-border pt-5">
            <Link to="/" className={UI.primaryButton}>
              <i className="fa-solid fa-arrow-left" aria-hidden="true" />
              All Resources
            </Link>
          </nav>
        </div>
      </article>
    </motion.div>
  );
}

function ContentBlocks({ blocks }) {
  if (!blocks || !blocks.length) {
    return (
      <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-primary-50 px-5 py-10 text-center">
        <i className="fa-solid fa-file-lines text-2xl text-primary-700" aria-hidden="true" />
        <p>Content coming soon.</p>
      </div>
    );
  }

  return blocks.map((block, i) => {
    switch (block.type) {
      case 'heading':
        return <h2 key={i} className="border-b border-border pb-3 text-2xl font-extrabold text-primary-900">{escapeHtml(block.text || '')}</h2>;

      case 'text':
        return (
          <div key={i} className="grid gap-2 border-b border-border pb-5 last:border-0">
            {block.heading && <h3 className="text-lg font-bold text-primary-900">{escapeHtml(block.heading)}</h3>}
            <p className="text-sm leading-7 text-slate-700">{escapeHtml(block.body || '')}</p>
          </div>
        );

      case 'image':
        return (
          <figure key={i} className="grid gap-2">
            <img src={escapeAttr(block.src || '')} alt={escapeAttr(block.alt || 'Image')} loading="lazy" className="max-h-[520px] w-full rounded-2xl bg-primary-50 object-contain" />
            {block.caption && <figcaption className="text-xs leading-5 text-muted">{escapeHtml(block.caption)}</figcaption>}
          </figure>
        );

      case 'callout': {
        const variant = block.variant || 'info';
        const iconMap = { tip: 'fa-lightbulb', warning: 'fa-triangle-exclamation', info: 'fa-circle-info', danger: 'fa-skull', success: 'fa-circle-info' };
        return (
          <div key={i} className={`flex items-start gap-3 rounded-xl border p-4 ${variant === 'warning' ? 'border-amber-200 bg-amber-50 text-amber-900' : variant === 'danger' ? 'border-red-200 bg-red-50 text-red-900' : variant === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : variant === 'tip' ? 'border-secondary-200 bg-secondary-50 text-secondary-900' : 'border-primary-200 bg-primary-50 text-primary-900'}`}>
            <i className={`fa-solid ${iconMap[variant] || 'fa-circle-info'} mt-0.5 shrink-0`} aria-hidden="true" />
            <div>
              {block.heading && <strong>{escapeHtml(block.heading)}</strong>}
              <p>{escapeHtml(block.body || '')}</p>
            </div>
          </div>
        );
      }

      case 'list':
        return (
          <ul key={i} className="grid gap-3">
            {(block.items || []).map((item, j) => (
              <li key={j} className="flex items-start gap-3 text-sm leading-7 text-slate-700"><i className="fa-solid fa-circle mt-2 shrink-0 text-[7px] text-secondary-600" aria-hidden="true" /><span>{escapeHtml(item)}</span></li>
            ))}
          </ul>
        );

      case 'table': {
        if (!block.rows || !block.rows.length) return null;
        const headers = block.headers || [];
        return (
          <div key={i} className="w-full overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full border-collapse text-left text-sm">
              {headers.length > 0 && (
                <thead>
                  <tr>{headers.map((h, j) => <th key={j} className="border-b border-border bg-primary-50 px-4 py-3 font-bold text-primary-900">{escapeHtml(h)}</th>)}</tr>
                </thead>
              )}
              <tbody>
                {block.rows.map((row, ri) => (
                  <tr key={ri}>
                    {(Array.isArray(row) ? row : []).map((cell, ci) => (
                      <td key={ci} className="border-b border-border px-4 py-3 text-slate-700 last:border-0">{escapeHtml(String(cell))}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return null;
    }
  });
}
