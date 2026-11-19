/* features/home/FaqAccordion.jsx */
import { useEffect, useMemo, useState } from 'react';
import { slugify, normalizeFaqData, getIllustration } from '../../utils/faqData';

const ACCENTS = ['blue', 'mint'];

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


const FAQ_ILLUSTRATION_STYLE = {
  display: 'block',
  width: '100%',
  height: '100%',
  aspectRatio: '1 / 1',
  objectFit: 'cover',
  borderRadius: 'inherit',
  border: 0,
  boxShadow: 'none',
};

export function FaqAccordion({ items, data, standalone = false }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [search, setSearch] = useState('');

  const faq = useMemo(() => normalizeFaqData(data || { questions: items }), [data, items]);
  const categories = faq.categories;
  const faqHeroIllustration = getIllustration(faq.illustrations, 'hero', '/images/faq-hero.jpg');
  const faqBrowseIllustration = getIllustration(faq.illustrations, 'browse_topic', '/images/faq-browse-topic.jpg');
  const faqPopularIllustration = getIllustration(faq.illustrations, 'popular_questions', '/images/faq-popular-questions.jpg');
  const faqLearningIllustration = getIllustration(faq.illustrations, 'learning', '/images/faq-learning-resources.jpg');
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
      <section id="faq" className="section reveal home-faq-section">
        <div className="section-head">
          <div className="section-head-left">
            <span className="eyebrow">Quick answers</span>
            <h2>Frequently asked questions</h2>
          </div>
        </div>

        <div className="home-faq-list">
          {faq.questions.map((item, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const isActive = activeIndex === index;

            return (
              <div key={item.id || `${item.question}-${index}`} className={`home-faq-item home-faq-${accent}${isActive ? ' active' : ''}`}>
                <button className="home-faq-question" onClick={() => toggleQuestion(index)} aria-expanded={isActive} aria-controls={`home-faq-answer-${index}`}>
                  <span className="home-faq-icon"><FaqSvgIcon name="circle-question" size={22} /></span>
                  <span className="home-faq-question-text">{item.question}</span>
                  <span className="home-faq-plus">+</span>
                </button>
                <div id={`home-faq-answer-${index}`} className="home-faq-answer"><p>{item.answer}</p></div>
              </div>
            );
          })}
        </div>
      </section>
    );
  }

  const featuredItems = faq.questions.filter(item => item.featured).slice(0, 3);

  return (
    <div className="faq-explorer">
      <section className="faq-hero">
        <div className="faq-hero-content">
          <span className="faq-eyebrow">{faq.hero.eyebrow}</span>
          <h1 className="faq-hero-title">{faq.hero.title}</h1>
          <p className="faq-hero-description">{faq.hero.description}</p>
          <label className="faq-search">
            <FaqSvgIcon name="magnifying-glass" size={20} />
            <input type="search" value={search} onChange={event => { setSearch(event.target.value); setActiveIndex(null); }} placeholder={faq.hero.search_placeholder} aria-label="Search frequently asked questions"  className="block min-h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500" />
            {search && <button type="button" className="faq-search-clear" onClick={() => setSearch('')} aria-label="Clear FAQ search"><FaqSvgIcon name="xmark" size={18} /></button>}
          </label>
          <div className="faq-illustration faq-illustration-browse-topic" style={{ position: 'relative', inset: 'auto', width: '150px', height: '150px', marginTop: 'var(--space-5)', borderRadius: '50%', background: 'var(--primary-light))', overflow: 'hidden' }}>
            <img style={FAQ_ILLUSTRATION_STYLE} src={faqBrowseIllustration.imageUrl} alt={faqBrowseIllustration.alt || 'Student exploring learning topics'} />
          </div>
        </div>
        <div className="faq-illustration faq-illustration-hero" style={{ width: '150px', height: '150px', borderRadius: '50%', background: 'var(--primary-light)', overflow: 'hidden' }}>
          <img style={FAQ_ILLUSTRATION_STYLE} src={faqHeroIllustration.imageUrl} alt={faqHeroIllustration.alt || faq.hero.title} />
        </div>
      </section>

      <section className="faq-section faq-category-section">
        <div className="faq-section-heading">
          <div><span className="faq-section-eyebrow">Browse by topic</span><h2>Find the right answer faster</h2></div>
          <span className="faq-result-count">{filteredItems.length} {filteredItems.length === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="faq-category-grid">
          <button type="button" className={`faq-category${activeCategory === 'all' ? ' is-active' : ''}`} onClick={() => { setActiveCategory('all'); setActiveIndex(null); }}>
            <span className="faq-category-icon faq-tone-blue"><FaqSvgIcon name="layer-group" size={21} /></span>
            <span><strong>All questions</strong><small>Browse everything</small></span>
          </button>
          {categories.map(category => (
            <button key={category.id} type="button" className={`faq-category${activeCategory === category.id ? ' is-active' : ''}`} onClick={() => { setActiveCategory(category.id); setActiveIndex(null); }}>
              <span className={`faq-category-icon faq-tone-${category.tone || 'blue'}`}><FaqSvgIcon name={category.icon || "circle-question"} size={21} /></span>
              <span><strong>{category.label}</strong><small>{category.description}</small></span>
            </button>
          ))}
        </div>
      </section>

      {featuredItems.length > 0 && !search && activeCategory === 'all' && (
        <section className="faq-section faq-featured-section">
          <div className="faq-section-heading"><div><span className="faq-section-eyebrow">Popular questions</span><h2>Start with these</h2></div></div>
          <div className="faq-featured-grid">
            {featuredItems.map(item => (
              <button type="button" key={item.id || item.question} className="faq-featured-item" onClick={() => { const index = faq.questions.indexOf(item); setActiveCategory('all'); setActiveIndex(index); document.getElementById(`faq-question-${item.id || slugify(item.question)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }}>
                <span className="faq-featured-mark"><FaqSvgIcon name="arrow-right" size={18} /></span><span>{item.question}</span>
              </button>
            ))}
          </div>
          <div className="faq-illustration faq-illustration-popular-questions"><img style={FAQ_ILLUSTRATION_STYLE} src={faqPopularIllustration.imageUrl} alt={faqPopularIllustration.alt || 'Thoughtful student reviewing questions'} /></div>
        </section>
      )}

      <section className="faq-section faq-questions-section">
        <div className="faq-questions-layout">
          <div className="faq-questions-intro">
            <span className="faq-section-eyebrow">Questions & answers</span>
            <h2>{search ? 'Search results' : activeCategory === 'all' ? 'Everything you need to know' : categories.find(category => category.id === activeCategory)?.label || 'Questions'}</h2>
            <p>{search ? `Showing answers that match “${search}”.` : 'Open a question to read the answer without leaving the page.'}</p>
          </div>
          <div className="faq-question-list">
            {filteredItems.length ? filteredItems.map(({ item, index }) => {
              const id = item.id || slugify(item.question) || `question-${index}`;
              const isActive = activeIndex === index;
              return (
                <article id={`faq-question-${id}`} className={`faq-question-item${isActive ? ' is-open' : ''}`} key={id}>
                  <button type="button" className="faq-question-trigger" onClick={() => toggleQuestion(index)} aria-expanded={isActive} aria-controls={`faq-answer-${id}`}>
                    <span className="faq-question-number">{String(index + 1).padStart(2, '0')}</span><span className="faq-question-text">{item.question}</span><span className="faq-question-icon"><FaqSvgIcon name={isActive ? "minus" : "plus"} size={18} /></span>
                  </button>
                  <div id={`faq-answer-${id}`} className="faq-question-answer" hidden={!isActive}>
                    <p>{item.answer}</p>
                    {Array.isArray(item.tags) && item.tags.length > 0 && <div className="faq-tags">{item.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}</div>}
                    <button type="button" className="faq-share-link" onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#faq-${id}`)}><FaqSvgIcon name="link" size={16} /> Copy question link</button>
                  </div>
                </article>
              );
            }) : (
              <div className="faq-no-results"><FaqSvgIcon name="magnifying-glass" size={24} /><h3>No matching questions</h3><p>Try a broader search term or browse another topic.</p><button type="button" className="faq-reset" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters</button></div>
            )}
          </div>
        </div>
        <div className="faq-illustration faq-illustration-learning"><img style={FAQ_ILLUSTRATION_STYLE} src={faqLearningIllustration.imageUrl} alt={faqLearningIllustration.alt || 'Student focused on learning'} /></div>
      </section>

      {faq.resources.length > 0 && (
        <section className="faq-section faq-resources-section">
          <div className="faq-section-heading"><div><span className="faq-section-eyebrow">Keep learning</span><h2>Go straight to the right resource</h2></div></div>
          <div className="faq-resource-grid">
            {faq.resources.map(resource => <a className="faq-resource" href={resource.href || '#'} key={`${resource.title}-${resource.href}`}><span className="faq-resource-icon"><FaqSvgIcon name={resource.icon || "arrow-right"} size={22} /></span><span><strong>{resource.title}</strong><small>{resource.description}</small></span><FaqSvgIcon name="arrow-up-right-from-square" className="faq-resource-arrow" size={17} /></a>)}
          </div>
        </section>
      )}

      <section className="faq-support-section">
        <div className="faq-support-content"><span className="faq-section-eyebrow">Need a person?</span><h2>{faq.support.title}</h2><p>{faq.support.description}</p><a className="faq-support-button" href={faq.support.href || '/contact'}>{faq.support.button || 'Contact Support'} <FaqSvgIcon name="arrow-right" size={18} /></a></div>
        <div className="faq-illustration faq-illustration-support"><img style={FAQ_ILLUSTRATION_STYLE} src={faqSupportIllustration.imageUrl} alt={faqSupportIllustration.alt || 'Friendly tutor providing learning support'} /></div>
      </section>
    </div>
  );
}
