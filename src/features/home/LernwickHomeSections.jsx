import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';

const pathways = [
  { id: 'o-level', label: 'O-Level Biology', title: 'Build strong foundations', description: 'Explore the living world through observation, clear scientific explanations and practical understanding.', icon: 'cell' },
  { id: 'a-level', label: 'A-Level Biology', title: 'Think across biological systems', description: 'Connect complex processes, analyse evidence and develop deeper scientific reasoning.', icon: 'atom' },
  { id: 'pharmacy', label: 'Pharmacy', title: 'Connect science with medicines', description: 'Explore pharmaceutical science, medicines and their role in patient care.', icon: 'pill-bottle' }
];

const studios = {
  olevel: {
    kind: 'biology-foundations',
    eyebrow: 'O-Level Biology studio',
    title: 'See Biology. Understand how life works.',
    description: 'Build a clear foundation in living systems, from cell structure to human physiology, with learning activities matched to your level.',
    visual: 'cell',
    visualLabel: 'Explore living systems',
    cards: [
      { icon: 'book-open-reader', label: 'Understand a topic', title: 'Biology notes', description: 'Work through explanations organised around your curriculum.', resource: 'notes', action: 'Open notes' },
      { icon: 'dna', label: 'Build scientific vocabulary', title: 'Biology glossary', description: 'Strengthen your understanding of important biological terms.', resource: 'notes', action: 'Explore terms' },
      { icon: 'file-contract', label: 'Prepare for assessment', title: 'Past examination papers', description: 'Practise with available Biology examination papers.', resource: 'past-papers', action: 'View papers' }
    ]
  },
  alevel: {
    kind: 'advanced-biology',
    eyebrow: 'A-Level Biology studio',
    title: 'Connect biological concepts. Think critically.',
    description: 'Explore complex biological processes, strengthen scientific reasoning and practise applying knowledge to examination questions.',
    visual: 'molecule',
    visualLabel: 'Explore biological mechanisms',
    cards: [
      { icon: 'dna', label: 'Develop deeper understanding', title: 'Advanced topic notes', description: 'Study detailed explanations across your Biology curriculum.', resource: 'notes', action: 'Study notes' },
      { icon: 'brain-circuit', label: 'Test your reasoning', title: 'Knowledge checks', description: 'Use focused questions to identify concepts that need more work.', resource: 'quiz', action: 'Practise questions' },
      { icon: 'file-contract', label: 'Prepare for examinations', title: 'Past examination papers', description: 'Apply your knowledge to available examination papers.', resource: 'past-papers', action: 'View papers' }
    ]
  },
  pharmacy: {
    kind: 'pharmacy-science',
    eyebrow: 'Pharmacy learning studio',
    title: 'Understand medicines. Apply pharmaceutical science.',
    description: 'Study the science behind medicines through course-unit learning, terminology and structured knowledge practice.',
    visual: 'pharmacy',
    visualLabel: 'Explore pharmaceutical science',
    cards: [
      { icon: 'book-open-reader', label: 'Study your programme', title: 'Pharmacy course notes', description: 'Explore explanations organised around your course units.', resource: 'notes', action: 'Open notes' },
      { icon: 'pill-bottle', label: 'Strengthen recall', title: 'Pharmacy flashcards', description: 'Review key concepts and terminology through active recall.', resource: 'flashcards', action: 'Study flashcards' },
      { icon: 'clinical-case', label: 'Check your understanding', title: 'Knowledge practice', description: 'Test your understanding of pharmaceutical concepts.', resource: 'quiz', action: 'Start practice' }
    ]
  }
};

function resolveStudio(activeLevelName, activeGroupName) {
  const value = `${activeLevelName || ''} ${activeGroupName || ''}`.toLowerCase();
  if (/pharmacy|pharmaceut/.test(value)) return studios.pharmacy;
  if (/a[ -]?level|advanced level|form 5|form 6/.test(value)) return studios.alevel;
  if (/o[ -]?level|ordinary level|form 1|form 2|form 3|form 4/.test(value)) return studios.olevel;
  return null;
}

function PublicPathways() {
  return (
    <section className="w-full bg-[#E8F4F2] py-16 sm:py-20" id="pathways" aria-labelledby="lernwick-pathways-title">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-9 grid grid-cols-1 items-center gap-5 md:grid-cols-[minmax(0,1fr)_260px]">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">One platform. Distinct learning journeys.</p>
            <h2 id="lernwick-pathways-title">Choose the science you want to explore</h2>
            <p>Each programme has its own subject focus and learning experience.</p>
          </div>
          <img
            src="/Svg%20illustrations/Online%20learning-rafiki%20(3).svg"
            alt="Student taking part in online learning"
            loading="lazy"
            decoding="async"
            className="mx-auto w-full max-w-[240px] md:max-w-[260px]"
          />
        </div>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {pathways.map((pathway) => (
            <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg" key={pathway.id}>
              <div className="flex min-h-48 flex-col items-start justify-between bg-primary-50 p-7 text-primary-800" aria-hidden="true">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white text-primary-700 shadow-md"><Icon name={pathway.icon} size="3.25rem" monochrome /></span>
                <span>{pathway.label}</span>
              </div>
              <div className="p-7">
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
                <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-secondary-700" to="/resources">Explore learning resources <Icon name="arrow-right" /></Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

const learningSteps = {
  olevel: [
    ['01', 'Observe', 'Explore diagrams and examples of living things.'],
    ['02', 'Understand', 'Read explanations that build one Biology idea at a time.'],
    ['03', 'Practise', 'Check your understanding with questions and recall.'],
    ['04', 'Prepare', 'Apply what you know to examination questions.']
  ],
  alevel: [
    ['01', 'Connect concepts', 'Relate biological structures to their functions.'],
    ['02', 'Analyse evidence', 'Interpret data, processes and experimental results.'],
    ['03', 'Apply knowledge', 'Use biological principles to solve unfamiliar problems.'],
    ['04', 'Evaluate', 'Test your understanding with advanced questions.']
  ],
  pharmacy: [
    ['01', 'Learn the science', 'Study medicines, formulations and the body systems they affect.'],
    ['02', 'Build accuracy', 'Strengthen terminology, calculations and core concepts.'],
    ['03', 'Apply knowledge', 'Work through pharmaceutical and patient-care scenarios.'],
    ['04', 'Review', 'Use recall and assessments to identify what needs revision.']
  ],
  general: [
    ['01', 'Choose a pathway', 'Select the Biology or Pharmacy programme you are studying.'],
    ['02', 'Understand', 'Learn through structured explanations and supporting resources.'],
    ['03', 'Practise', 'Use questions and recall to check your understanding.'],
    ['04', 'Progress', 'Review your knowledge and continue to the next topic.']
  ]
};

function HowLearningWorks({ studio }) {
  const steps = studio ? learningSteps[studio.kind === 'biology-foundations' ? 'olevel' : studio.kind === 'advanced-biology' ? 'alevel' : 'pharmacy'] : learningSteps.general;
  return (
    <section className="w-full bg-[#526B8A] py-16 sm:py-20" id="how" aria-labelledby="lernwick-how-title">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-white">A clear learning process</p>
            <h2 id="lernwick-how-title" className="text-white"><span className="organic-letter organic-letter--accent">L</span>earn, practise and progress</h2>
            <p className="">Your learning journey moves from understanding concepts to applying and strengthening them.</p>
          </div>
        </div>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map(([number, title, description]) => (
            <li className="rounded-2xl border border-primary-100 bg-white p-6 shadow-sm" key={number}>
              <span className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 text-lg font-extrabold text-primary-800">{number}</span>
              <span className="mb-4 block h-1 w-12 rounded-full bg-secondary-500" aria-hidden="true" />
              <h3>{title}</h3>
              <p>{description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

const connectedLearningStages = [
  {
    key: 'learn',
    number: '01',
    title: 'Learn',
    description: 'Build understanding with structured explanations and supporting references.',
    links: [
      { label: 'Study notes', detail: 'Read topic explanations', to: '/notes', icon: 'book-open-reader' },
      { label: 'PDF library', detail: 'Open study documents', to: '/pdfs', icon: 'file-pdf' },
      { label: 'Glossary', detail: 'Clarify key terminology', to: '/resources', icon: 'spell-check' }
    ]
  },
  {
    key: 'practise',
    number: '02',
    title: 'Practise',
    description: 'Strengthen understanding through active retrieval and question practice.',
    links: [
      { label: 'Question practice', detail: 'Answer curriculum questions', to: '/quiz', icon: 'clipboard-check' },
      { label: 'Question bank', detail: 'Search questions and build custom tests', to: '/question-bank', icon: 'file-search' },
      { label: 'Flashcards', detail: 'Recall important concepts', to: '/flashcards', icon: 'layer-group' },
      { label: 'Spaced recall', detail: 'Revisit what you have learned', to: '/recall', icon: 'brain' }
    ]
  },
  {
    key: 'apply',
    number: '03',
    title: 'Apply',
    description: 'Use your knowledge in assessment and collaborative learning contexts.',
    links: [
      { label: 'Past papers', detail: 'Work through exam papers', to: '/past-papers', icon: 'file-lines' },
      { label: 'Clinical simulations', detail: 'Apply knowledge to reviewed patient cases', to: '/clinical-simulations', icon: 'clinical-case' },
      { label: 'Daily challenges', detail: 'Take a focused knowledge challenge', to: '/challenges', icon: 'flag' },
      { label: 'Classroom', detail: 'Continue learning with your class', to: '/classroom', icon: 'users' }
    ]
  },
  {
    key: 'review',
    number: '04',
    title: 'Review',
    description: 'Use feedback and progress signals to decide what to strengthen next.',
    links: [
      { label: 'Learning dashboard', detail: 'Review your learning progress', to: '/dashboard', icon: 'chart-line' },
      { label: 'Quiz review', detail: 'Revisit completed quiz attempts', to: '/quiz/review', icon: 'list-check' },
      { label: 'Continue learning', detail: 'Return to your curriculum', to: '/resources', icon: 'route' }
    ]
  }
];

export function ConnectedLearning() {
  return (
    <section className="w-full bg-white py-16 sm:py-20" id="connected-learning" aria-labelledby="lernwick-connected-title">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="mb-9 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">One connected learning experience</p>
            <h2 id="lernwick-connected-title">Move from understanding to confident application</h2>
            <p>Each stage builds on the previous one. Choose a tool when you need it, then return to your learning pathway.</p>
          </div>
          <Link className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary-300 bg-white px-5 py-3 text-sm font-bold text-primary-800 transition hover:bg-primary-50" to="/resources">Explore all resources <Icon name="arrow-right" /></Link>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {connectedLearningStages.map((stage) => (
            <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={stage.key}>
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-100 text-sm font-extrabold text-secondary-800">{stage.number}</span>
                <h3>{stage.title}</h3>
              </div>
              <p className="mb-5 text-sm leading-7 text-slate-600">{stage.description}</p>
              <div className="flex flex-col gap-2">
                {stage.links.map((item) => (
                  <Link className="group flex min-w-0 items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-3 transition hover:border-primary-200 hover:bg-primary-50" to={item.to} key={item.label}>
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700"><Icon name={item.icon} size="1.75rem" monochrome /></span>
                    <span className="flex min-w-0 flex-1 flex-col"><strong>{item.label}</strong><small>{item.detail}</small></span>
                    <Icon name="arrow-right" />
                  </Link>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProgrammeStudio({ studio, activeGroupName, activeGroupId }) {
  return (
    <section className="w-full bg-[#E8F4F2] py-16 sm:py-20" aria-labelledby="programme-studio-title">
      <div className="mx-auto w-full max-w-7xl px-5 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_0.8fr]">
          <div className="max-w-2xl">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.16em] text-secondary-700">{studio.eyebrow}{activeGroupName ? ` · ${activeGroupName}` : ''}</p>
            <h2 id="programme-studio-title">{studio.title}</h2>
            <p>{studio.description}</p>
          </div>
          <div className="relative flex min-h-72 flex-col items-center justify-center overflow-hidden rounded-[2rem] border border-secondary-200 bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 p-8 text-white shadow-xl" aria-label={studio.visualLabel}>
            <span className="lernwick-studio-orbit lernwick-studio-orbit--one" />
            <span className="lernwick-studio-orbit lernwick-studio-orbit--two" />
            <span className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full border border-white/25 bg-white/10 text-secondary-200 shadow-2xl backdrop-blur">
              <Icon name={studio.visual === 'pharmacy' ? 'pill-bottle' : studio.visual === 'molecule' ? 'dna' : 'cell'} size="4.25rem" monochrome />
            </span>
            <span className="relative z-10 mt-6 text-sm font-semibold tracking-wide text-white/85">{studio.visualLabel}</span>
          </div>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3" aria-label="Explore learning resources">
          {studio.cards.map((card, index) => {
            const destination = activeGroupId && card.resource
              ? `/curriculum/${encodeURIComponent(activeGroupId)}?resource=${encodeURIComponent(card.resource)}`
              : (card.route || (activeGroupId ? `/curriculum/${encodeURIComponent(activeGroupId)}` : '/resources'));

            return (
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm" key={card.title}>
                <span className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary-100 text-primary-700"><Icon name={card.icon} size="2rem" monochrome /></span>
                <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-secondary-700">{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Link className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-primary-700 transition hover:text-secondary-700" to={destination}>{card.action}<Icon name="arrow-right" /></Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function ProgrammeDiscovery({ activeLevelName, activeGroupName, activeGroupId }) {
  const studio = resolveStudio(activeLevelName, activeGroupName);
  return studio
    ? <ProgrammeStudio studio={studio} activeGroupName={activeGroupName} activeGroupId={activeGroupId} />
    : <PublicPathways />;
}

export function LearningProcess({ activeLevelName, activeGroupName }) {
  const studio = resolveStudio(activeLevelName, activeGroupName);
  return <HowLearningWorks studio={studio} />;
}

export default function LernwickHomeSections({ activeLevelName, activeGroupName }) {
  return (
    <>
      <ProgrammeDiscovery activeLevelName={activeLevelName} activeGroupName={activeGroupName} />
      <LearningProcess activeLevelName={activeLevelName} activeGroupName={activeGroupName} />
    </>
  );
}
