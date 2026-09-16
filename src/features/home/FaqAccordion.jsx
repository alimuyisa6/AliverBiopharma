/* features/home/FaqAccordion.jsx */
import { useEffect, useMemo, useState } from 'react';

const ACCENTS = ['grey', 'green', 'blue', 'amber', 'emerald'];

function slugify(value = '') {
  return value
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeFaqData(data) {
  const questions = Array.isArray(data?.questions) ? data.questions.filter(Boolean) : [];
  const categories = Array.isArray(data?.categories) ? data.categories.filter(Boolean) : [];
  const normalizedCategories = categories.length
    ? categories
    : [{ id: 'all', label: 'All questions', description: 'Browse all available answers.', icon: 'fa-circle-question', tone: 'blue' }];

  return {
    hero: data?.hero || {
      eyebrow: 'HELP CENTRE',
      title: 'How can we help you?',
      description: 'Find clear answers about learning, accounts, courses and using AliverBiopharm.',
      search_placeholder: 'Search questions, topics or answers...',
    },
    categories: normalizedCategories,
    questions,
    resources: Array.isArray(data?.resources) ? data.resources.filter(Boolean) : [],
    support: data?.support || {
      title: 'Still need help?',
      description: 'If your question is not answered here, our support team can help.',
      button: 'Contact Support',
      href: '/contact',
    },
    illustrations: data?.illustrations || {},
  };
}

function getIllustration(illustrations, key, fallback) {
  const illustration = illustrations?.[key] || {};
  const imageUrl = illustration.image_url || illustration.url || illustration.src || fallback;
  return {
    imageUrl,
    alt: illustration.alt || illustration.image_alt || '',
  };
}

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
            <span className="eyebrow">Before you ask</span>
            <h2>The questions we get all the time</h2>
          </div>
        </div>

        <div className="home-faq-list">
          {faq.questions.map((item, index) => {
            const accent = ACCENTS[index % ACCENTS.length];
            const isActive = activeIndex === index;

            return (
              <div
                key={item.id || `${item.question}-${index}`}
                className={`home-faq-item home-faq-${accent}${isActive ? ' active' : ''}`}
              >
                <button
                  className="home-faq-question"
                  onClick={() => toggleQuestion(index)}
                  aria-expanded={isActive}
                  aria-controls={`home-faq-answer-${index}`}
                >
                  <span className="home-faq-icon">
                    <i className="fa-solid fa-circle-question"></i>
                  </span>
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
            <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
            <input
              type="search"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                setActiveIndex(null);
              }}
              placeholder={faq.hero.search_placeholder}
              aria-label="Search frequently asked questions"
            />
            {search && (
              <button type="button" className="faq-search-clear" onClick={() => setSearch('')} aria-label="Clear FAQ search">
                <i className="fa-solid fa-xmark" aria-hidden="true"></i>
              </button>
            )}
          </label>
        </div>
        <div className="faq-illustration faq-illustration-hero">
          <img src={faqHeroIllustration.imageUrl} alt={faqHeroIllustration.alt || faq.hero.title} />
        </div>
      </section>

      <section className="faq-section faq-category-section">
        <div className="faq-section-heading">
          <div>
            <span className="faq-section-eyebrow">Browse by topic</span>
            <h2>Find the right answer faster</h2>
          </div>
          <span className="faq-result-count">{filteredItems.length} {filteredItems.length === 1 ? 'answer' : 'answers'}</span>
        </div>
        <div className="faq-category-grid">
          <button
            type="button"
            className={`faq-category${activeCategory === 'all' ? ' is-active' : ''}`}
            onClick={() => { setActiveCategory('all'); setActiveIndex(null); }}
          >
            <span className="faq-category-icon faq-tone-blue"><i className="fa-solid fa-layer-group" aria-hidden="true"></i></span>
            <span><strong>All questions</strong><small>Browse everything</small></span>
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              type="button"
              className={`faq-category${activeCategory === category.id ? ' is-active' : ''}`}
              onClick={() => { setActiveCategory(category.id); setActiveIndex(null); }}
            >
              <span className={`faq-category-icon faq-tone-${category.tone || 'blue'}`}><i className={`fa-solid ${category.icon || 'fa-circle-question'}`} aria-hidden="true"></i></span>
              <span><strong>{category.label}</strong><small>{category.description}</small></span>
            </button>
          ))}
        </div>
        <div className="faq-illustration faq-illustration-browse-topic">
          <img src={faqBrowseIllustration.imageUrl} alt={faqBrowseIllustration.alt || 'Student exploring learning topics'} />
        </div>
      </section>

      {featuredItems.length > 0 && !search && activeCategory === 'all' && (
        <section className="faq-section faq-featured-section">
          <div className="faq-section-heading">
            <div>
              <span className="faq-section-eyebrow">Popular questions</span>
              <h2>Start with these</h2>
            </div>
          </div>
          <div className="faq-featured-grid">
            {featuredItems.map(item => (
              <button
                type="button"
                key={item.id || item.question}
                className="faq-featured-item"
                onClick={() => {
                  const index = faq.questions.indexOf(item);
                  setActiveCategory('all');
                  setActiveIndex(index);
                  document.getElementById(`faq-question-${item.id || slugify(item.question)}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }}
              >
                <span className="faq-featured-mark"><i className="fa-solid fa-arrow-right" aria-hidden="true"></i></span>
                <span>{item.question}</span>
              </button>
            ))}
          </div>
          <div className="faq-illustration faq-illustration-popular-questions">
            <img src={faqPopularIllustration.imageUrl} alt={faqPopularIllustration.alt || 'Thoughtful student reviewing questions'} />
          </div>
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
                  <button
                    type="button"
                    className="faq-question-trigger"
                    onClick={() => toggleQuestion(index)}
                    aria-expanded={isActive}
                    aria-controls={`faq-answer-${id}`}
                  >
                    <span className="faq-question-number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="faq-question-text">{item.question}</span>
                    <span className="faq-question-icon"><i className={`fa-solid ${isActive ? 'fa-minus' : 'fa-plus'}`} aria-hidden="true"></i></span>
                  </button>
                  <div id={`faq-answer-${id}`} className="faq-question-answer" hidden={!isActive}>
                    <p>{item.answer}</p>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="faq-tags">
                        {item.tags.slice(0, 4).map(tag => <span key={tag}>{tag}</span>)}
                      </div>
                    )}
                    <button
                      type="button"
                      className="faq-share-link"
                      onClick={() => navigator.clipboard?.writeText(`${window.location.origin}${window.location.pathname}#faq-${id}`)}
                    >
                      <i className="fa-solid fa-link" aria-hidden="true"></i> Copy question link
                    </button>
                  </div>
                </article>
              );
            }) : (
              <div className="faq-no-results">
                <i className="fa-solid fa-magnifying-glass" aria-hidden="true"></i>
                <h3>No matching questions</h3>
                <p>Try a broader search term or browse another topic.</p>
                <button type="button" className="faq-reset" onClick={() => { setSearch(''); setActiveCategory('all'); }}>Clear filters</button>
              </div>
            )}
          </div>
        </div>
        <div className="faq-illustration faq-illustration-learning">
          <img src={faqLearningIllustration.imageUrl} alt={faqLearningIllustration.alt || 'Student focused on learning'} />
        </div>
      </section>

      {faq.resources.length > 0 && (
        <section className="faq-section faq-resources-section">
          <div className="faq-section-heading">
            <div>
              <span className="faq-section-eyebrow">Keep learning</span>
              <h2>Go straight to the right resource</h2>
            </div>
          </div>
          <div className="faq-resource-grid">
            {faq.resources.map(resource => (
              <a className="faq-resource" href={resource.href || '#'} key={`${resource.title}-${resource.href}`}>
                <span className="faq-resource-icon"><i className={`fa-solid ${resource.icon || 'fa-arrow-right'}`} aria-hidden="true"></i></span>
                <span><strong>{resource.title}</strong><small>{resource.description}</small></span>
                <i className="fa-solid fa-arrow-up-right-from-square faq-resource-arrow" aria-hidden="true"></i>
              </a>
            ))}
          </div>
        </section>
      )}

      <section className="faq-support-section">
        <div className="faq-support-content">
          <span className="faq-section-eyebrow">Need a person?</span>
          <h2>{faq.support.title}</h2>
          <p>{faq.support.description}</p>
          <a className="faq-support-button" href={faq.support.href || '/contact'}>{faq.support.button || 'Contact Support'} <i className="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
        <div className="faq-illustration faq-illustration-support">
          <img src={faqSupportIllustration.imageUrl} alt={faqSupportIllustration.alt || 'Friendly tutor providing learning support'} />
        </div>
      </section>
    </div>
  );
}
