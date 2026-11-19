/* pages/FaqPage.jsx */
import { useState, useEffect } from 'react';
import { useLayout } from '../contexts/LayoutContext';
import { getSections } from '../api/sections';
import { FaqAccordion } from '../features/home/FaqAccordion';

export default function FaqPage() {
  const { level } = useLayout();
  const [sections, setSections] = useState({});

  useEffect(() => {
    if (level?.id) {
      getSections(level.id).then(setSections).catch(() => {});
    }
  }, [level]);

  return (
    <main className="faq-page-shell w-full bg-primary-50 px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <FaqAccordion data={sections?.faq} standalone />
      <style>{`
        .faq-page-shell .faq-explorer { width: min(100%, 1180px); margin: 0 auto; color: var(--text-primary, #172033); }
        .faq-page-shell .faq-hero { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) minmax(180px, 260px); align-items: center; gap: clamp(1.5rem, 4vw, 3.5rem); overflow: hidden; padding: clamp(1.5rem, 5vw, 3.5rem); border: 1px solid rgba(255,255,255,.22); border-radius: 28px; background: linear-gradient(125deg, var(--primary, #173b72), var(--secondary, #147f83)); color: #fff; box-shadow: 0 20px 50px rgba(18,50,88,.14); }
        .faq-page-shell .faq-hero:after { content: ''; position: absolute; width: 330px; height: 330px; right: -100px; top: -150px; border: 35px solid rgba(255,255,255,.08); border-radius: 50%; pointer-events: none; }
        .faq-page-shell .faq-hero-content { position: relative; z-index: 1; max-width: 740px; }
        .faq-page-shell .faq-eyebrow, .faq-page-shell .faq-section-eyebrow { display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .85rem; color: inherit; font-size: .75rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; opacity: .86; }
        .faq-page-shell .faq-hero-title { margin: 0; color: #fff; font-size: clamp(2.1rem, 5vw, 3.75rem); font-weight: 900; line-height: 1.08; letter-spacing: -.035em; text-wrap: balance; }
        .faq-page-shell .faq-hero-description { max-width: 58ch; margin: 1rem 0 1.5rem; color: rgba(255,255,255,.88); font-size: clamp(1rem, 1.5vw, 1.15rem); line-height: 1.7; }
        .faq-page-shell .faq-search { display: flex; align-items: center; gap: .75rem; max-width: 620px; padding: .45rem .65rem .45rem 1rem; border: 1px solid rgba(255,255,255,.28); border-radius: 16px; background: #fff; color: #1c2b40; box-shadow: 0 8px 24px rgba(4,20,48,.16); }
        .faq-page-shell .faq-search > i { color: var(--primary, #173b72); font-size: 1.15rem; flex: 0 0 auto; }
        .faq-page-shell .faq-search input { flex: 1; min-width: 0; border: 0; background: transparent; box-shadow: none; outline: none; padding: .65rem 0; }
        .faq-page-shell .faq-search input:focus { box-shadow: none; }
        .faq-page-shell .faq-search-clear { display: inline-flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 10px; background: #edf2f7; color: #334155; }
        .faq-page-shell .faq-illustration { overflow: hidden; border-radius: 22px; box-shadow: 0 16px 32px rgba(4,20,48,.16); }
        .faq-page-shell .faq-illustration-hero { position: relative !important; width: 100% !important; height: auto !important; max-width: 250px; aspect-ratio: 1; justify-self: end; border: 8px solid rgba(255,255,255,.18); }
        .faq-page-shell .faq-illustration-browse-topic { display: none !important; }
        .faq-page-shell .faq-section { margin-top: clamp(2rem, 5vw, 3.5rem); padding: clamp(1.25rem, 3vw, 2rem); border: 1px solid #e1e8f0; border-radius: 24px; background: #fff; box-shadow: 0 8px 26px rgba(18,50,88,.045); }
        .faq-page-shell .faq-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.5rem; }
        .faq-page-shell .faq-section-eyebrow { color: var(--primary, #173b72); margin-bottom: .45rem; }
        .faq-page-shell .faq-section-heading h2, .faq-page-shell .faq-questions-intro h2 { margin: 0; color: #14233a; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 850; line-height: 1.2; letter-spacing: -.025em; }
        .faq-page-shell .faq-result-count { display: inline-flex; padding: .45rem .8rem; border-radius: 999px; background: #edf5fb; color: #234c76; font-size: .82rem; font-weight: 750; white-space: nowrap; }
        .faq-page-shell .faq-category-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr)); gap: .85rem; }
        .faq-page-shell .faq-category { display: flex; align-items: center; gap: .9rem; width: 100%; min-height: 84px; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 16px; background: #fff; color: #1e293b; text-align: left; transition: border-color .18s ease, background .18s ease, transform .18s ease, box-shadow .18s ease; }
        .faq-page-shell .faq-category:hover { border-color: #a8c7e6; background: #f8fbff; transform: translateY(-2px); box-shadow: 0 8px 20px rgba(24,64,110,.07); }
        .faq-page-shell .faq-category.is-active { border-color: var(--primary, #173b72); background: #edf5ff; box-shadow: inset 0 0 0 1px var(--primary, #173b72); }
        .faq-page-shell .faq-category-icon, .faq-page-shell .faq-featured-mark, .faq-page-shell .faq-resource-icon { display: inline-flex; width: 2.8rem; height: 2.8rem; align-items: center; justify-content: center; flex: 0 0 auto; border-radius: 13px; background: #eaf2ff; color: #1c4e86; font-size: 1.15rem; }
        /* Keep FAQ icon glyphs visible even when global icon styles override them. */
        .faq-page-shell i[class*="fa-"] { display: inline-block; font-family: "Font Awesome 6 Free", "Font Awesome 5 Free", FontAwesome !important; font-style: normal !important; font-weight: 900 !important; line-height: 1 !important; opacity: 1 !important; visibility: visible !important; }
        .faq-page-shell .faq-category-icon, .faq-page-shell .faq-featured-mark, .faq-page-shell .faq-resource-icon, .faq-page-shell .faq-question-icon { color: #174b83 !important; background-color: #e4efff !important; border: 1px solid #c7dcf5; box-shadow: inset 0 0 0 1px rgba(255,255,255,.45); }
        .faq-page-shell .faq-category-icon i, .faq-page-shell .faq-featured-mark i, .faq-page-shell .faq-resource-icon i, .faq-page-shell .faq-question-icon i { color: #174b83 !important; font-size: 1.25rem !important; }
        .faq-page-shell .faq-category-icon.faq-tone-mint { color: #08665b !important; background-color: #d9f5ed !important; border-color: #a8e4d5; }
        .faq-page-shell .faq-category-icon.faq-tone-mint i { color: #08665b !important; }
        .faq-page-shell .faq-category-icon.faq-tone-amber { color: #854d0e !important; background-color: #fff0cc !important; border-color: #f4d38b; }
        .faq-page-shell .faq-category-icon.faq-tone-amber i { color: #854d0e !important; }
        .faq-page-shell .faq-category-icon.faq-tone-purple { color: #5b3696 !important; background-color: #eee5ff !important; border-color: #d5c1fa; }
        .faq-page-shell .faq-category-icon.faq-tone-purple i { color: #5b3696 !important; }
        .faq-page-shell .faq-category-icon.faq-tone-rose { color: #9a3150 !important; background-color: #ffe4ec !important; border-color: #f4bfd0; }
        .faq-page-shell .faq-category-icon.faq-tone-rose i { color: #9a3150 !important; }
        .faq-page-shell .faq-question-icon { width: 2.25rem; height: 2.25rem; flex: 0 0 auto; }
        .faq-page-shell .faq-search > i, .faq-page-shell .faq-search-clear i, .faq-page-shell .faq-featured-mark i, .faq-page-shell .faq-resource-arrow, .faq-page-shell .faq-support-button i, .faq-page-shell .faq-share-link i { opacity: 1 !important; visibility: visible !important; }
        .faq-page-shell .faq-category strong, .faq-page-shell .faq-resource strong { display: block; color: #172b46; font-size: .95rem; font-weight: 800; }
        .faq-page-shell .faq-category small, .faq-page-shell .faq-resource small { display: block; margin-top: .25rem; color: #64748b; font-size: .8rem; line-height: 1.4; }
        .faq-page-shell .faq-featured-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: .75rem; }
        .faq-page-shell .faq-featured-item { display: flex; align-items: center; gap: .8rem; padding: 1rem; border: 1px solid #e4eaf1; border-radius: 14px; background: #f8fafc; color: #1e334e; font-weight: 750; text-align: left; transition: .18s ease; }
        .faq-page-shell .faq-featured-item:hover { border-color: #b5cce6; background: #eff6ff; transform: translateY(-2px); }
        .faq-page-shell .faq-featured-mark { width: 2.25rem; height: 2.25rem; border-radius: 50%; background: #dcecff; }
        .faq-page-shell .faq-illustration-popular-questions, .faq-page-shell .faq-illustration-learning { display: none; }
        .faq-page-shell .faq-questions-layout { display: grid; grid-template-columns: minmax(220px, .75fr) minmax(0, 1.6fr); gap: clamp(1.25rem, 4vw, 3rem); align-items: start; }
        .faq-page-shell .faq-questions-intro { position: sticky; top: 1.25rem; }
        .faq-page-shell .faq-questions-intro p { margin: .75rem 0 0; color: #64748b; line-height: 1.65; }
        .faq-page-shell .faq-question-list { display: grid; gap: .7rem; }
        .faq-page-shell .faq-question-item { overflow: hidden; border: 1px solid #e1e8f0; border-radius: 16px; background: #fff; transition: border-color .18s ease, box-shadow .18s ease; }
        .faq-page-shell .faq-question-item.is-open { border-color: #b5cce6; box-shadow: 0 8px 22px rgba(24,64,110,.07); }
        .faq-page-shell .faq-question-trigger { display: grid; grid-template-columns: 2.25rem minmax(0,1fr) 2.25rem; align-items: center; gap: .85rem; width: 100%; padding: 1rem; background: transparent; color: #172b46; text-align: left; }
        .faq-page-shell .faq-question-number { display: inline-flex; align-items: center; justify-content: center; width: 2.25rem; height: 2.25rem; border-radius: 10px; background: #f0f5fa; color: #50708f; font-size: .78rem; font-weight: 850; }
        .faq-page-shell .faq-question-text { font-size: .98rem; font-weight: 780; line-height: 1.5; }
        .faq-page-shell .faq-question-icon { display: inline-flex; width: 2.25rem; height: 2.25rem; align-items: center; justify-content: center; border-radius: 50%; background: #eaf2ff; color: #1d4f88; }
        .faq-page-shell .faq-question-answer { padding: 0 1.25rem 1.25rem 4.3rem; color: #53657b; font-size: .95rem; line-height: 1.75; }
        .faq-page-shell .faq-question-answer p { margin: 0 0 .9rem; }
        .faq-page-shell .faq-tags { display: flex; flex-wrap: wrap; gap: .45rem; margin: .7rem 0; }
        .faq-page-shell .faq-tags span { padding: .25rem .65rem; border-radius: 999px; background: #eef4fa; color: #49637d; font-size: .75rem; font-weight: 700; }
        .faq-page-shell .faq-share-link { display: inline-flex; align-items: center; gap: .5rem; margin-top: .5rem; color: #1e5c96; font-size: .82rem; font-weight: 750; }
        .faq-page-shell .faq-share-link:hover { text-decoration: underline; }
        .faq-page-shell .faq-no-results { padding: 2rem; border: 1px dashed #cbd5e1; border-radius: 16px; background: #f8fafc; color: #64748b; text-align: center; }
        .faq-page-shell .faq-no-results h3 { margin: .5rem 0; color: #1e293b; font-size: 1.15rem; font-weight: 800; }
        .faq-page-shell .faq-reset { margin-top: .8rem; padding: .6rem 1rem; border-radius: 10px; background: var(--primary, #173b72); color: white; font-weight: 750; }
        .faq-page-shell .faq-resources-section .faq-resource-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: .8rem; }
        .faq-page-shell .faq-resource { display: flex; align-items: center; gap: .85rem; padding: 1rem; border: 1px solid #e2e8f0; border-radius: 15px; background: #f9fbfd; color: #1e293b; transition: .18s ease; }
        .faq-page-shell .faq-resource:hover { border-color: #b5cce6; background: #f0f7ff; transform: translateY(-2px); }
        .faq-page-shell .faq-resource-arrow { margin-left: auto; color: #63809b; }
        .faq-page-shell .faq-support-section { display: grid; grid-template-columns: minmax(0, 1fr) minmax(150px, 220px); align-items: center; gap: 2rem; margin-top: 2rem; padding: clamp(1.5rem, 4vw, 2.5rem); border-radius: 24px; background: linear-gradient(125deg, #122d53, #1d6680); color: white; }
        .faq-page-shell .faq-support-content h2 { margin: 0; color: #fff; font-size: clamp(1.4rem, 3vw, 2rem); font-weight: 850; }
        .faq-page-shell .faq-support-content p { max-width: 58ch; margin: .8rem 0 1.25rem; color: rgba(255,255,255,.82); line-height: 1.7; }
        .faq-page-shell .faq-support-button { display: inline-flex; align-items: center; gap: .65rem; min-height: 46px; padding: .7rem 1.1rem; border-radius: 12px; background: #fff; color: #163d67; font-weight: 800; box-shadow: 0 5px 15px rgba(0,0,0,.12); transition: transform .18s ease, background .18s ease; }
        .faq-page-shell .faq-support-button:hover { transform: translateY(-2px); background: #eaf4ff; }
        .faq-page-shell .faq-illustration-support { width: 100%; aspect-ratio: 1; border: 6px solid rgba(255,255,255,.14); border-radius: 50%; }
        @media (max-width: 760px) {
          .faq-page-shell .faq-hero { grid-template-columns: minmax(0,1fr); }
          .faq-page-shell .faq-illustration-hero { display: none; }
          .faq-page-shell .faq-questions-layout { grid-template-columns: minmax(0,1fr); }
          .faq-page-shell .faq-questions-intro { position: static; }
          .faq-page-shell .faq-section-heading { align-items: start; flex-direction: column; }
          .faq-page-shell .faq-support-section { grid-template-columns: minmax(0,1fr); }
          .faq-page-shell .faq-illustration-support { display: none; }
          .faq-page-shell .faq-question-answer { padding-left: 1rem; }
        }
        @media (max-width: 480px) {
          .faq-page-shell { padding-inline: .75rem; }
          .faq-page-shell .faq-hero, .faq-page-shell .faq-section, .faq-page-shell .faq-support-section { border-radius: 18px; padding: 1.15rem; }
          .faq-page-shell .faq-question-trigger { grid-template-columns: 1.8rem minmax(0,1fr) 1.9rem; gap: .55rem; padding: .8rem; }
          .faq-page-shell .faq-question-number, .faq-page-shell .faq-question-icon { width: 1.9rem; height: 1.9rem; }
          .faq-page-shell .faq-question-text { font-size: .9rem; }
        }
      `}</style>
    </main>
  );
}
