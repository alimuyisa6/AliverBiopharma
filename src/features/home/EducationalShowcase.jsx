import { useState } from 'react';
import { Link } from 'react-router-dom';
import { UI } from '../../design-system';

const screens = [
  { label: 'Pathway', title: 'Start with your learning pathway', text: 'Choose O-Level, A-Level or Pharmacy to find materials for your studies.' },
  { label: 'Curriculum', title: 'Make sense of each topic', text: 'Start with the key idea, see how it works, then try a question.' },
  { label: 'Visual lesson', title: 'See osmosis in action', text: 'Watch how water moves across a partially permeable membrane.' },
  { label: 'Quick quiz', title: 'Check what you understand', text: 'A plant cell is placed in distilled water. What happens next?' },
  { label: 'Next steps', title: 'Keep what you learn', text: 'Study the idea, test yourself, and return to anything you missed.' }
];
const pathways = [
  { id: 'O-Level', detail: 'Build Biology foundations topic by topic', icon: '◉' },
  { id: 'A-Level', detail: 'Explain complex Biology with confidence', icon: '⌬' },
  { id: 'Pharmacy', detail: 'Link science to medicines and safe use', icon: '⚕' }
];
const pathwayKnowledge = {
  'O-Level': [['Cells and organisation', 'Relate cell structures to the jobs they perform.'], ['Nutrition and transport', 'Explain how organisms obtain and move essential materials.'], ['Ecology and inheritance', 'Use evidence to explain relationships and variation.']],
  'A-Level': [['Membranes and transport', 'Explain diffusion, osmosis and active transport using gradients.'], ['Homeostasis', 'Trace how feedback helps keep internal conditions stable.'], ['Genetics and evolution', 'Connect inheritance patterns with variation and selection.']],
  Pharmacy: [['Drug structure and properties', 'Relate functional groups to solubility and drug behaviour.'], ['Pharmacology foundations', 'Connect a drug target to its therapeutic effect.'], ['Safe medicine use', 'Consider dose, interactions and patient-specific factors.']]
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
  const change = (value) => { setScreen(Math.max(0, Math.min(4, value))); setAnswer(''); };
  const current = screens[screen];

  return (
    <section className="w-full bg-primary-50 px-4 py-12 sm:px-6 sm:py-16 lg:px-8" aria-labelledby="edu-showcase-title">
      <div className="mx-auto grid w-full max-w-7xl gap-7">
        <header className="max-w-3xl"><h2 id="edu-showcase-title" className={UI.sectionHeadingTitle}>Learn it. Try it. Remember it.</h2><p className={`${UI.sectionHeadingDescription} mt-4`}>Choose a pathway, explore a lesson, and try a question.</p></header>
        <div className="grid min-w-0 gap-5 overflow-hidden rounded-3xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8 lg:p-8">
          <nav className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-1 lg:content-start" aria-label="Learning tour">
            {screens.map((item, index) => <button key={item.label} type="button" aria-current={screen === index ? 'step' : undefined} onClick={() => change(index)} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm font-bold transition ${screen === index ? 'border-primary-300 bg-primary-50 text-primary-900' : 'border-transparent bg-background text-muted hover:border-primary-200 hover:bg-primary-50'}`}><span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-extrabold ${screen === index ? 'bg-primary-800 text-white' : 'bg-white text-primary-700'}`}>{String(index + 1).padStart(2, '0')}</span><span>{item.label}</span></button>)}
          </nav>

          <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(280px,.85fr)] xl:gap-8">
            <div className="grid content-start gap-5">
              <div><span className="text-xs font-extrabold uppercase tracking-wider text-secondary-700">Step {screen + 1} of 5</span><h3 className="mt-2 text-2xl font-extrabold leading-tight text-primary-900">{current.title}</h3><p className="mt-3 text-sm leading-7 text-muted">{current.text}</p></div>

              {screen === 0 && <div className="grid gap-3">{pathways.map((item) => <button key={item.id} type="button" aria-pressed={pathway === item.id} onClick={() => setPathway(item.id)} className={`flex min-h-20 items-center gap-4 rounded-xl border p-4 text-left transition ${pathway === item.id ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-100' : 'border-border bg-white hover:border-primary-300'}`}><span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xl font-bold text-primary-800">{item.icon}</span><span className="min-w-0 flex-1"><strong className="block text-sm font-extrabold text-primary-900">{item.id}</strong><small className="mt-1 block text-xs leading-5 text-muted">{item.detail}</small></span><span className={`h-5 w-5 rounded-full border-2 ${pathway === item.id ? 'border-primary-700 bg-primary-700 ring-4 ring-primary-100' : 'border-slate-300'}`} /></button>)}</div>}

              {screen === 1 && <div className="grid gap-5"><div className="grid gap-3 sm:grid-cols-3">{[['01','Understand','Get the key idea clear.'],['02','Apply','Use it to answer a question.'],['03','Remember','Recall it without looking.']].map((row) => <div className="grid gap-2 rounded-xl bg-primary-50 p-4" key={row[0]}><span className="text-xs font-extrabold text-secondary-700">{row[0]}</span><strong className="text-sm font-bold text-primary-900">{row[1]}</strong><small className="text-xs leading-5 text-muted">{row[2]}</small></div>)}</div><div className="grid gap-3 rounded-xl border border-border bg-white p-4"><span className="text-xs font-extrabold uppercase tracking-wider text-primary-700">{pathway} · Knowledge spotlight</span>{pathwayKnowledge[pathway].map(([title, detail]) => <article className="border-b border-border pb-3 last:border-0 last:pb-0" key={title}><strong className="text-sm font-bold text-primary-900">{title}</strong><p className="mt-1 text-xs leading-5 text-muted">{detail}</p></article>)}</div></div>}

              {screen === 3 && <div className="grid gap-3">{answers.map((item) => <button key={item.id} type="button" aria-pressed={answer === item.id} onClick={() => setAnswer(item.id)} className={`rounded-xl border p-4 text-left text-sm font-semibold leading-6 transition ${answer === item.id ? item.id === 'turgid' ? 'border-emerald-300 bg-emerald-50 text-emerald-900' : 'border-red-300 bg-red-50 text-red-900' : 'border-border bg-white text-slate-700 hover:border-primary-300 hover:bg-primary-50'}`}>{item.label}</button>)}{answer && <p className={answer === 'turgid' ? UI.status.success : UI.status.error} role="status">{answer === 'turgid' ? 'Correct. Water enters by osmosis, increasing turgor pressure and helping support the plant.' : 'Not quite. Distilled water has a higher water potential than the cell sap, so water enters the cell by osmosis.'}</p>}</div>}

              {screen === 4 && <div className="flex flex-wrap gap-3"><Link className={UI.primaryButton} to="/resources">Explore resources <span aria-hidden="true">→</span></Link><Link className={UI.secondaryButton} to="/quiz">Try a quiz <span aria-hidden="true">→</span></Link><Link className="inline-flex min-h-11 items-center text-sm font-bold text-primary-800 underline underline-offset-4 hover:text-primary-950" to="/recall">Strengthen your memory with BioRecall</Link></div>}

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"><button type="button" className={UI.secondaryButton} disabled={screen === 0} onClick={() => change(screen - 1)}><span aria-hidden="true">←</span> Back</button><span className="text-xs font-semibold text-muted">{screen + 1} of 5</span><button type="button" className={UI.primaryButton} onClick={() => change(screen === 4 ? 0 : screen + 1)}>{screen === 4 ? 'Replay tour' : 'Next step'} <span aria-hidden="true">→</span></button></div>
            </div>

            <div className="relative grid min-h-[300px] place-items-center overflow-hidden rounded-2xl bg-primary-50 p-5 sm:min-h-[360px] sm:p-7" aria-live="polite">
              {screen === 0 && <div className="relative grid h-64 w-full max-w-sm place-items-center overflow-hidden rounded-2xl bg-primary-900 p-6 text-center text-white"><span className="absolute h-52 w-52 rounded-full border border-white/20" /><span className="absolute h-40 w-40 rounded-full border border-secondary-300/40" /><div className="relative grid h-28 w-28 place-items-center rounded-full bg-secondary-500 text-3xl font-black text-white shadow-xl">AB</div><strong className="relative mt-4 text-lg">{pathway}</strong><span className="relative mt-1 text-xs text-primary-100">Explore · Understand · Practise</span></div>}
              {screen === 1 && <div className="relative w-full max-w-sm rounded-2xl border border-primary-100 bg-white p-6 shadow-lg"><span className="text-xs font-extrabold tracking-wider text-secondary-700">YOUR LEARNING PATH</span><strong className="mt-4 block text-2xl font-extrabold text-primary-900">{pathway}</strong><div className="mt-5 grid gap-3"><span className="h-2 w-full rounded-full bg-primary-100" /><span className="h-2 w-4/5 rounded-full bg-primary-100" /><span className="h-2 w-3/5 rounded-full bg-primary-100" /></div><div className="mt-6 grid grid-cols-3 gap-2">{['Understand','Apply','Recall'].map((label) => <span key={label} className="rounded-lg bg-secondary-50 px-2 py-3 text-center text-[10px] font-bold text-secondary-800">{label}</span>)}</div></div>}
              {screen === 2 && <div className="grid w-full max-w-sm justify-items-center gap-4"><span className="text-xs font-extrabold uppercase tracking-wider text-primary-800">Distilled water outside</span><div className={`relative grid h-52 w-64 place-items-center rounded-[2.5rem] border-4 border-primary-700 bg-primary-100 transition-all duration-500 ${water ? 'scale-105' : ''}`}><div className={`grid h-28 w-36 place-items-center rounded-[2rem] border-4 border-secondary-500 bg-secondary-100 text-center text-xs font-bold text-secondary-900 transition-all duration-500 ${water ? 'h-36 w-44' : ''}`}>Cell sap<br />Plant cell</div><span className="absolute -left-7 top-1/2 -translate-y-1/2 text-primary-700">H₂O</span><span className="absolute -right-7 top-1/3 text-primary-700">H₂O</span><span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-primary-700">H₂O</span></div><p className="text-center text-xs font-semibold text-muted">{water ? 'Water enters · turgor pressure rises' : 'Water moves into the cell by osmosis'}</p><button type="button" className={UI.primaryButton} onClick={() => setWater(!water)}>{water ? 'Reset illustration' : 'Show water movement'}</button></div>}
              {screen === 3 && <div className="grid justify-items-center gap-4 text-center"><span className="inline-flex h-28 w-28 items-center justify-center rounded-full border-[10px] border-primary-100 bg-primary-800 text-5xl font-black text-white">?</span><strong className="text-xl font-extrabold text-primary-900">Think it through</strong><p className="max-w-xs text-sm leading-6 text-muted">Use what you understand, not just what you memorised.</p><div className="flex gap-2">{[0,1,2,3].map((n) => <span key={n} className="h-2 w-8 rounded-full bg-secondary-400" />)}</div></div>}
              {screen === 4 && <div className="relative grid w-full max-w-sm gap-4 rounded-2xl border border-primary-100 bg-white p-6 shadow-lg"><span className="absolute -right-3 -top-4 text-3xl text-secondary-500" aria-hidden="true">✦</span><strong className="text-xl font-extrabold text-primary-900">Keep building</strong><span className="text-sm text-muted">Learn · Practise · Recall</span><div className="grid gap-3">{[1,2,3].map((n) => <span key={n} className="h-3 rounded-full bg-primary-100"><span className={`block h-full rounded-full ${n === 1 ? 'w-full bg-primary-700' : n === 2 ? 'w-4/5 bg-secondary-500' : 'w-3/5 bg-emerald-500'}`} /></span>)}</div><span className="text-xs font-bold text-emerald-700">Progress grows with practice</span></div>}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
