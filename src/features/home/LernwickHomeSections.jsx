import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-sections.css';

const pathways = [
  {
    id: 'o-level',
    label: 'O-Level Biology',
    title: 'Build strong Biology foundations',
    description: 'Work through school Biology topics with notes, revision materials, questions and exam practice.',
    image: 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop',
    tone: 'peach'
  },
  {
    id: 'a-level',
    label: 'A-Level Biology',
    title: 'Explore Biology in greater depth',
    description: 'Strengthen your understanding with detailed topic resources, diagrams, past papers and active recall.',
    image: 'https://images.pexels.com/photos/3825586/pexels-photo-3825586.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop',
    tone: 'sage'
  },
  {
    id: 'pharmacy',
    label: 'Pharmacy programmes',
    title: 'Connect science with medicines',
    description: 'Study Pharmacy Certificate, Diploma and Degree course units with focused learning resources.',
    image: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=720&h=480&fit=crop',
    tone: 'peach'
  }
];

const steps = [
  {
    number: '01',
    title: 'Choose your pathway',
    description: 'Select O-Level Biology, A-Level Biology or your Pharmacy programme.'
  },
  {
    number: '02',
    title: 'Explore the learning material',
    description: 'Use topic notes, videos, PDFs and other resources to understand each subject.'
  },
  {
    number: '03',
    title: 'Practise what you learn',
    description: 'Test your knowledge with quizzes and flashcards, then revisit difficult areas.'
  },
  {
    number: '04',
    title: 'Strengthen your memory',
    description: 'Use active recall and spaced repetition to revisit information over time.'
  }
];

export default function LernwickHomeSections() {
  return (
    <div className="lernwick-home-sections">
      <section className="lernwick-pathways section" id="pathways" aria-labelledby="lernwick-pathways-title">
        <div className="container">
          <div className="lernwick-section-heading">
            <div>
              <p className="lernwick-note">Find your starting point</p>
              <h2 id="lernwick-pathways-title">Learning pathways for every stage</h2>
              <p>Explore the Biology and Pharmacy learning areas available on AliverBiopharm.</p>
            </div>
            <Link className="lernwick-outline-button" to="/resources">Browse resources <Icon name="arrow-right" /></Link>
          </div>
          <div className="lernwick-pathway-grid">
            {pathways.map((pathway) => (
              <article className={`lernwick-pathway-card lernwick-pathway-card--${pathway.tone}`} key={pathway.id}>
                <Link to="/resources" className="lernwick-pathway-link" aria-label={`Explore ${pathway.label} resources`}>
                  <div className="lernwick-pathway-image">
                    <img src={pathway.image} alt="" loading="lazy" width="720" height="480" />
                    <span>{pathway.label}</span>
                  </div>
                  <div className="lernwick-pathway-body">
                    <h3>{pathway.title}</h3>
                    <p>{pathway.description}</p>
                    <span className="lernwick-pathway-action">Explore pathway <Icon name="arrow-right" /></span>
                  </div>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lernwick-how section section--soft" id="how" aria-labelledby="lernwick-how-title">
        <div className="container">
          <div className="lernwick-section-heading lernwick-section-heading--center">
            <div>
              <p className="lernwick-note">No timetable, no pressure</p>
              <h2 id="lernwick-how-title">A simple way to keep learning</h2>
              <p>Move from choosing a topic to understanding it, practising it and remembering it.</p>
            </div>
          </div>
          <ol className="lernwick-step-grid">
            {steps.map((step) => (
              <li className="lernwick-step-card" key={step.number}>
                <span className="lernwick-step-number">{step.number}</span>
                <span className="lernwick-step-mark" aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="lernwick-about section" aria-labelledby="lernwick-about-title">
        <div className="container lernwick-about-grid">
          <div className="lernwick-about-media">
            <img src="https://images.pexels.com/photos/8199770/pexels-photo-8199770.jpeg?auto=compress&cs=tinysrgb&w=800&h=900&fit=crop" alt="Students studying together at a library table" loading="lazy" width="800" height="900" />
            <div className="lernwick-about-sticker">
              <strong>Learn</strong>
              <span>Practise</span>
              <strong>Remember</strong>
            </div>
          </div>
          <div className="lernwick-about-copy">
            <p className="lernwick-note">About the platform</p>
            <h2 id="lernwick-about-title">A focused space for Biology and Pharmacy learning</h2>
            <p>AliverBiopharm brings learning resources and study tools together, helping students move beyond reading and take an active role in understanding their subjects.</p>
            <ul>
              <li><Icon name="circle-check" /><span>Learning resources organised around your level or programme.</span></li>
              <li><Icon name="circle-check" /><span>Quizzes and flashcards for testing what you know.</span></li>
              <li><Icon name="circle-check" /><span>Active recall to help strengthen long-term memory.</span></li>
            </ul>
            <Link className="lernwick-dark-button" to="/resources">Start exploring <Icon name="arrow-right" /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
