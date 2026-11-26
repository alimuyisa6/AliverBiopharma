/* features/flashcards/FlashcardSection.jsx */
import React from 'react';
import Button from '../../components/Button/Button';

export function FlashcardSection({ headingTitle, headingSubtitle, onStartStudy, onBrowseDecks, user }) {
  const previewCards = [
    { q: 'What is the function of the mitochondria?', label: 'Cell Biology' },
    { q: 'Define the term osmosis.', label: 'Transport' },
    { q: 'What enzyme breaks down starch?', label: 'Nutrition' }
  ];

  return (
    <section id="flashcards" className="w-full bg-primary-50 px-5 py-12 sm:px-8 sm:py-16 lg:px-12" aria-labelledby="flashcards-intro-title">
      <div className="mx-auto grid w-full max-w-7xl gap-7">
        <header className="grid gap-3"><h2 id="flashcards-intro-title" className="text-3xl font-extrabold leading-tight text-primary-900 sm:text-4xl">{headingTitle || 'Transform the way you retain complex scientific concepts through active recall'}</h2><p className="max-w-3xl text-sm leading-7 text-muted sm:text-base">{headingSubtitle || 'Flip cards, typed answers, multiple choice and structure identification — all in one adaptive system.'}</p></header>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {previewCards.map((item, index) => (
            <article key={index} className="grid min-h-48 content-between gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6">
              <p className="text-lg font-bold leading-7 text-primary-900">{item.q}</p>
              <div className="flex items-center justify-between gap-3"><span className="rounded-full bg-secondary-50 px-3 py-1.5 text-xs font-bold text-secondary-800">{item.label}</span><div className="flex gap-1.5" aria-label={`Card ${index + 1} of ${previewCards.length}`}>{previewCards.map((_, dot) => <span key={dot} className={`h-2 w-2 rounded-full ${dot === index ? 'bg-primary-700' : 'bg-primary-100'}`} />)}</div></div>
            </article>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3"><Button onClick={onStartStudy}><i className="fa-solid fa-layer-group" aria-hidden="true" />{user ? 'Start Studying' : 'Login to Study'}</Button>{user && <Button variant="secondary" className="min-w-36" onClick={onBrowseDecks}><i className="fa-solid fa-arrow-right" aria-hidden="true" /> Browse Decks</Button>}</div>
      </div>
    </section>
  );
} 
