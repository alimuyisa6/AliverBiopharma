import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-sections.css';

const pathways = [
  {
    id: 'o-level',
    label: 'O-Level Biology',
    title: 'Build strong Biology foundations',
    description: 'Explore school Biology topics, understand key processes and prepare for examinations.',
    image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop'
  },
  {
    id: 'a-level',
    label: 'A-Level Biology',
    title: 'Understand Biology in greater depth',
    description: 'Develop advanced biological understanding through structured topics and examination practice.',
    image: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop'
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy programmes',
    title: 'Connect science with medicines',
    description: 'Explore Pharmacy Certificate, Diploma and Degree course units and study materials.',
    image: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop'
  }
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
      { icon: 'file-text', label: 'Prepare for assessment', title: 'Past examination papers', description: 'Practise with available Biology examination papers.', route: '/past-papers', action: 'View papers' }
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
      { icon: 'layers', label: 'Strengthen recall', title: 'Pharmacy flashcards', description: 'Review key concepts and terminology through active recall.', route: '/flashcards', action: 'Study flashcards' },
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
            <p className="lernwick-note">Find your starting point</p>
            <h2 id="lernwick-pathways-title"><span className="organic-letter organic-letter--primary">L</span>earning pathways for every stage</h2>
            <p>Choose the Biology or Pharmacy programme that matches what you are studying.</p>
          </div>
          <Link className="lernwick-outline-button" to="/register">Choose your programme <Icon name="arrow-right" /></Link>
        </div>
        <div className="lernwick-pathway-grid">
          {pathways.map((pathway) => (
            <article className="lernwick-pathway-card" key={pathway.id}>
              <Link to="/resources" className="lernwick-pathway-link" aria-label={`Explore ${pathway.label}`}>
                <div className="lernwick-pathway-image">
                  <img src={pathway.image} alt="" loading="lazy" width="720" height="480" />
                  <span>{pathway.label}</span>
                </div>
                <div className="lernwick-pathway-body">
                  <h3>{pathway.title}</h3>
                  <p>{pathway.description}</p>
                  <span className="lernwick-pathway-action">Explore programme <Icon name="arrow-right" /></span>
                </div>
              </Link>
            </article>
          ))}
        </div>
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
              <Icon name={studio.visual === 'pharmacy' ? 'pill' : studio.visual === 'molecule' ? 'dna' : 'microscope'} />
            </span>
            <span className="lernwick-studio-visual-label">{studio.visualLabel}</span>
          </div>
        </div>
        <div className="lernwick-studio-card-grid">
          {studio.cards.map((card, index) => (
            <article className={`lernwick-studio-card lernwick-studio-card--${index + 1}`} key={card.title}>
              <span className="lernwick-studio-card-icon"><Icon name={card.icon} /></span>
              <span className="lernwick-studio-card-label">{card.label}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <Link to={card.route}>{card.action}<Icon name="arrow-right" /></Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LernwickHomeSections({ activeLevelName, activeGroupName }) {
  const studio = resolveStudio(activeLevelName, activeGroupName);
  return studio ? <ProgrammeStudio studio={studio} activeGroupName={activeGroupName} /> : <PublicPathways />;
}
