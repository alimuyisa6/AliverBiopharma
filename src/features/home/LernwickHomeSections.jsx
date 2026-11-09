import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-sections.css';

const pathways = [
  { id: 'o-level', label: 'O-Level Biology', title: 'Build strong foundations', description: 'Explore the living world through observation, clear scientific explanations and practical understanding.', image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop' },
  { id: 'a-level', label: 'A-Level Biology', title: 'Think across biological systems', description: 'Connect complex processes, analyse evidence and develop deeper scientific reasoning.', image: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop' },
  { id: 'pharmacy', label: 'Pharmacy', title: 'Connect science with medicines', description: 'Explore pharmaceutical science, medicines and their role in patient care.', image: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop' }
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
      { icon: 'book-open', label: 'Understand a topic', title: 'Biology notes', description: 'Work through explanations organised around your curriculum.', route: '/notes', action: 'Open notes' },
      { icon: 'microscope', label: 'Build scientific vocabulary', title: 'Biology glossary', description: 'Strengthen your understanding of important biological terms.', route: '/glossary', action: 'Explore terms' },
      { icon: 'book-open', label: 'Prepare for assessment', title: 'Past examination papers', description: 'Practise with available Biology examination papers.', route: '/past-papers', action: 'View papers' }
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
      { icon: 'book-open', label: 'Develop deeper understanding', title: 'Advanced topic notes', description: 'Study detailed explanations across your Biology curriculum.', route: '/notes', action: 'Study notes' },
      { icon: 'brain', label: 'Test your reasoning', title: 'Knowledge checks', description: 'Use focused questions to identify concepts that need more work.', route: '/quiz', action: 'Practise questions' },
      { icon: 'file-text', label: 'Prepare for examinations', title: 'Past examination papers', description: 'Apply your knowledge to available examination papers.', route: '/past-papers', action: 'View papers' }
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
      { icon: 'book-open', label: 'Study your programme', title: 'Pharmacy course notes', description: 'Explore explanations organised around your course units.', route: '/notes', action: 'Open notes' },
      { icon: 'atom', label: 'Strengthen recall', title: 'Pharmacy flashcards', description: 'Review key concepts and terminology through active recall.', route: '/flashcards', action: 'Study flashcards' },
      { icon: 'clipboard-check', label: 'Check your understanding', title: 'Knowledge practice', description: 'Test your understanding of pharmaceutical concepts.', route: '/quiz', action: 'Start practice' }
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
              <div className="lernwick-pathway-image">
                <img src={pathway.image} alt="" loading="lazy" width="720" height="480" />
                <span>{pathway.label}</span>
              </div>
              <div className="lernwick-pathway-body">
                <h3>{pathway.title}</h3>
                <p>{pathway.description}</p>
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

function ProgrammeStudio({ studio, activeGroupName }) {
  return (
    <section className={`lernwick-programme-studio section lernwick-programme-studio--${studio.kind}`} aria-labelledby="programme-studio-title">
      <div className="container">
        <div className="lernwick-studio-layout">
          <div className="lernwick-studio-intro">
            <p className="lernwick-note">{studio.eyebrow}{activeGroupName ? ` · ${activeGroupName}` : ''}</p>
            <h2 id="programme-studio-title">{studio.title}</h2>
            <p>{studio.description}</p>
            <Link className="lernwick-dark-button" to="/resources">Explore your curriculum <Icon name="arrow-right" /></Link>
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
>
      </div>
    </section>
  );
}

export default function LernwickHomeSections({ activeLevelName, activeGroupName }) {
  const studio = resolveStudio(activeLevelName, activeGroupName);
  return <><>{studio ? <ProgrammeStudio studio={studio} activeGroupName={activeGroupName} /> : <PublicPathways />}</><HowLearningWorks studio={studio} /></>;
}
