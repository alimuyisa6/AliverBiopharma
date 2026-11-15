import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Container from '../components/Container/Container';
import Icon from '../components/Icon/Icon';
import { useToast } from '../components/Toast/Toast';
import {
  archiveTestBlueprint,
  getTestBlueprints,
  saveTestBlueprint,
  searchQuestionBank,
  startCustomTest
} from '../api/client';
import '../styles/quiz.css';

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
      navigate(`/quiz?unit_id=${encodeURIComponent(result.unit_id)}&activity_scope=custom_test&custom_test=1`);
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
    <Container className="qbank-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Question bank', href: null }]} />
      <header className="qbank-header">
        <span className="qbank-eyebrow">Learn & recall</span>
        <h1>Question bank</h1>
        <p>Find published questions from your active curriculum, review their learning objectives and assemble focused tests for exam practice.</p>
      </header>

      <section className="qbank-search-panel" aria-label="Question bank filters">
        <label className="qbank-search-field">
          <span>Search questions and concepts</span>
          <span className="qbank-input-wrap"><Icon name="search" /><input value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} placeholder="Search pharmacology, concepts or learning objectives" /></span>
        </label>
        <label><span>Difficulty</span><select value={filters.difficulty} onChange={(event) => updateFilter('difficulty', event.target.value)}><option value="">All levels</option><option value="easy">Easy</option><option value="medium">Moderate</option><option value="hard">Advanced</option></select></label>
        <label><span>Question format</span><select value={filters.question_type} onChange={(event) => updateFilter('question_type', event.target.value)}><option value="">All formats</option>{TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </section>

      <div className="qbank-layout">
        <section className="qbank-results" aria-labelledby="qbank-results-title">
          <div className="qbank-section-heading"><div><h2 id="qbank-results-title">Curriculum questions</h2><p>{total} published questions available {filters.unit_id ? 'in this lesson' : 'in your active programme'}</p></div><span>{selected.length}/40 selected</span></div>
          {loading ? <div className="qbank-empty">Searching your curriculum…</div> : questions.length === 0 ? (
            <div className="qbank-empty"><Icon name="search" /><h3>No matching questions</h3><p>Try a different search phrase or remove one of the filters.</p></div>
          ) : (
            <div className="qbank-question-list">
              {questions.map((question) => {
                const checked = selected.includes(String(question.id));
                const options = questionOptions(question);
                return (
                  <article className={`qbank-question-card${checked ? ' is-selected' : ''}`} key={question.id}>
                    <div className="qbank-question-topline"><span>{question.curriculum_unit?.name || 'Curriculum lesson'}</span><span>{question.difficulty || 'Standard'}</span><span>{String(question.question_type || 'single_choice').replaceAll('_', ' ')}</span></div>
                    <h3>{question.question_text}</h3>
                    {question.image_url && <img className="qbank-question-image" src={question.image_url} alt={question.image_alt_text || 'Question illustration'} loading="lazy" />}
                    {options.length > 0 && <ol className="qbank-options" type={question.question_type === 'multiple_select' ? 'A' : 'A'}>{options.map((option) => <li key={option.id}>{option.label}</li>)}</ol>}
                    {question.concept_name && <p className="qbank-concept"><Icon name="brain" /> {question.concept_name}</p>}
                    {question.learning_objective && <p className="qbank-objective">{question.learning_objective}</p>}
                    <div className="qbank-question-actions">
                      <button type="button" className="qbank-detail-button" onClick={() => setExpanded(expanded === question.id ? null : question.id)}>{expanded === question.id ? 'Hide details' : 'Question details'}</button>
                      <button type="button" className={`qbank-select-button${checked ? ' is-selected' : ''}`} onClick={() => toggleQuestion(question)}><Icon name={checked ? 'circle-check' : 'plus'} /> {checked ? 'Selected' : 'Add to test'}</button>
                    </div>
                    {expanded === question.id && <div className="qbank-question-details"><p>Question type: {String(question.question_type || 'single_choice').replaceAll('_', ' ')}</p><p>Difficulty: {question.difficulty || 'Not specified'}</p><p>Concept: {question.concept_name || 'Not classified'}</p><p>Answer explanations are shown after a learner submits the question in a practice session.</p></div>}
                  </article>
                );
              })}
            </div>
          )}
          <div className="qbank-pagination"><button type="button" disabled={filters.page <= 0 || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button><span>Page {filters.page + 1} of {Math.max(1, Math.ceil(total / PAGE_SIZE))}</span><button type="button" disabled={(filters.page + 1) * PAGE_SIZE >= total || loading} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button></div>
        </section>

        <aside className="qbank-builder-panel">
          <div className="qbank-builder-heading"><span><Icon name="clipboard-check" /></span><div><h2>Custom test builder</h2><p>Target a lesson and build a focused assessment.</p></div></div>
          <div className="qbank-selection-summary"><strong>{selected.length}</strong><span>questions selected</span></div>
          <label><span>Test title</span><input value={title} maxLength={120} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. Pharmacokinetics revision" /></label>
          <label><span>Description (optional)</span><textarea value={description} maxLength={500} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="What do you want to practise?" /></label>
          <button type="button" className="qbank-primary-button" disabled={saving || selected.length < 2 || !title.trim()} onClick={saveSelection}>{saving ? 'Saving test…' : 'Save custom test'}</button>
          <button type="button" className="qbank-clear-button" disabled={!selected.length} onClick={() => { setSelected([]); setSelectedUnit(null); }}>Clear selection</button>
          <p className="qbank-builder-note">Choose 2–40 questions from one lesson. Your saved test keeps its own question order and launches through the secure quiz attempt system.</p>
          <div className="qbank-saved-tests"><h3>Saved tests</h3>{blueprints.length === 0 ? <p>No saved tests yet.</p> : blueprints.map((blueprint) => <article key={blueprint.id}><div><strong>{blueprint.title}</strong><small>{blueprint.question_count} questions</small></div><button type="button" disabled={launching === blueprint.id || Number(blueprint.question_count) < 2} onClick={() => launchBlueprint(blueprint)}>{launching === blueprint.id ? 'Starting…' : 'Start test'} <Icon name="arrow-right" /></button><button type="button" className="qbank-archive-button" onClick={() => removeBlueprint(blueprint.id)} aria-label={`Archive ${blueprint.title}`}><Icon name="trash" /></button></article>)}</div>
          <Link className="qbank-back-link" to="/quiz">Return to curriculum practice <Icon name="arrow-right" /></Link>
        </aside>
      </div>
    </Container>
  );
}
