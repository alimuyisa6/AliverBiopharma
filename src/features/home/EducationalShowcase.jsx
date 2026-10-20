import { useState } from 'react';
import { Link } from 'react-router-dom';
import './EducationalShowcase.css';
import StickyNotePolaroidFrame from '../../components/StickyNotePolaroidFrame/StickyNotePolaroidFrame';

const screens = [
  { label: 'Pathway', eyebrow: '01 · YOUR PATHWAY', title: 'Start with your learning pathway', text: 'Choose O-Level, A-Level or Pharmacy to find materials for your studies.' },
  { label: 'Curriculum', eyebrow: '02 · YOUR CURRICULUM', title: 'Make sense of each topic', text: 'Start with the key idea, see how it works, then try a question.' },
  { label: 'Visual lesson', eyebrow: '03 · VISUAL LEARNING', title: 'See osmosis in action', text: 'Watch how water moves across a partially permeable membrane.' },
  { label: 'Quick quiz', eyebrow: '04 · CHECK YOUR UNDERSTANDING', title: 'Check what you understand', text: 'A plant cell is placed in distilled water. What happens next?' },
  { label: 'Next steps', eyebrow: '05 · KEEP THE KNOWLEDGE', title: 'Keep what you learn', text: 'Study the idea, test yourself, and return to anything you missed.' }
];
const pathways = [
  { id: 'O-Level', detail: 'Build Biology foundations topic by topic', icon: '◉' },
  { id: 'A-Level', detail: 'Explain complex Biology with confidence', icon: '⌬' },
  { id: 'Pharmacy', detail: 'Link science to medicines and safe use', icon: '⚕' }
];
const pathwayKnowledge = {
  'O-Level': [
    ['Cells and organisation', 'Relate cell structures to the jobs they perform.'],
    ['Nutrition and transport', 'Explain how organisms obtain and move essential materials.'],
    ['Ecology and inheritance', 'Use evidence to explain relationships and variation.']
  ],
  'A-Level': [
    ['Membranes and transport', 'Explain diffusion, osmosis and active transport using gradients.'],
    ['Homeostasis', 'Trace how feedback helps keep internal conditions stable.'],
    ['Genetics and evolution', 'Connect inheritance patterns with variation and selection.']
  ],
  Pharmacy: [
    ['Drug structure and properties', 'Relate functional groups to solubility and drug behaviour.'],
    ['Pharmacology foundations', 'Connect a drug target to its therapeutic effect.'],
    ['Safe medicine use', 'Consider dose, interactions and patient-specific factors.']
  ]
};
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
  const change = (value) => {
    setScreen(Math.max(0, Math.min(4, value)));
    setAnswer('');
  };
  const current = screens[screen];

  return <section className="section educational-showcase" aria-labelledby="edu-showcase-title">
    <header className="edu-showcase-heading"><span className="eyebrow">LEARN · TRY · REMEMBER</span><h2 id="edu-showcase-title">Learn it. Try it. Remember it.</h2><p className="section-description">Choose a pathway, explore a lesson, and try a question.</p></header>
    <div className="edu-showcase-shell">
      <nav className="edu-showcase-steps" aria-label="Learning tour">
        {screens.map((item, index) => <button key={item.label} type="button" aria-current={screen === index ? 'step' : undefined} className={'edu-showcase-step ' + (screen === index ? 'is-current' : '')} onClick={() => change(index)}><span className="edu-showcase-step-number">{'0' + (index + 1)}</span><span>{item.label}</span></button>)}
      </nav>
      <div className="edu-showcase-content">
        <div className="edu-showcase-copy"><span className="eyebrow">{current.eyebrow}</span><h3>{current.title}</h3><p>{current.text}</p>
          {screen === 0 && <div className="edu-pathway-options">{pathways.map((item) => <button key={item.id} type="button" aria-pressed={pathway === item.id} className={'edu-pathway-option ' + (pathway === item.id ? 'is-selected' : '')} onClick={() => setPathway(item.id)}><span className="edu-pathway-icon">{item.icon}</span><span><strong>{item.id}</strong><small>{item.detail}</small></span><span className="edu-pathway-radio" /></button>)}</div>}
          {screen === 1 && <><div className="edu-curriculum-preview">{[['01','Understand','Get the key idea clear.'],['02','Apply','Use it to answer a question.'],['03','Remember','Recall it without looking.']].map((row) => <div className="edu-curriculum-line" key={row[0]}><span>{row[0]}</span><div><strong>{row[1]}</strong><small>{row[2]}</small></div></div>)}</div><div className="edu-knowledge-spotlight"><span className="edu-knowledge-label">{pathway} · KNOWLEDGE SPOTLIGHT</span>{pathwayKnowledge[pathway].map(([title, detail]) => <article className="edu-knowledge-item" key={title}><strong>{title}</strong><p>{detail}</p></article>)}</div></>}
          {screen === 3 && <div className="edu-quiz-options">{answers.map((item) => <button key={item.id} type="button" aria-pressed={answer === item.id} className={'edu-quiz-option ' + (answer === item.id ? (item.id === 'turgid' ? 'is-correct' : 'is-incorrect') : '')} onClick={() => setAnswer(item.id)}>{item.label}</button>)}{answer && <p className={'edu-quiz-feedback ' + (answer === 'turgid' ? 'is-correct' : '')} role="status">{answer === 'turgid' ? 'Correct. Water enters by osmosis, increasing turgor pressure and helping support the plant.' : 'Not quite. Distilled water has a higher water potential than the cell sap, so water enters the cell by osmosis.'}</p>}</div>}
          {screen === 4 && <div className="edu-showcase-links"><Link className="btn btn-primary" to="/resources">Explore resources →</Link><Link className="btn btn-secondary" to="/quiz">Try a quiz →</Link><Link className="edu-recall-link" to="/recall">Strengthen your memory with BioRecall</Link></div>}
          <div className="edu-showcase-controls"><button type="button" className="btn btn-secondary edu-showcase-nav-button" disabled={screen === 0} onClick={() => change(screen - 1)} aria-label="Previous step"><svg className="edu-showcase-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 12H5M12 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg><span>Back</span></button><span>{screen + 1} of 5</span><button type="button" className="btn btn-primary edu-showcase-nav-button" onClick={() => change(screen === 4 ? 0 : screen + 1)}>{screen === 4 ? <><span>Replay tour</span><svg className="edu-showcase-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 7v5h-5M4.9 9A7.5 7.5 0 0 1 18 6l2 6M4 17v-5h5m6.1 3A7.5 7.5 0 0 1 6 18l-2-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></> : <><span>Next step</span><svg className="edu-showcase-nav-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M5 12h14M12 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg></>}</button></div>
        </div>
        <div className="edu-showcase-visual" aria-live="polite">
          {screen === 0 && <StickyNotePolaroidFrame noteTitle={pathway + ' pathway'} noteText={pathways.find((item) => item.id === pathway)?.detail || 'Explore science with purpose.'} noteFooter="Explore · Understand · Practise" noteColor={pathway === 'Pharmacy' ? 'teal' : pathway === 'A-Level' ? 'blue' : 'gold'} rotation={-1} className="edu-showcase-polaroid"><div className="edu-pathway-art"><div className="edu-orbit edu-orbit-one"/><div className="edu-orbit edu-orbit-two"/><div className="edu-pathway-core"><span>AB</span><strong>Learn with purpose</strong></div><span className="edu-orbit-tag tag-one">Biology</span><span className="edu-orbit-tag tag-two">{pathway}</span><span className="edu-orbit-tag tag-three">Progress</span></div></StickyNotePolaroidFrame>}
          {screen === 1 && <div className="edu-book-art"><div className="edu-book-page"><span className="edu-book-kicker">YOUR LEARNING PATH</span><strong>{pathway}</strong><i/><i className="short"/><div className="edu-book-diagram"><b/><b/><b/></div><i/><i className="medium"/></div><span className="edu-book-badge">Understand · Apply · Recall</span></div>}
          {screen === 2 && <><div className="edu-osmosis-visual"><span className="edu-osmosis-label">Distilled water outside</span><div className={'edu-osmosis-cell ' + (water ? 'is-expanded' : '')}><div className="edu-osmosis-vacuole">Cell sap</div><strong>Plant cell</strong></div><div className={'edu-osmosis-water ' + (water ? 'is-active' : '')}><i>H₂O</i><i>H₂O</i><i>H₂O</i></div><span className="edu-osmosis-caption">{water ? 'Water enters · turgor pressure rises' : 'Watch water move into the cell'}</span></div><button type="button" className="btn btn-primary edu-water-button" onClick={() => setWater(!water)}>{water ? 'Reset illustration' : 'Show water movement'}</button></>}
          {screen === 3 && <div className="edu-quiz-art"><span className="edu-quiz-art-kicker">KNOWLEDGE CHECK</span><div className="edu-quiz-art-ring">?</div><strong>Think it through</strong><p>Use what you understand, not just what you memorised.</p><div className="edu-quiz-art-dots"><i/><i/><i/><i/></div></div>}
          {screen === 4 && <div className="edu-progress-art"><div className="edu-progress-orbit">✦</div><div className="edu-progress-card"><span>✓</span><strong>Keep building</strong><small>Learn · Practise · Recall</small><div className="edu-progress-bars"><i/><i/><i/></div></div></div>}
        </div>
      </div>
    </div>
  </section>;
}
