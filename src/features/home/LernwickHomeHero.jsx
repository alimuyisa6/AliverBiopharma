import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const images = {
  portrait: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=900&h=1000&fit=crop',
  study: 'https://images.pexels.com/photos/16420473/pexels-photo-16420473.jpeg?auto=compress&cs=tinysrgb&w=500&h=360&fit=crop',
};

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName }) {
  const name = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <span className="vlabel" aria-hidden="true">Biology · Pharmacy</span>
          <p className="note">{name ? `Welcome back, ${name}` : 'A focused place to learn life sciences'}</p>
          <h1 id="hero-title">Learn <span className="hl">Biology</span><br />and Pharmacy with purpose</h1>
          <p className="hero__lede">Follow a clearer learning path with curriculum-based notes, focused practice, flashcards and examination resources for your level or pharmacy programme.</p>
          <div className="hero__ctas">
            <Link className="btn btn--primary" to="/resources">Explore resources <Icon name="arrow-right" /></Link>
            <a className="hero__how" href="#how"><span className="hero__play"><Icon name="play" /></span>How it works</a>
          </div>
          {(activeLevelName || activeGroupName) && <p className="hero__path"><Icon name="graduation-cap" /> Your learning path: <strong>{[activeLevelName, activeGroupName].filter(Boolean).join(' · ')}</strong></p>}
        </div>
        <div className="hero__media">
          <svg className="burst hero__burst" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4v92M4 50h92M17 17l66 66M83 17 17 83M30 8l40 84M8 30l84 40M70 8 30 92M92 30 8 70" /></svg>
          <figure className="blob"><img src={images.portrait} alt="Student studying beside a laptop" width="900" height="1000" fetchPriority="high" /></figure>
          <span className="badge" aria-hidden="true"><Icon name="microscope" /> Biology</span>
          <div className="fcard">
            <p className="fcard__t">Learning that connects</p>
            <p className="fcard__by"><span className="hero__mini-icon"><Icon name="book-open" /></span><span><strong>From topic to practice</strong><small><Icon name="check-circle" /> One connected journey</small></span></p>
          </div>
          <div className="fchip"><img src={images.study} alt="" width="96" height="96" /><span><strong>Active recall</strong><small>Practise what you learn</small></span><em>Learn</em></div>
          <span className="vscroll" aria-hidden="true">Explore</span>
        </div>
      </div>
      <div className="container hero__row">
        <ul className="hero__highlights" aria-label="Learning platform features">
          <li><span><Icon name="book-open" /></span><strong>Curriculum-led learning</strong><small>Resources organised around your programme.</small></li>
          <li><span><Icon name="brain" /></span><strong>Active practice</strong><small>Build recall and test your understanding.</small></li>
          <li><span><Icon name="graduation-cap" /></span><strong>Exam preparation</strong><small>Apply knowledge with assessment resources.</small></li>
        </ul>
        <a className="process" href="#pathways"><span className="process__ic"><Icon name="compass" /></span><span className="pill">Start exploring</span><span className="process__t">Find the learning path that matches your goals</span><span className="process__go"><Icon name="arrow-right" /></span></a>
      </div>
    </section>
  );
}
