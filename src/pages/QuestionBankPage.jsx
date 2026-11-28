import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Container from '../components/Container/Container';
import Icon from '../components/Icon/Icon';
import StorysetIllustration from '../components/StorysetIllustration';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';
import { useToast } from '../components/Toast/Toast';
import {
  archiveTestBlueprint,
  getTestBlueprints,
  saveTestBlueprint,
  searchQuestionBank,
  startCustomTest
} from '../api/client';

const PAGE_SIZE = 20;
const TYPES = [
  ['single_choice', 'Single choice'],
  ['multiple_select', 'Multiple select'],
  ['true_false', 'True or false'],
  ['short_answer', 'Short answer'],
  ['fill_blank', 'Fill in the blank'],
  ['dropdown', 'Dropdown'],
  ['numerical', 'Numerical'],
  ['essay', 'Written response']
];

function questionOptions(question) {
  if (question.question_type === 'multiple_select' || question.question_type === 'dropdown') {
    return (question.question_data?.options || []).map((option) => ({
      id: String(typeof option === 'object' ? option.id : option),
      label: typeof option === 'object' ? option.label : String(option)
    }));
  }
  if (question.question_type === 'true_false') return [{ id: 'true', label: 'True' }, { id: 'false', label: 'False' }];
  if (question.question_type === 'single_choice') {
    return ['A', 'B', 'C', 'D'].map((key) => ({ id: key, label: question['option_' + key.toLowerCase()] })).filter((item) => item.label);
  }
  return [];
}

export default function QuestionBankPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialUnitId = searchParams.get('unit_id') || '';
  const toast = useToast();
  const [filters, setFilters] = useState({ search: '', difficulty: '', question_type: '', unit_id: initialUnitId, page: 0 });
  const [questions, setQuestions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [blueprints, setBlueprints] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [launching, setLaunching] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const loadBlueprints = useCallback(async () => {
    try {
      const result = await getTestBlueprints();
      setBlueprints(result?.blueprints || []);
    } catch (error) {
      toast(error?.message || 'Saved tests could not be loaded.', 'error');
    }
  }, [toast]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const timer = window.setTimeout(() => {
      searchQuestionBank({ ...filters, limit: PAGE_SIZE })
        .then((result) => {
          if (!active) return;
          setQuestions(result?.questions || []);
          setTotal(Number(result?.total) || 0);
        })
        .catch((error) => {
          if (active) toast(error?.message || 'Question bank could not be loaded.', 'error');
        })
        .finally(() => { if (active) setLoading(false); });
    }, 220);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, toast]);

  useEffect(() => { loadBlueprints(); }, [loadBlueprints]);

  const selectedQuestions = useMemo(() => selected
    .map((id) => questions.find((item) => String(item.id) === String(id)))
    .filter(Boolean), [selected, questions]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value, page: 0 }));
  }

  function toggleQuestion(question) {
    const id = String(question.id);
    if (selected.includes(id)) {
      setSelected((current) => current.filter((item) => item !== id));
      if (selected.length === 1) setSelectedUnit(null);
      return;
    }
    if (selected.length >= 40) {
      toast('A custom test can contain up to 40 questions.', 'error');
      return;
    }
    const unitId = String(question.unit_id);
    if (selectedUnit && selectedUnit !== unitId) {
      toast('Keep a custom test within one lesson for accurate progress and results. Clear your selection before choosing another lesson.', 'error');
      return;
    }
    setSelectedUnit(unitId);
    setSelected((current) => [...current, id]);
    if (!title) setTitle('Custom practice test');
  }

  async function saveSelection() {
    if (selected.length < 2 || !title.trim()) {
      toast('Choose at least two questions and give the test a title.', 'error');
      return;
    }
    setSaving(true);
    try {
      await saveTestBlueprint({
        title,
        description,
        question_ids: selected.map(Number),
        filters: { ...filters, unit_id: selectedUnit }
      });
      setSelected([]);
      setSelectedUnit(null);
      setTitle('');
      setDescription('');
      await loadBlueprints();
      toast('Your custom test has been saved.', 'success');
    } catch (error) {
      toast(error?.message || 'Your custom test could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function launchBlueprint(blueprint) {
    setLaunching(blueprint.id);
    try {
      const result = await startCustomTest(blueprint.id);
      navigate(`/quiz?unit_id=${encodeURIComponent(result.unit_id)}&activity_scope=${encodeURIComponent(result.activity_scope)}&custom_test=1`);
    } catch (error) {
      toast(error?.message || 'This custom test could not be started.', 'error');
    } finally {
      setLaunching(null);
    }
  }

  async function removeBlueprint(id) {
    try {
      await archiveTestBlueprint(id);
      await loadBlueprints();
      toast('Saved test archived.', 'success');
    } catch (error) {
      toast(error?.message || 'Saved test could not be archived.', 'error');
    }
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <Container className="py-6 sm:py-10">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Question bank', href: null }]} />
      <div className="mt-7 grid items-center gap-5 border-b border-border bg-background py-6 sm:grid-cols-[minmax(0,1fr)_160px]">
        <PageHeader label="Assessment practice" title="Question bank" subtitle="Find published questions from your active curriculum, review their learning objectives and assemble focused tests for exam practice." />
        <StorysetIllustration name="knowledge" alt="Knowledge and question-based learning" className="mx-auto hidden w-36 shrink-0 object-contain sm:block" />
      </div>

      <section className="mb-8 mt-8 grid grid-cols-1 gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:grid-cols-2 lg:grid-cols-3" aria-label="Question bank filters">
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700">
          <span>Search questions and concepts</span>
          <span className="relative"><Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search pharmacology, concepts or learning objectives" className={`${UI.inputBase} border-border pl-11`} /></span>
        </label>
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700"><span>Difficulty</span><select value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)} className={`${UI.selectBase} border-border`}><option value="">All levels</option><option value="easy">Easy</option><option value="medium">Moderate</option><option value="hard">Advanced</option></select></label>
        <label className="grid min-w-0 gap-2 text-sm font-semibold text-slate-700"><span>Question format</span><select value={filters.question_type} onChange={(event) => updateFilter('question_type', event.target.value)} className={`${UI.selectBase} border-border`}><option value="">All formats</option>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </section>

      <div className="grid min-w-0 grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <section className="grid min-w-0 gap-5" aria-labelledby="qbank-results-title">
          <header className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4">
            <div><h2 id="qbank-results-title" className="text-xl font-extrabold text-primary-900 sm:text-2xl">Curriculum questions</h2><p className="mt-2 text-sm text-muted">{total} published questions available {filters.unit_id ? 'in this lesson' : 'in your active programme'}</p></div>
            <span className="rounded-full bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-900">{selected.length}/40 selected</span>
          </header>
          {loading ? <div className="flex min-h-40 items-center justify-center rounded-2xl border border-border bg-white text-sm font-semibold text-muted" role="status">Searching your curriculum…</div> : questions.length === 0 ? (
            <div className="grid justify-items-center gap-3 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-12 text-center"><Icon name="search" className="text-2xl text-primary-700" /><h3 className="text-lg font-bold text-primary-900">No matching questions</h3><p className="text-sm leading-6 text-muted">Try a different search phrase or remove one of the filters.</p></div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {questions.map((question) => {
                const checked = selected.includes(String(question.id));
                const options = questionOptions(question);
                return (
                  <article className={`grid min-w-0 gap-4 rounded-2xl border p-4 shadow-sm transition sm:p-5 ${checked ? 'border-primary-400 bg-primary-50' : 'border-border bg-white'}`} key={question.id}>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted"><span className="rounded-full bg-primary-50 px-3 py-1 text-primary-800">{question.curriculum_unit?.name || 'Curriculum lesson'}</span><span className="rounded-full bg-secondary-50 px-3 py-1 text-secondary-800">{question.difficulty || 'Standard'}</span><span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">{String(question.question_type || 'single_choice').replaceAll('_', ' ')}</span></div>
                    <h3 className="text-base font-bold leading-7 text-primary-950">{question.question_text}</h3>
                    {question.image_url && <img className="max-h-72 w-full rounded-xl border border-border object-contain" src={question.image_url} alt={question.image_alt_text || 'Question illustration'} loading="lazy" />}
                    {options.length > 0 && <ol className="grid gap-2 pl-5 text-sm leading-6 text-slate-700" type="A">{options.map((option) => <li key={option.id} className="pl-1">{option.label}</li>)}</ol>}
                    {question.concept_name && <p className="inline-flex items-center gap-2 text-sm font-semibold text-primary-800"><Icon name="brain" />{question.concept_name}</p>}
                    {question.learning_objective && <p className="rounded-xl bg-primary-50 p-3 text-sm leading-6 text-slate-700">{question.learning_objective}</p>}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
                      <button type="button" className={UI.secondaryButton} onClick={() => setExpanded(expanded === question.id ? null : question.id)}>{expanded === question.id ? 'Hide details' : 'Question details'}</button>
                      <button type="button" className={checked ? UI.secondaryButton : UI.primaryButton} onClick={() => toggleQuestion(question)}><Icon name={checked ? 'circle-check' : 'plus'} />{checked ? 'Selected' : 'Add to test'}</button>
                    </div>
                    {expanded === question.id && <div className="grid gap-2 rounded-xl bg-background p-4 text-sm text-slate-700"><p>Question type: {String(question.question_type || 'single_choice').replaceAll('_', ' ')}</p><p>Difficulty: {question.difficulty || 'Not specified'}</p><p>Concept: {question.concept_name || 'Not classified'}</p><p>Answer explanations are shown after a learner submits the question in a practice session.</p></div>}
                  </article>
                );
              })}
            </div>
          )}
          <nav className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4" aria-label="Question bank pagination"><button type="button" className={UI.secondaryButton} disabled={filters.page <= 0 || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span className="text-sm font-semibold text-muted">Page {filters.page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button type="button" className={UI.secondaryButton} disabled={(filters.page + 1) * PAGE_SIZE >= total || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button></nav>
        </section>

        <aside className="grid min-w-0 content-start gap-4 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-6 xl:sticky xl:top-6">
          <header className="flex items-start gap-3"><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-800 text-white"><Icon name="clipboard-check" /></span><div><h2 className="text-lg font-extrabold text-primary-900">Custom test builder</h2><p className="mt-1 text-xs leading-5 text-muted">Target a lesson and build a focused assessment.</p></div></header>
          <div className="flex items-center gap-3 rounded-xl bg-white p-4"><strong className="text-3xl font-extrabold text-primary-900">{selected.length}</strong><span className="text-sm font-semibold text-muted">questions selected</span></div>
          <label className="grid gap-2 text-sm font-semibold text-slate-700"><span>Test title</span><input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Pharmacokinetics revision" className={`${UI.inputBase} border-border`} /></label>
          <label className="grid gap-2 text-sm font-semibold text-slate-700"><span>Description (optional)</span><textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What do you want to practise?" className={`${UI.inputBase} min-h-32 resize-y border-border`} /></label>
          <button type="button" className={UI.primaryButton} disabled={saving || selected.length < 2 || !title.trim()} onClick={saveSelection}>{saving ? 'Saving test…' : 'Save custom test'}</button>
          <button type="button" className={UI.secondaryButton} disabled={!selected.length} onClick={() => { setSelected([]); setSelectedUnit(null); }}>Clear selection</button>
          <p className="text-xs leading-6 text-muted">Choose 2–40 questions from one lesson. Your saved test keeps its own question order and launches through the secure quiz attempt system.</p>
          <section className="grid gap-3 border-t border-border pt-4"><h3 className="text-sm font-extrabold text-primary-900">Saved tests</h3>{blueprints.length === 0 ? <p className="text-sm text-muted">No saved tests yet.</p> : blueprints.map((blueprint) => <article key={blueprint.id} className="grid gap-2 rounded-xl border border-border bg-white p-3"><div><strong className="block text-sm text-primary-900">{blueprint.title}</strong><small className="text-xs text-muted">{blueprint.question_count} questions</small></div><div className="flex flex-wrap gap-2"><button type="button" className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-primary-800 px-3 py-2 text-xs font-bold text-white hover:bg-primary-900" disabled={launching === blueprint.id || Number(blueprint.question_count) < 2} onClick={() => launchBlueprint(blueprint)}>{launching === blueprint.id ? 'Starting…' : 'Start test'} <Icon name="arrow-right" /></button><button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-700 hover:bg-red-50" onClick={() => removeBlueprint(blueprint.id)} aria-label={`Archive ${blueprint.title}`}><Icon name="trash" /></button></div></article>)}</section>
          <Link className="inline-flex items-center gap-2 text-sm font-bold text-primary-800 hover:text-primary-950" to="/quiz">Return to curriculum practice <Icon name="arrow-right" /></Link>
        </aside>
      </div>
      </Container>
    </main>
  );
}
