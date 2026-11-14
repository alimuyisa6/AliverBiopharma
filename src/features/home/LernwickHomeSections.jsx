import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-sections.css';

const pathways = [
  { id: 'o-level', label: 'O-Level Biology', title: 'Build strong foundations', description: 'Explore the living world through observation, clear scientific explanations and practical understanding.', icon: 'microscope' },
  { id: 'a-level', label: 'A-Level Biology', title: 'Think across biological systems', description: 'Connect complex processes, analyse evidence and develop deeper scientific reasoning.', icon: 'atom' },
  { id: 'pharmacy', label: 'Pharmacy', title: 'Connect science with medicines', description: 'Explore pharmaceutical science, medicines and their role in patient care.', icon: 'capsules' }
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
      { icon: 'book-open', label: 'Understand a topic', title: 'Biology notes', description: 'Work through explanations organised around your curriculum.', resource: 'notes', action: 'Open notes' },
      { icon: 'microscope', label: 'Build scientific vocabulary', title: 'Biology glossary', description: 'Strengthen your understanding of important biological terms.', resource: 'notes', action: 'Explore terms' },
      { icon: 'book-open', label: 'Prepare for assessment', title: 'Past examination papers', description: 'Practise with available Biology examination papers.', resource: 'past-papers', action: 'View papers' }
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
      { icon: 'book-open', label: 'Develop deeper understanding', title: 'Advanced topic notes', description: 'Study detailed explanations across your Biology curriculum.', resource: 'notes', action: 'Study notes' },
      { icon: 'brain', label: 'Test your reasoning', title: 'Knowledge checks', description: 'Use focused questions to identify concepts that need more work.', resource: 'quiz', action: 'Practise questions' },
      { icon: 'file-lines', label: 'Prepare for examinations', title: 'Past examination papers', description: 'Apply your knowledge to available examination papers.', resource: 'past-papers', action: 'View papers' }
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
      { icon: 'book-open', label: 'Study your programme', title: 'Pharmacy course notes', description: 'Explore explanations organised around your course units.', resource: 'notes', action: 'Open notes' },
      { icon: 'atom', label: 'Strengthen recall', title: 'Pharmacy flashcards', description: 'Review key concepts and terminology through active recall.', resource: 'flashcards', action: 'Study flashcards' },
      { icon: 'clipboard-check', label: 'Check your understanding', title: 'Knowledge practice', description: 'Test your understanding of pharmaceutical concepts.', resource: 'quiz', action: 'Start practice' }
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
    <section className="lernwick-pathways section" id="pathways" aria-labelledby="lernwick-pathways-title">
      <div className="container">
        <div className="lernwick-section-heading">
          <div>
            <p className="lernwick-note">One platform. Distinct learning journeys.</p>
            <h2 id="lernwick-pathways-title">Choose the science you want to explore</h2>
            <p>Each programme has its own subject focus and learning experience.</p>
          </div>
        </div>
        <div className="lernwick-pathway-grid">
          {pathways.map((pathway) => (
            <article className={`lernwick-pathway-card lernwick-pathway-card--${pathway.id}`} key={pathway.id}>
              <div className="lernwick-pathway-image" aria-hidden="true">
                <Icon name={pathway.icon} />
                <span>{pathway.label}</span>
              </div>
              <div className="lernwick-pathway-body">
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
                <Link className="lernwick-pathway-action" to="/resources">Explore learning resources <Icon name="arrow-right" /></Link>
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
    <section className="lernwick-how section section--soft" id="how" aria-labelledby="lernwick-how-title">
      <div className="container">
        <div className="lernwick-section-heading lernwick-section-heading--center">
          <div>
            <p className="lernwick-note">A clear learning process</p>
            <h2 id="lernwick-how-title"><span className="organic-letter organic-letter--accent">L</span>earn, practise and progress</h2>
            <p>Your learning journey moves from understanding concepts to applying and strengthening them.</p>
          </div>
        </div>
        <ol className="lernwick-step-grid">
          {steps.map(([number, title, description]) => (
            <li className="lernwick-step-card" key={number}>
              <span className="lernwick-step-number">{number}</span>
              <span className="lernwick-step-mark" aria-hidden="true" />
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
      { label: 'Study notes', detail: 'Read topic explanations', to: '/notes', icon: 'book-open' },
      { label: 'PDF library', detail: 'Open study documents', to: '/pdfs', icon: 'file-pdf' },
      { label: 'Glossary', detail: 'Clarify key terminology', to: '/glossary', icon: 'book' }
    ]
  },
  {
    key: 'practise',
    number: '02',
    title: 'Practise',
    description: 'Strengthen understanding through active retrieval and question practice.',
    links: [
      { label: 'Question practice', detail: 'Answer curriculum questions', to: '/quiz', icon: 'clipboard-check' },
      { label: 'Flashcards', detail: 'Recall important concepts', to: '/flashcards', icon: 'layers' },
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
      { label: 'Daily challenges', detail: 'Take a focused knowledge challenge', to: '/challenges', icon: 'target' },
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
      { label: 'Quiz review', detail: 'Revisit completed quiz attempts', to: '/quiz/review', icon: 'clipboard-list' },
      { label: 'Continue learning', detail: 'Return to your curriculum', to: '/resources', icon: 'arrow-right' }
    ]
  }
];

export function ConnectedLearning() {
  return (
    <section className="lernwick-connected section" id="connected-learning" aria-labelledby="lernwick-connected-title">
      <div className="container">
        <div className="lernwick-section-heading">
          <div>
            <p className="lernwick-note">One connected learning experience</p>
            <h2 id="lernwick-connected-title">Move from understanding to confident application</h2>
            <p>Each stage builds on the previous one. Choose a tool when you need it, then return to your learning pathway.</p>
          </div>
          <Link className="lernwick-outline-button" to="/resources">Explore all resources <Icon name="arrow-right" /></Link>
        </div>
        <div className="lernwick-connected-grid">
          {connectedLearningStages.map((stage) => (
            <article className={`lernwick-connected-card lernwick-connected-card--${stage.key}`} key={stage.key}>
              <div className="lernwick-connected-card-heading">
                <span className="lernwick-connected-number">{stage.number}</span>
                <h3>{stage.title}</h3>
              </div>
              <p className="lernwick-connected-description">{stage.description}</p>
              <div className="lernwick-connected-links">
                {stage.links.map((item) => (
                  <Link className="lernwick-connected-link" to={item.to} key={item.label}>
                    <span className="lernwick-connected-link-icon"><Icon name={item.icon} /></span>
                    <span className="lernwick-connected-link-copy"><strong>{item.label}</strong><small>{item.detail}</small></span>
                    <Icon name="arrow-up-right" />
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
    <section className={`lernwick-programme-studio section lernwick-programme-studio--${studio.kind}`} aria-labelledby="programme-studio-title">
      <div className="container">
        <div className="lernwick-studio-layout">
          <div className="lernwick-studio-intro">
            <p className="lernwick-note">{studio.eyebrow}{activeGroupName ? ` · ${activeGroupName}` : ''}</p>
            <h2 id="programme-studio-title">{studio.title}</h2>
            <p>{studio.description}</p>
          </div>
          <div className={`lernwick-studio-visual lernwick-studio-visual--${studio.visual}`} aria-label={studio.visualLabel}>
            <span className="lernwick-studio-orbit lernwick-studio-orbit--one" />
            <span className="lernwick-studio-orbit lernwick-studio-orbit--two" />
            <span className="lernwick-studio-visual-core">
              <Icon name={studio.visual === 'pharmacy' ? 'capsules' : studio.visual === 'molecule' ? 'atom' : 'microscope'} />
            </span>
            <span className="lernwick-studio-visual-label">{studio.visualLabel}</span>
          </div>
        </div>
        <div className="lernwick-studio-card-grid" aria-label="Explore learning resources">
          {studio.cards.map((card, index) => {
            const destination = activeGroupId && card.resource
              ? `/curriculum/${encodeURIComponent(activeGroupId)}?resource=${encodeURIComponent(card.resource)}`
              : (card.route || (activeGroupId ? `/curriculum/${encodeURIComponent(activeGroupId)}` : '/resources'));

            return (
              <article className={`lernwick-studio-card lernwick-studio-card--${index + 1}`} key={card.title}>
                <span className="lernwick-studio-card-icon"><Icon name={card.icon} /></span>
                <span className="lernwick-studio-card-label">{card.label}</span>
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Link to={destination}>{card.action}<Icon name="arrow-right" /></Link>
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
