import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Icon from '../components/Icon/Icon';
import StorysetIllustration from '../components/StorysetIllustration';
import { getRequest } from '../api/client';
import { useToast } from '../components/Toast/Toast';
import PageHeader from '../components/PageHeader/PageHeader';
import { UI } from '../design-system';

export default function ClinicalSimulationsPage() {
  const { caseId } = useParams();
  const toast = useToast();
  const [cases, setCases] = useState([]);
  const [activeCase, setActiveCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restricted, setRestricted] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    const request = caseId
      ? getRequest('lab', 'case_by_id', { id: caseId })
      : getRequest('lab', 'cases');
    request.then((result) => {
      if (!active) return;
      setRestricted(false);
      if (caseId) setActiveCase(result || null);
      else setCases(Array.isArray(result) ? result : []);
    }).catch((error) => {
      if (!active) return;
      setRestricted(error?.status === 403 || /restricted|pharmacy/i.test(error?.message || ''));
      toast(error?.message || 'Clinical simulations could not be loaded.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [caseId, toast]);

  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Clinical simulations', href: caseId ? '/clinical-simulations' : null }, ...(caseId && activeCase ? [{ label: activeCase.title, href: null }] : [])]} />
      <div className="mt-7 grid items-center gap-5 border-b border-border bg-primary-50 px-5 py-6 sm:grid-cols-[minmax(0,1fr)_160px] sm:px-7">
        <PageHeader label="Clinical learning" title={caseId ? activeCase?.title || 'Clinical case' : 'Clinical simulations'} subtitle="Practise clinical reasoning through structured patient encounters, investigation findings and reviewed case feedback." />
        {!caseId && <StorysetIllustration name="medicalResearch" alt="Clinical research and healthcare learning" className="mx-auto hidden w-40 shrink-0 object-contain sm:block" />}
      </div>
      {loading ? <div className="flex min-h-48 items-center justify-center gap-3 text-sm font-semibold text-muted" role="status"><span className="h-5 w-5 animate-spin rounded-full border-2 border-primary-200 border-t-primary-700" />Loading reviewed clinical cases…</div> : restricted ? (
        <div className={`${UI.card} mx-auto mt-8 grid max-w-2xl justify-items-center gap-3 p-7 text-center`}><Icon name="lock" className="text-2xl text-primary-700" /><h2 className="text-xl font-extrabold text-primary-900">Pharmacy learning access</h2><p className="text-sm leading-7 text-muted">Clinical simulations are currently available within the Pharmacy learning pathway.</p></div>
      ) : caseId && activeCase ? (
        <article className={`${UI.card} mt-8 grid gap-6 p-5 sm:p-8`}>
          <div className="flex flex-wrap gap-2 text-xs font-semibold text-muted"><span className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-800">{activeCase.clinical_domain || 'Clinical case'}</span><span className="rounded-full bg-secondary-50 px-3 py-1.5 text-secondary-800">{activeCase.difficulty || 'Standard'}</span><span className="rounded-full bg-slate-100 px-3 py-1.5 text-slate-700">{activeCase.estimated_duration_minutes ? activeCase.estimated_duration_minutes + ' min' : 'Self-paced'}</span></div>
          <header className="grid gap-3"><h2 className="text-2xl font-extrabold text-primary-900 sm:text-3xl">{activeCase.title}</h2><p className="text-sm leading-7 text-muted">{activeCase.description || 'This reviewed case is ready for structured clinical reasoning.'}</p></header>
          {Array.isArray(activeCase.learning_objectives) && activeCase.learning_objectives.length > 0 && <section className="grid gap-3 border-t border-border pt-5"><h3 className="text-lg font-bold text-primary-900">Learning objectives</h3><ul className="grid list-disc gap-2 pl-5 text-sm leading-6 text-slate-700">{activeCase.learning_objectives.map((item, index) => <li key={index}>{typeof item === 'string' ? item : item.label || item.description}</li>)}</ul></section>}
          <section className="grid gap-4 border-t border-border pt-5"><h3 className="text-lg font-bold text-primary-900">Encounter stages</h3>{(activeCase.stages || []).length ? activeCase.stages.map((stage) => <article key={stage.id} className="grid gap-2 rounded-xl bg-primary-50 p-4"><h4 className="font-bold text-primary-900">{stage.title || 'Clinical stage ' + stage.stage_order}</h4><p className="text-sm leading-6 text-slate-700">{stage.description || stage.prompt || 'Stage content'}</p></article>) : <p className="text-sm text-muted">Stage content is being prepared for this case.</p>}</section>
          <p className={UI.status.info}>Patient dialogue, assessment and scoring will be enabled when this case has a reviewed simulation script and evaluation rubric.</p>
          <Link className={UI.secondaryButton} to="/clinical-simulations"><Icon name="arrow-left" />Back to clinical simulations</Link>
        </article>
      ) : cases.length ? (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{cases.map((item) => <article className={`${UI.card} grid gap-4 p-5`} key={item.id}><div className="flex flex-wrap gap-2 text-xs font-semibold"><span className="rounded-full bg-primary-50 px-3 py-1.5 text-primary-800">{item.clinical_domain || 'Clinical case'}</span><span className="rounded-full bg-secondary-50 px-3 py-1.5 text-secondary-800">{item.difficulty || 'Standard'}</span></div><h2 className="text-lg font-bold text-primary-900">{item.title}</h2><p className="text-sm leading-6 text-muted">{item.description || 'A reviewed clinical learning case.'}</p><Link to={`/clinical-simulations/${item.id}`} className={`${UI.primaryButton} mt-auto`}>View case <Icon name="arrow-right" /></Link></article>)}</div>
      ) : (
        <div className="mx-auto mt-8 grid max-w-2xl justify-items-center gap-3 rounded-2xl border border-dashed border-primary-200 bg-white px-6 py-10 text-center"><StorysetIllustration name="inProgress" alt="Clinical simulation content being prepared" className="mx-auto mb-2 w-full max-w-[200px] object-contain" /><Icon name="capsules" className="text-2xl text-primary-700" /><h2 className="text-xl font-extrabold text-primary-900">Clinical cases are being prepared</h2><p className="text-sm leading-7 text-muted">There are currently no clinician-reviewed cases published for learners. New patient encounters will appear here after clinical review, including their investigation data, expected reasoning and scoring rubrics.</p><Link to="/question-bank" className={UI.primaryButton}>Practise with the question bank <Icon name="arrow-right" /></Link></div>
      )}
    </Container>
  );
}
