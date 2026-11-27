/* features/home/FaqAccordion.jsx */
import { useEffect, useMemo, useState } from 'react';
import { slugify, normalizeFaqData, getIllustration } from '../../utils/faqData';
import StorysetIllustration from '../../components/StorysetIllustration';

const FAQ_SVG_PATHS = {
  'circle-question': '<circle cx="12" cy="12" r="9"/><path d="M9.6 9a2.5 2.5 0 1 1 4.2 1.8c-1.1 1-1.8 1.3-1.8 2.7"/><path d="M12 16.5h.01"/>',
  'magnifying-glass': '<circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.2 4.2"/>',
  'xmark': '<path d="m6 6 12 12M18 6 6 18"/>',
  'layer-group': '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/>',
  'arrow-right': '<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right-from-square': '<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',
  'plus': '<path d="M12 5v14M5 12h14"/>',
  'minus': '<path d="M5 12h14"/>',
  'link': '<path d="M10 13a5 5 0 0 0 7.1 0l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1"/><path d="M14 11a5 5 0 0 0-7.1 0l-2 2A5 5 0 0 0 10 20.1l1.1-1.1"/>',
  'book-open': '<path d="M3 5.5A3.5 3.5 0 0 1 6.5 2H12v19H6.5A3.5 3.5 0 0 0 3 24V5.5Z"/><path d="M21 5.5A3.5 3.5 0 0 0 17.5 2H12v19h5.5A3.5 3.5 0 0 1 21 24V5.5Z"/>',
  'graduation-cap': '<path d="m2 10 10-5 10 5-10 5-10-5Z"/><path d="M6 12.5v5c4 3 8 3 12 0v-5M22 10v6"/>',
  'message-circle': '<path d="M20 11.5a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.9-4.5a8.5 8.5 0 1 1 15.1-5Z"/>',
  'mail': '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  'file-text': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
  'shield-check': '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
  'heart': '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>',
  'settings': '<circle cx="12" cy="12" r="3"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.8-.6a7 7 0 0 1-1.5.9l-.3 1.9h-2.8l-.3-1.9a7 7 0 0 1-1.5-.9l-1.8.6-1.4-2.4 1.4-1.1a6 6 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.8.6a7 7 0 0 1 1.5-.9l.3-1.9h2.8l.3 1.9a7 7 0 0 1 1.5.9l1.8-.6 1.4 2.4-1.4 1.1a6 6 0 0 1 0 1.8Z"/>'
};
function FaqSvgIcon({ name = 'circle-question', className = '', size = 20, strokeWidth = 2 }) {
  const key = String(name).replace(/^fa-(solid )?/, '').replace(/^fa-/, '');
  const svg = FAQ_SVG_PATHS[key] || FAQ_SVG_PATHS['circle-question'];
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />;
}


export function FaqAccordion({ items, data, standalone = false }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const faq = useMemo(() => normalizeFaqData(data || { questions: items }), [data, items]);
  const categories = faq.categories;
  const faqHeroIllustration = getIllustration(faq.illustrations, 'hero', '/images/faq-hero.jpg');
  const faqSupportIllustration = getIllustration(faq.illustrations, 'support', '/images/faq-support.jpg');

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return faq.questions
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => activeCategory === 'all' || item.category === activeCategory)
      .filter(({ item }) => {
        if (!query) return true;
        const haystack = [item.question, item.answer, ...(Array.isArray(item.tags) ? item.tags : [])]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return haystack.includes(query);
      });
  }, [faq.questions, activeCategory, search]);

  useEffect(() => {
    if (!standalone) return;
    const hash = window.location.hash.replace('#faq-', '');
    if (!hash) return;
    const index = faq.questions.findIndex(item => (item.id || slugify(item.question)) === hash);
    if (index >= 0) setActiveIndex(index);
  }, [faq.questions, standalone]);

  useEffect(() => {
    if (!standalone || activeIndex === null) return;
    const item = faq.questions[activeIndex];
    if (!item) return;
    const id = item.id || slugify(item.question);
    window.history.replaceState(null, '', `#faq-${id}`);
  }, [activeIndex, faq.questions, standalone]);

  function toggleQuestion(index) {
    setActiveIndex(current => current === index ? null : index);
  }

  if (!faq.questions.length) return null;

  if (!standalone) {
    return (
      <section id="faq" className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="home-faq-heading">
        <header className="mb-8 max-w-3xl">
          <h2 id="home-faq-heading" className="text-3xl font-extrabold tracking-tight text-primary-950 sm:text-4xl">Frequently asked questions</h2>
        </header>
        <div className="grid gap-3">
          {faq.questions.map((item, index) => {
            const isActive = activeIndex === index;
            return (
              <article key={item.id || `${item.question}-${index}`} className={`overflow-hidden rounded-2xl border bg-white transition ${isActive ? 'border-primary-300 shadow-sm' : 'border-border'}`}>
                <button type="button" className="flex min-h-20 w-full items-center gap-4 p-4 text-left sm:p-5" onClick={() => toggleQuestion(index)} aria-expanded={isActive} aria-controls={`home-faq-answer-${index}`}>
                  <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800"><FaqSvgIcon name="circle-question" size={22} /></span>
                  <span className="min-w-0 flex-1 text-sm font-bold leading-6 text-primary-950 sm:text-base">{item.question}</span>
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-700 text-white"><FaqSvgIcon name={isActive ? 'minus' : 'plus'} size={21} strokeWidth={2.5} /></span>
                </button>
                <div id={`home-faq-answer-${index}`} className="px-5 pb-5 pl-[4.75rem] text-sm leading-7 text-slate-800 sm:pl-20" hidden={!isActive}><p>{item.answer}</p></div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  const featuredItems = faq.questions.filter(item => item.featured).slice(0, 3);

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-8 sm:gap-10">
      <section className="relative isolate grid min-w-0 grid-cols-1 items-center gap-8 overflow-hidden rounded-3xl bg-primary-900 p-6 text-white shadow-lg sm:p-8 lg:grid-cols-[minmax(0,1fr)_220px] lg:gap-12 lg:p-12">
        <div className="relative z-10 min-w-0 max-w-3xl">
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">{faq.hero.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100 sm:text-lg">{faq.hero.description}</p>
          <label className="mt-7 flex min-h-14 max-w-2xl items-center gap-3 rounded-2xl border border-white/30 bg-white px-4 text-primary-900 shadow-lg">
            <FaqSvgIcon name="magnifying-glass" size={20} />
            <input type="search" value={search} onChange={event => { setSearch(event.target.value); setActiveIndex(null); }} placeholder={faq.hero.search_placeholder} aria-label="Search frequently asked questions" className="min-w-0 flex-1 border-0 bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-500 focus:ring-0" />
            {search && <button type="button" className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-800 hover:bg-primary-100" onClick={() => setSearch('')} aria-label="Clear FAQ search"><FaqSvgIcon name="xmark" size={18} /></button>}
          </label>
        </div>
        <div className="relative z-10 mx-auto hidden h-48 w-48 overflow-hidden rounded-full border-8 border-white/15 bg-primary-800 shadow-xl lg:block">
          <img className="h-full w-full object-cover" src={faqHeroIllustration.imageUrl} alt={faqHeroIllustration.alt || faq.hero.title} />
        </div>
      </section>

      <section className="grid gap-5" aria-labelledby="faq-categories-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 id="faq-categories-heading" className="text-2xl font-extrabold text-primary-950 sm:text-3xl">Find the right answer faster</h2>
          <span className="inline-flex rounded-full bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-900">{filteredItems.length} {filteredItems.length === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <button type="button" className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${activeCategory === 'all' ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-border bg-white hover:border-primary-300 hover:bg-primary-50'}`} onClick={() => { setActiveCategory('all'); setActiveIndex(null); }}>
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-800"><FaqSvgIcon name="layer-group" size={21} /></span>
            <span><strong className="block text-sm font-extrabold text-primary-950">All questions</strong><small className="mt-1 block text-xs leading-5 text-slate-600">Browse everything</small></span>
          </button>
          {categories.map(category => (
            <button key={category.id} type="button" className={`flex min-h-20 w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${activeCategory === category.id ? 'border-primary-500 bg-primary-50 ring-1 ring-primary-200' : 'border-border bg-white hover:border-primary-300 hover:bg-primary-50'}`} onClick={() => { setActiveCategory(category.id); setActiveIndex(null); }}>
              <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-50 text-secondary-700"><FaqSvgIcon name={category.icon || 'circle-question'} size={21} /></span>
              <span className="min-w-0"><strong className="block text-sm font-extrabold text-primary-950">{category.label}</strong><small className="mt-1 block text-xs leading-5 text-slate-600">{category.description}</small></span>
            </button>
          ))}
        </div>
      </section>

      {featuredItems.length > 0 && !search && activeCategory === 'all' && (
        <section className="grid gap-5" aria-labelledby="faq-featured-heading">
          <h2 id="faq-featured-heading" className="text-2xl font-extrabold text-primary-950 sm:text-3xl">Start with these</h2>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {featuredItems.map(item => (
              <button type="button" key={item.id || item.question} className="flex min-h-24 items-center gap-3 rounded-2xl border border-border bg-white p-4 text-left text-sm font-bold leading-6 text-primary-900 transition hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50" onClick={() => { const index = faq.questions.indexOf(item); setActiveCategory('all'); setActiveIndex(index); document.getElementById(`faq-question-${item.id || slugify(item.question)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-800"><FaqSvgIcon name="arrow-right" size={18} /></span>
                <span>{item.question}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-6 lg:grid-cols-[minmax(220px,.7fr)_minmax(0,1.6fr)] lg:gap-10" aria-labelledby="faq-questions-heading">
        <div className="grid content-start gap-3 lg:sticky lg:top-24">
          <h2 id="faq-questions-heading" className="text-2xl font-extrabold leading-tight text-primary-950 sm:text-3xl">{search ? 'Search results' : activeCategory === 'all' ? 'Everything you need to know' : categories.find(category => category.id === activeCategory)?.label || 'Questions'}</h2>
          <p className="text-sm leading-7 text-slate-600">{search ? `Showing answers that match “${search}”.` : 'Open a question to read the answer without leaving the page.'}</p>
        </div>
        <div className="grid min-w-0 content-start gap-3">
          {filteredItems.length ? filteredItems.map(({ item, index }) => {
            const id = item.id || slugify(item.question) || `question-${index}`;
            const isActive = activeIndex === index;
            return (
              <article id={`faq-question-${id}`} className={`overflow-hidden rounded-2xl border bg-white transition ${isActive ? 'border-primary-300 shadow-md' : 'border-border'}`} key={id}>
                <button type="button" className="grid min-h-16 w-full grid-cols-[2.25rem_minmax(0,1fr)_2.5rem] items-center gap-3 p-4 text-left text-primary-950 sm:gap-4" onClick={() => toggleQuestion(index)} aria-expanded={isActive} aria-controls={`faq-answer-${id}`}>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-xs font-extrabold text-primary-800">{String(index + 1).padStart(2, '0')}</span>
                  <span className="text-sm font-bold leading-6 sm:text-base">{item.question}</span>
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-800"><FaqSvgIcon name={isActive ? 'minus' : 'plus'} size={19} /></span>
                </button>
                <div id={`faq-answer-${id}`} className="px-4 pb-5 pl-[4.5rem] text-sm leading-7 text-slate-800 sm:pl-20" hidden={!isActive}>
                  <p>{item.answer}</p>
                  {Array.isArray(item.tags) && item.tags.length > 0 && <div className="my-3 flex flex-wrap gap-2">{item.tags.slice(0, 4).map(tag => <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-800" key={tag}>{tag}</span>)}</div>}
                  <button type="button" className="mt-2 inline-flex items-center gap-2 text-xs font-bold text-primary-800 underline underline-offset-4 hover:text-primary-950" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#faq-${id}`)}><FaqSvgIcon name="link" size={16} /> Copy question link</button>
                </div>
              </article>
            );
          }) : (
            <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center">
              <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><FaqSvgIcon name="magnifying-glass" size={24} /></span>
              <h3 className="text-lg font-extrabold text-primary-950">No matching questions</h3>
              <p className="max-w-md text-sm leading-6 text-slate-600">Try a broader search term or browse another topic.</p>
              <button type="button" className="inline-flex min-h-10 items-center justify-center rounded-xl border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-800 hover:bg-primary-100" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters</button>
            </div>
          )}
        </div>
      </section>

      {faq.resources.length > 0 && (
        <section className="grid gap-5" aria-labelledby="faq-resources-heading">
          <h2 id="faq-resources-heading" className="text-2xl font-extrabold text-primary-950 sm:text-3xl">Go straight to the right resource</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {faq.resources.map(resource => <a className="flex min-h-20 items-center gap-3 rounded-2xl border border-border bg-white p-4 text-primary-900 no-underline transition hover:border-primary-300 hover:bg-primary-50" href={resource.href || '#'} key={`${resource.title}-${resource.href}`}><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><FaqSvgIcon name={resource.icon || 'arrow-right'} size={22} /></span><span className="min-w-0"><strong className="block text-sm font-extrabold">{resource.title}</strong><small className="mt-1 block text-xs leading-5 text-slate-600">{resource.description}</small></span><FaqSvgIcon name="arrow-up-right-from-square" className="ml-auto shrink-0 text-slate-600" size={17} /></a>)}
          </div>
        </section>
      )}

      <section className="grid items-center gap-6 rounded-3xl bg-primary-900 p-6 text-white sm:p-8 lg:grid-cols-[minmax(0,1fr)_160px] lg:p-10">
        <div className="grid justify-items-start gap-3">
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">{faq.support.title}</h2>
          <p className="max-w-2xl text-sm leading-7 text-blue-100 sm:text-base">{faq.support.description}</p>
          <a className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-sm font-extrabold text-primary-900 shadow-sm transition hover:bg-primary-50" href={faq.support.href || '/contact'}>{faq.support.button || 'Contact Support'} <FaqSvgIcon name="arrow-right" size={18} /></a>
        </div>
        <div className="mx-auto hidden h-36 w-36 overflow-hidden rounded-full border-4 border-white/20 bg-primary-800 lg:block"><img className="h-full w-full object-cover" src={faqSupportIllustration.imageUrl} alt={faqSupportIllustration.alt || 'Friendly tutor providing learning support'} /></div>
      </section>
    </div>
  );
}
