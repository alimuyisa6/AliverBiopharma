import { Link } from 'react-router-dom';
import Spinner from '../components/Spinner/Spinner';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import { UI } from '../design-system';

function RelatedResourceGroup({ title, icon, items, to, getTitle, getMeta, iconTone = 'bg-primary-50 text-primary-700' }) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return (
    <section className="grid gap-4" aria-label={title}>
      <header className="flex items-center gap-3 border-b border-border pb-3">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><i className={`fa-solid ${icon}`} aria-hidden="true" /></span>
        <h3 className="text-lg font-extrabold text-primary-900">{title}</h3>
        <span className="ml-auto rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-800">{items.length}</span>
      </header>
      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <Link key={item.id || item.slug || item.subtopic_id || getTitle(item)} to={to(item)} className="group flex min-w-0 items-center gap-3 rounded-xl border border-border bg-white p-4 text-primary-900 no-underline transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm">
            <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}><i className={`fa-solid ${icon}`} aria-hidden="true" /></span>
            <span className="flex min-w-0 flex-1 flex-col gap-1"><strong className="text-sm font-bold leading-5">{getTitle(item)}</strong><small className="text-xs leading-5 text-muted">{getMeta(item)}</small></span>
            <i className="fa-solid fa-arrow-right shrink-0 text-sm text-primary-500 transition group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export default function GlossaryView({
  selectedLevel, selectedClass, terms, categories, selectedCategory, searchQuery,
  activeTerm, termContent, loading, termLoading, sidebarOpen, groupedTerms,
  onCategoryChange, onSearchChange, onTermClick, onToggleSidebar, onClearSearch
}) {
  if (loading && terms.length === 0) {
    return <main className="flex min-h-[60vh] items-center justify-center bg-primary-50 px-4 py-16" aria-busy="true"><div className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-semibold text-primary-800 shadow-sm" role="status" aria-live="polite"><Spinner size="lg" />Loading glossary terms…</div></main>;
  }

  const related = termContent?.content || {};
  const term = termContent?.term || {};
  const activeLevelTone = selectedLevel === 'Pharmacy' ? 'bg-secondary-100 text-secondary-900' : 'bg-primary-100 text-primary-900';

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <header className="w-full bg-primary-900 px-5 py-10 text-white sm:px-8 sm:py-14">
        <div className="mx-auto grid w-full max-w-7xl gap-4">
          <span className="text-xs font-bold uppercase tracking-[0.16em] text-secondary-200">Study reference</span>
          <h1 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">Learning Glossary</h1>
          <p className="max-w-2xl text-sm leading-7 text-primary-100 sm:text-base">Look up key terms and open related study materials.</p>
          {selectedClass && <span className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-xs font-bold ${activeLevelTone}`}><span className="opacity-70">Your class:</span>{selectedClass}</span>}
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Glossary' }]} />
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-muted">{terms.length} terms · {Object.keys(groupedTerms).length} categories · {selectedLevel || 'All levels'}</p>
          <button type="button" className={UI.secondaryButton} onClick={onToggleSidebar} aria-expanded={sidebarOpen} aria-controls="glossary-sidebar"><i className={`fa-solid fa-${sidebarOpen ? 'chevron-left' : 'chevron-right'}`} aria-hidden="true" />{sidebarOpen ? 'Hide terms' : 'Show terms'}</button>
        </div>

        <div className={`mt-5 grid min-w-0 gap-5 ${sidebarOpen ? 'lg:grid-cols-[minmax(250px,320px)_minmax(0,1fr)]' : 'grid-cols-1'}`}>
          {sidebarOpen && (
            <aside id="glossary-sidebar" className="grid min-w-0 content-start gap-4 rounded-2xl border border-border bg-primary-50 p-4 sm:p-5">
              <div className="grid gap-3">
                <label htmlFor="glossary-search" className="text-sm font-bold text-primary-900">Search terms</label>
                <div className="relative">
                  <i className="fa-solid fa-magnifying-glass pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
                  <input id="glossary-search" type="search" className={`${UI.inputBase} border-border pl-11 pr-12`} placeholder="Search for a term…" value={searchQuery} onChange={(event) => onSearchChange(event.target.value)} />
                  {searchQuery && <button type="button" className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-muted hover:bg-primary-100 hover:text-primary-900" onClick={onClearSearch} aria-label="Clear search"><i className="fa-solid fa-xmark" aria-hidden="true" /></button>}
                </div>
                <label htmlFor="glossary-category" className="text-sm font-bold text-primary-900">Category</label>
                <select id="glossary-category" className={`${UI.selectBase} border-border`} value={selectedCategory} onChange={(event) => onCategoryChange(event.target.value)}>
                  <option value="">All categories</option>{categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>

              <div className="grid max-h-[65vh] content-start gap-4 overflow-y-auto pr-1">
                {loading ? <div className="flex min-h-32 items-center justify-center gap-2 text-sm text-muted" role="status"><Spinner size="sm" />Loading glossary terms…</div> : Object.keys(groupedTerms).length === 0 ? (
                  <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-primary-200 bg-white p-5 text-center"><i className="fa-solid fa-book-open text-2xl text-primary-600" aria-hidden="true" /><p className="text-sm text-muted">No terms found{searchQuery ? ` for “${searchQuery}”` : ''}.</p>{searchQuery && <button type="button" className={UI.secondaryButton} onClick={onClearSearch}>Clear search</button>}</div>
                ) : Object.entries(groupedTerms).map(([category, categoryTerms]) => (
                  <section key={category} className="grid gap-2">
                    <h3 className="border-b border-primary-100 pb-2 text-xs font-extrabold uppercase tracking-wider text-primary-800">{category}</h3>
                    {categoryTerms.map((item) => <button key={item.id} type="button" onClick={() => onTermClick(item)} aria-pressed={activeTerm?.id === item.id} className={`flex min-h-11 items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold transition ${activeTerm?.id === item.id ? 'border-primary-400 bg-primary-100 text-primary-950' : 'border-transparent bg-white text-slate-700 hover:border-primary-200 hover:bg-primary-50'}`}><span className="min-w-0 break-words">{item.term}</span><i className="fa-solid fa-chevron-right shrink-0 text-xs text-primary-500" aria-hidden="true" /></button>)}
                  </section>
                ))}
              </div>
            </aside>
          )}

          <section className="grid min-w-0 content-start gap-6" aria-live="polite">
            {!activeTerm ? (
              <div className="grid justify-items-center gap-4 rounded-3xl border border-border bg-white px-6 py-12 text-center sm:py-16">
                <span className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 text-primary-700"><i className="fa-solid fa-book-open text-3xl" aria-hidden="true" /></span>
                <h2 className="text-2xl font-extrabold text-primary-900">Choose a term to see its definition</h2>
                <p className="max-w-xl text-sm leading-7 text-muted">Open a term to read its definition and find related study material and practice.</p>
                <div className="grid w-full max-w-lg grid-cols-3 gap-3 pt-3">
                  {[['Terms', terms.length], ['Categories', Object.keys(groupedTerms).length], ['Class', selectedClass || selectedLevel || '—']].map(([label, value]) => <div key={label} className="grid min-w-0 gap-1 rounded-xl bg-primary-50 p-3"><strong className="break-words text-lg font-extrabold text-primary-900">{value}</strong><span className="text-xs font-semibold text-muted">{label}</span></div>)}
                </div>
              </div>
            ) : termLoading ? (
              <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-border bg-white p-8 text-sm font-semibold text-muted" role="status"><Spinner size="lg" />Loading {activeTerm.term}…</div>
            ) : termContent ? (
              <div className="grid min-w-0 gap-7">
                <article className="grid gap-5 rounded-3xl bg-primary-900 p-5 text-white shadow-sm sm:p-7 lg:p-9">
                  <div className="flex flex-wrap items-center gap-3 text-sm"><span className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white">{term.category}</span>{term.pronunciation && <span className="inline-flex items-center gap-2 text-primary-100"><i className="fa-solid fa-volume-high" aria-hidden="true" />{term.pronunciation}</span>}</div>
                  <h2 className="text-3xl font-extrabold leading-tight text-white sm:text-4xl">{term.term}</h2>
                  <div className="grid gap-4">
                    <div className="rounded-2xl bg-white p-5 text-slate-800"><h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-primary-700">In simple terms</h3><p className="text-sm leading-7 sm:text-base">{term.plain_definition}</p></div>
                    {term.technical_definition && <div className="rounded-2xl border border-white/20 bg-white/10 p-5"><h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-white"><i className="fa-solid fa-microscope" aria-hidden="true" />Technical definition</h3><p className="text-sm leading-7 text-primary-100">{term.technical_definition}</p></div>}
                  </div>
                  {(term.etymology || term.mnemonic) && <div className="grid gap-3 sm:grid-cols-2">{term.etymology && <div className="rounded-xl border border-white/15 bg-white/10 p-4"><strong className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-secondary-200"><i className="fa-solid fa-language" aria-hidden="true" />Etymology</strong><p className="text-sm leading-6 text-primary-100">{term.etymology}</p></div>}{term.mnemonic && <div className="rounded-xl border border-white/15 bg-white/10 p-4"><strong className="mb-2 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-secondary-200"><i className="fa-solid fa-lightbulb" aria-hidden="true" />Memory aid</strong><p className="text-sm leading-6 text-primary-100">{term.mnemonic}</p></div>}</div>}
                </article>

                <div className="grid gap-7">
                  <RelatedResourceGroup title="Quizzes" icon="fa-circle-question" items={related.quizzes} to={(item) => `/quiz?topic=${encodeURIComponent(item.subject || item.category || '')}`} getTitle={(item) => item.title} getMeta={(item) => [item.difficulty, item.subject || item.category].filter(Boolean).join(' · ')} iconTone="bg-primary-50 text-primary-700" />
                  <RelatedResourceGroup title="Study notes" icon="fa-file-lines" items={related.notes} to={(item) => `/notes/read?id=${item.subtopic_id || item.id}`} getTitle={(item) => item.subtopic_name || item.title} getMeta={(item) => [item.topic, item.read_time].filter(Boolean).join(' · ')} iconTone="bg-secondary-50 text-secondary-700" />
                  <RelatedResourceGroup title="Flashcard decks" icon="fa-layer-group" items={related.flashcards} to={() => '/flashcards'} getTitle={(item) => item.title} getMeta={(item) => item.category || 'Flashcard deck'} iconTone="bg-primary-50 text-primary-700" />
                  <RelatedResourceGroup title="Recall practice" icon="fa-brain" items={related.recall_questions} to={(item) => `/recall?topic=${encodeURIComponent(item.topic || '')}`} getTitle={(item) => item.question_text?.length > 80 ? `${item.question_text.substring(0, 77)}...` : item.question_text} getMeta={(item) => [item.topic, item.difficulty].filter(Boolean).join(' · ')} iconTone="bg-secondary-50 text-secondary-700" />
                  {term.related_terms_data?.length > 0 && <section className="grid gap-4"><h3 className="border-b border-border pb-3 text-lg font-extrabold text-primary-900">Related terms</h3><div className="flex flex-wrap gap-2">{term.related_terms_data.map((item) => <button key={item.slug} type="button" onClick={() => onTermClick({ id: item.slug, term: item.term, slug: item.slug, plain_definition: item.plain_definition })} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-800 transition hover:border-primary-400 hover:bg-primary-100">{item.term}<i className="fa-solid fa-arrow-right text-xs" aria-hidden="true" /></button>)}</div></section>}
                </div>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
