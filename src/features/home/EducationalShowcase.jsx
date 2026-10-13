import { useState } from 'react';
import { Link } from 'react-router-dom';
import './EducationalShowcase.css';

const screens = [
  { label: 'Pathway', eyebrow: '01 · YOUR PATHWAY', title: 'Learning that fits your course', text: 'Choose a study pathway, then explore structured learning resources designed to support your studies.' },
  { label: 'Curriculum', eyebrow: '02 · YOUR CURRICULUM', title: 'Move from a topic to understanding', text: 'Build knowledge in steps: learn the concept, practise actively, and review what you know.' },
  { label: 'Visual lesson', eyebrow: '03 · VISUAL LEARNING', title: 'See how osmosis works', text: 'Water moves across a selectively permeable membrane from a more dilute solution towards a more concentrated solution.' },
  { label: 'Quick quiz', eyebrow: '04 · CHECK YOUR UNDERSTANDING', title: 'Try a quick knowledge check', text: 'A plant cell is placed in distilled water. What is most likely to happen to it?' },
  { label: 'Next steps', eyebrow: '05 · KEEP THE KNOWLEDGE', title: 'Practise until it sticks', text: 'Explore learning resources, test your understanding with quizzes, and strengthen memory with BioRecall.' }
];
const pathways = [
  { id: 'O-Level', detail: 'Build strong Biology foundations', icon: '◉' },
  { id: 'A-Level', detail: 'Explore concepts in greater depth', icon: '⌬' },
  { id: 'Pharmacy', detail: 'Connect science with medicines', icon: '⚕' }
];
const answers = [
  { id: 'shrink', label: 'It shrinks away from the cell wall.' },
  { id: 'turgid', label: 'It takes in water and becomes turgid.' },
  { id: 'same', label: 'It remains exactly the same.' }
];

export default function EducationalShowcase() {
  const [screen, setScreen] = useState(0);
  const [pathway, setPathway] = useState('O-Level');
  const [water, setWater] = useState(false);
  const [answer, setAnswer] = useState('');
  const change = (value) => setScreen(Math.max(0, Math.min(4, value)));
  const current = screens[screen];

  return <section className="section educational-showcase" aria-labelledby="edu-showcase-title">
    <header className="edu-showcase-heading"><span className="eyebrow">TAKE A QUICK TOUR</span><h2 id="edu-showcase-title">Discover how learning works here</h2><p className="section-description">Explore a short, hands-on preview of the AliverBiopharm learning experience.</p></header>
    <div className="edu-showcase-shell">
      <nav className="edu-showcase-steps" aria-label="Learning tour">
        {screens.map((item, index) => <button key={item.label} type="button" aria-current={screen === index ? 'step' : undefined} className={'edu-showcase-step ' + (screen === index ? 'is-current' : '')} onClick={() => change(index)}><span className="edu-showcase-step-number">{'0' + (index + 1)}</span><span>{item.label}</span></button>)}
      </nav>
      <div className="edu-showcase-content">
        <div className="edu-showcase-copy"><span className="eyebrow">{current.eyebrow}</span><h3>{current.title}</h3><p>{current.text}</p>
          {screen === 0 && <div className="edu-pathway-options">{pathways.map((item) => <button key={item.id} type="button" aria-pressed={pathway === item.id} className={'edu-pathway-option ' + (pathway === item.id ? 'is-selected' : '')} onClick={() => setPathway(item.id)}><span className="edu-pathway-icon">{item.icon}</span><span><strong>{item.id}</strong><small>{item.detail}</small></span><span className="edu-pathway-radio" /></button>)}</div>}
          {screen === 1 && <div className="edu-curriculum-preview">{[['01','Learn the concept','Clear notes and explanations'],['02','Practise actively','Questions and flashcards'],['03','Review what you know','Recall and progress tracking']].map((row) => <div className="edu-curriculum-line" key={row[0]}><span>{row[0]}</span><div><strong>{row[1]}</strong><small>{row[2]}</small></div></div>)}</div>}
          {screen === 3 && <div className="edu-quiz-options">{answers.map((item) => <button key={item.id} type="button" aria-pressed={answer === item.id} className={'edu-quiz-option ' + (answer === item.id ? (item.id === 'turgid' ? 'is-correct' : 'is-incorrect') : '')} onClick={() => setAnswer(item.id)}>{item.label}</button>)}{answer && <p className={'edu-quiz-feedback ' + (answer === 'turgid' ? 'is-correct' : '')} role="status">{answer === 'turgid' ? 'Correct. Water enters by osmosis, increasing turgor pressure.' : 'Not quite. Consider the water concentration outside the cell, then try again.'}</p>}</div>}
          {screen === 4 && <div className="edu-showcase-links"><Link className="btn btn-primary" to="/resources">Explore resources →</Link><Link className="btn btn-secondary" to="/quiz">Try a quiz →</Link><Link className="edu-recall-link" to="/recall">Strengthen your memory with BioRecall</Link></div>}
          <div className="edu-showcase-controls"><button type="button" className="btn btn-secondary" disabled={screen === 0} onClick={() => change(screen - 1)}>← Back</button><span>{screen + 1} of 5</span><button type="button" className="btn btn-primary" onClick={() => change(screen === 4 ? 0 : screen + 1)}>{screen === 4 ? 'Replay tour' : 'Next step →'}</button></div>
        </div>
        <div className="edu-showcase-visual" aria-live="polite">
          {screen === 0 && <div className="edu-pathway-art"><div className="edu-orbit edu-orbit-one"/><div className="edu-orbit edu-orbit-two"/><div className="edu-pathway-core"><span>AB</span><strong>Learn with purpose</strong></div><span className="edu-orbit-tag tag-one">Biology</span><span className="edu-orbit-tag tag-two">{pathway}</span><span className="edu-orbit-tag tag-three">Progress</span></div>}
          {screen === 1 && <div className="edu-book-art"><div className="edu-book-page"><span className="edu-book-kicker">YOUR LEARNING PATH</span><strong>{pathway}</strong><i/><i className="short"/><div className="edu-book-diagram"><b/><b/><b/></div><i/><i className="medium"/></div><span className="edu-book-badge">Structured learning</span></div>}
          {screen === 2 && <><div className="edu-osmosis-visual"><span className="edu-osmosis-label">Dilute solution</span><div className={'edu-osmosis-cell ' + (water ? 'is-expanded' : '')}><div className="edu-osmosis-vacuole">Cell sap</div><strong>Plant cell</strong></div><div className={'edu-osmosis-water ' + (water ? 'is-active' : '')}><i>H₂O</i><i>H₂O</i><i>H₂O</i></div><span className="edu-osmosis-caption">{water ? 'Water enters · cell becomes turgid' : 'Watch water move into the cell'}</span></div><button type="button" className="btn btn-primary edu-water-button" onClick={() => setWater(!water)}>{water ? 'Reset illustration' : 'Show water movement'}</button></>}
          {screen === 3 && <div className="edu-quiz-art"><span className="edu-quiz-art-kicker">KNOWLEDGE CHECK</span><div className="edu-quiz-art-ring">?</div><strong>Think it through</strong><p>Use what you understand, not just what you memorised.</p><div className="edu-quiz-art-dots"><i/><i/><i/><i/></div></div>}
          {screen === 4 && <div className="edu-progress-art"><div className="edu-progress-orbit">✦</div><div className="edu-progress-card"><span>✓</span><strong>Keep building</strong><small>Learn · Practise · Recall</small><div className="edu-progress-bars"><i/><i/><i/></div></div></div>}
        </div>
      </div>
    </div>
  </section>;
}
