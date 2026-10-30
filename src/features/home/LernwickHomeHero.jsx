import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName }) {
  const learningPath = [activeLevelName, activeGroupName].filter(Boolean).join(' · ');
  const greeting = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];

  return (
    <section className="lernwick-hero" aria-labelledby="lernwick-hero-title">
      <div className="lernwick-hero__inner">
        <div className="lernwick-hero__copy">
          <span className="lernwick-hero__eyebrow">
            <span className="lernwick-hero__eyebrow-dot" />
            BIOLOGY · PHARMACY · LEARNING
          </span>
          <p className="lernwick-hero__note">
            {greeting ? `Welcome back, ${greeting}` : 'A clearer way to learn life sciences'}
          </p>
          <h1 id="lernwick-hero-title">
            Understand biology.<br />
            <span>Master pharmacy.</span>
          </h1>
          <p className="lernwick-hero__description">
            Build strong foundations with clear notes, structured courses, practice questions and active recall — all in one learning space.
          </p>
          {learningPath && (
            <p className="lernwick-hero__path">
              <Icon name="graduation-cap" />
              <span>Your learning path: <strong>{learningPath}</strong></span>
            </p>
          )}
          <div className="lernwick-hero__actions">
            <Link className="lernwick-hero__button lernwick-hero__button--primary" to="/resources">
              Explore learning resources <Icon name="arrow-right" />
            </Link>
            <Link className="lernwick-hero__button lernwick-hero__button--secondary" to="/classroom">
              Visit classroom
            </Link>
          </div>
          <div className="lernwick-hero__trust">
            <span><Icon name="book-open" /> Structured notes</span>
            <span><Icon name="brain" /> Active recall</span>
            <span><Icon name="clipboard-check" /> Exam practice</span>
          </div>
        </div>

        <div className="lernwick-hero__visual" aria-label="Learning tools available on AliverBiopharm">
          <div className="lernwick-hero__orbit lernwick-hero__orbit--one" />
          <div className="lernwick-hero__orbit lernwick-hero__orbit--two" />
          <div className="lernwick-hero__core">
            <span className="lernwick-hero__core-mark">A</span>
            <strong>Learn with<br />understanding</strong>
            <small>ALIVERBIOPHARM</small>
          </div>
          <div className="lernwick-hero__float lernwick-hero__float--biology">
            <span className="lernwick-hero__float-icon"><Icon name="microscope" /></span>
            <span><strong>Biology</strong><small>Concepts made clear</small></span>
          </div>
          <div className="lernwick-hero__float lernwick-hero__float--pharmacy">
            <span className="lernwick-hero__float-icon"><Icon name="capsules" /></span>
            <span><strong>Pharmacy</strong><small>Learn medicines deeply</small></span>
          </div>
          <div className="lernwick-hero__float lernwick-hero__float--recall">
            <span className="lernwick-hero__float-icon"><Icon name="brain" /></span>
            <span><strong>Remember more</strong><small>Practise active recall</small></span>
          </div>
          <span className="lernwick-hero__visual-label">SCIENCE THAT MAKES SENSE</span>
        </div>
      </div>
    </section>
  );
}
