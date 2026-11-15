import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import Container from '../components/Container/Container';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Icon from '../components/Icon/Icon';
import { getRequest } from '../api/client';
import { useToast } from '../components/Toast/Toast';
import '../styles/quiz.css';

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
      if (caseId) setActiveCase(result?.data || null);
      else setCases(Array.isArray(result?.data) ? result.data : []);
    }).catch((error) => {
      if (!active) return;
      setRestricted(error?.status === 403 || /restricted|pharmacy/i.test(error?.message || ''));
      toast(error?.message || 'Clinical simulations could not be loaded.', 'error');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [caseId, toast]);

  return (
    <Container className="clinical-simulation-page">
      <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Clinical simulations', href: caseId ? '/clinical-simulations' : null }, ...(caseId && activeCase ? [{ label: activeCase.title, href: null }] : [])]} />
      <header className="qbank-header">
        <span className="qbank-eyebrow">Apply your knowledge</span>
        <h1>{caseId ? activeCase?.title || 'Clinical case' : 'Clinical simulations'}</h1>
        <p>Practise clinical reasoning through structured patient encounters, investigation findings and reviewed case feedback.</p>
      </header>
      {loading ? <div className="qbank-empty">Loading reviewed clinical cases…</div> : restricted ? (
        <div className="qbank-empty"><Icon name="lock" /><h2>Pharmacy learning access</h2><p>Clinical simulations are currently available within the Pharmacy learning pathway.</p></div>
      ) : caseId && activeCase ? (
        <article className="clinical-case-card">
          <div className="qbank-question-topline"><span>{activeCase.clinical_domain || 'Clinical case'}</span><span>{activeCase.difficulty || 'Standard'}</span><span>{activeCase.estimated_duration_minutes ? activeCase.estimated_duration_minutes + ' min' : 'Self-paced'}</span></div>
          <h2>{activeCase.title}</h2>
          <p>{activeCase.description || 'This reviewed case is ready for structured clinical reasoning.'}</p>
          {Array.isArray(activeCase.learning_objectives) && activeCase.learning_objectives.length > 0 && <section><h3>Learning objectives</h3><ul>{activeCase.learning_objectives.map((item, index) => <li key={index}>{typeof item === 'string' ? item : item.label || item.description}</li>)}</ul></section>}
          <section><h3>Encounter stages</h3>{(activeCase.stages || []).length ? activeCase.stages.map((stage) => <article key={stage.id}><h4>{stage.title || 'Clinical stage ' + stage.stage_order}</h4><p>{stage.description || stage.prompt || 'Stage content'}</p></article>) : <p>Stage content is being prepared for this case.</p>}</section>
          <p className="qbank-builder-note">Patient dialogue, assessment and scoring will be enabled when this case has a reviewed simulation script and evaluation rubric.</p>
          <Link className="qbank-back-link" to="/clinical-simulations">Back to clinical simulations <Icon name="arrow-left" /></Link>
        </article>
      ) : cases.length ? (
        <div className="clinical-case-grid">{cases.map((item) => <article className="clinical-case-card" key={item.id}><div className="qbank-question-topline"><span>{item.clinical_domain || 'Clinical case'}</span><span>{item.difficulty || 'Standard'}</span></div><h2>{item.title}</h2><p>{item.description || 'A reviewed clinical learning case.'}</p><Link to={`/clinical-simulations/${item.id}`} className="qbank-select-button">View case <Icon name="arrow-right" /></Link></article>)}</div>
      ) : (
        <div className="qbank-empty clinical-case-empty"><Icon name="capsules" /><h2>Clinical cases are being prepared</h2><p>There are currently no clinician-reviewed cases published for learners. New patient encounters will appear here after clinical review, including their investigation data, expected reasoning and scoring rubrics.</p><Link to="/question-bank" className="qbank-select-button">Practise with the question bank <Icon name="arrow-right" /></Link></div>
      )}
    </Container>
  );
}
