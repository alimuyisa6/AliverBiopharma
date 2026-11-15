import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import Container from '../components/Container/Container';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import { getQuestionBank } from '../api/client';
import '../styles/resources.css';

const PAGE_SIZE = 20;

export default function QuestionBank() {
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [questionType, setQuestionType] = useState('');
  const [topic, setTopic] = useState('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ items: [], count: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getQuestionBank({ q: query.trim(), difficulty, question_type: questionType, topic: topic.trim(), page, limit: PAGE_SIZE });
      setResult({ items: data?.items || [], count: Number(data?.count || 0) });
    } catch (err) {
      setError(err?.message || 'Unable to load the question bank.');
    } finally {
      setLoading(false);
    }
  }, [query, difficulty, questionType, topic, page]);

  useEffect(() => {
    const timer = window.setTimeout(loadQuestions, 250);
    return () => window.clearTimeout(timer);
  }, [loadQuestions]);

  function updateFilter(setter, value) {
    setter(value);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(result.count / PAGE_SIZE));

  return (
    <Container className="question-bank-page">
      <main className="resources-main">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Resources', href: '/resources' }, { label: 'Question bank' }]} />
        <header className="resources-intro">
          <div>
            <span className="resources-section-kicker">Learn · Practise · Review</span>
            <h1>Question bank</h1>
            <p>Find published questions, focus on a topic and practise through Aliver’s existing assessment sessions.</p>
          </div>
          <span className="resources-section-context">{result.count.toLocaleString()} questions</span>
        </header>
        <section className="question-bank-toolbar" aria-label="Question bank filters">
          <label className="resources-search question-bank-search"><Icon name="search" /><span className="sr-only">Search questions</span><input value={query} onChange={e => updateFilter(setQuery,e.target.value)} placeholder="Search questions, concepts or objectives" /></label>
          <label className="question-bank-filter"><span>Difficulty</span><select value={difficulty} onChange={e => updateFilter(setDifficulty,e.target.value)}><option value="">All levels</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
          <label className="question-bank-filter"><span>Question type</span><select value={questionType} onChange={e => updateFilter(setQuestionType,e.target.value)}><option value="">All types</option><option value="single_choice">Single choice</option><option value="multiple_select">Multiple select</option><option value="true_false">True / false</option><option value="short_answer">Short answer</option><option value="numerical">Numerical</option></select></label>
          <label className="question-bank-filter"><span>Topic</span><input value={topic} onChange={e => updateFilter(setTopic,e.target.value)} placeholder="Filter by topic" /></label>
        </section>
        {loading ? <div className="question-bank-state"><Spinner context="brand" size="lg" /><span>Loading published questions…</span></div> :
          error ? <div className="question-bank-state question-bank-error" role="alert">{error}<button type="button" className="btn btn-secondary" onClick={loadQuestions}>Try again</button></div> :
          result.items.length === 0 ? <div className="question-bank-state"><Icon name="search" /><h2>No matching questions</h2><p>Try a broader search or remove one of the filters.</p></div> :
          <><div className="question-bank-list">{result.items.map((item,index)=><article className="question-bank-card" key={item.id}>
            <div className="question-bank-card-meta"><span>Question {((page-1)*PAGE_SIZE)+index+1}</span>{item.difficulty && <span className="question-bank-tag">{item.difficulty}</span>}{item.question_type && <span className="question-bank-tag">{item.question_type.replaceAll('_',' ')}</span>}</div>
            <h2>{item.question_text}</h2>
            <div className="question-bank-options">{[['A',item.option_a],['B',item.option_b],['C',item.option_c],['D',item.option_d]].filter(([,v])=>v).map(([letter,value])=><div key={letter}><strong>{letter}.</strong><span>{value}</span></div>)}</div>
            <div className="question-bank-card-footer"><div className="question-bank-context">{item.concept_name && <span>{item.concept_name}</span>}{item.subtopic && <span>{item.subtopic}</span>}</div>{item.unit_id ? <Link className="btn btn-primary btn-sm" to={`/quiz?unit_id=${encodeURIComponent(item.unit_id)}`}>Practise this topic <Icon name="arrow-right" /></Link> : <Link className="btn btn-secondary btn-sm" to="/quiz">Open question practice <Icon name="arrow-right" /></Link>}</div>
          </article>)}</div><nav className="question-bank-pagination" aria-label="Question bank pages"><button type="button" className="btn btn-secondary" disabled={page<=1} onClick={()=>setPage(v=>v-1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" className="btn btn-secondary" disabled={page>=pageCount} onClick={()=>setPage(v=>v+1)}>Next</button></nav></>}
      </main>
    </Container>
  );
}
