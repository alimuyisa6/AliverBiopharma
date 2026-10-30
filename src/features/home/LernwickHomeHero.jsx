import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import './lernwick-home-hero.css';

const images = {
  portrait: 'https://images.pexels.com/photos/3769021/pexels-photo-3769021.jpeg?auto=compress&cs=tinysrgb&w=900&h=1000&fit=crop',
  sketch: 'https://images.pexels.com/photos/8199759/pexels-photo-8199759.jpeg?auto=compress&cs=tinysrgb&w=500&h=560&fit=crop',
  notes: 'https://images.pexels.com/photos/7972949/pexels-photo-7972949.jpeg?auto=compress&cs=tinysrgb&w=500&h=360&fit=crop',
  study: 'https://images.pexels.com/photos/16420473/pexels-photo-16420473.jpeg?auto=compress&cs=tinysrgb&w=500&h=360&fit=crop',
  student: 'https://images.pexels.com/photos/1181742/pexels-photo-1181742.jpeg?auto=compress&cs=tinysrgb&w=96&h=96&fit=crop'
};

function number(value) {
  return Number(value || 0).toLocaleString();
}

export default function LernwickHomeHero({ user, activeLevelName, activeGroupName, stats = {} }) {
  const name = user?.user_metadata?.full_name || user?.profile?.full_name || user?.email?.split('@')[0];
  const metrics = [
    { label: 'Learning resources', value: stats.resources_count },
    { label: 'Recall questions', value: stats.recall_questions },
    { label: 'Platform learners', value: stats.users_count }
  ];

  return (
    <section className="hero" aria-labelledby="hero-title">
      <div className="container hero__grid">
        <div className="hero__copy">
          <span className="vlabel" aria-hidden="true">Biology · Pharmacy</span>
          <p className="note">{name ? `Welcome back, ${name}` : 'A focused place to learn life sciences'}</p>
          <h1 id="hero-title">Learn <span className="hl">Biology</span><br />and Pharmacy</h1>
          <p className="hero__lede">Build scientific understanding with structured learning resources, clear explanations, quizzes, flashcards and active recall for your level or programme.</p>
          <div className="hero__ctas">
            <Link className="btn btn--orange" to="/resources">Explore resources <Icon name="arrow-right" /></Link>
            <a className="hero__how" href="#how"><span className="hero__play"><Icon name="play" /></span>How it works</a>
          </div>
          {(activeLevelName || activeGroupName) && <p className="hero__path"><Icon name="graduation-cap" /> Your learning path: <strong>{[activeLevelName, activeGroupName].filter(Boolean).join(' · ')}</strong></p>}
        </div>
        <div className="hero__media">
          <svg className="burst hero__burst" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 4v92M4 50h92M17 17l66 66M83 17 17 83M30 8l40 84M8 30l84 40M70 8 30 92M92 30 8 70" /></svg>
          <figure className="blob"><img src={images.portrait} alt="Student studying beside a laptop" width="900" height="1000" fetchPriority="high" /></figure>
          <span className="badge" aria-hidden="true"><Icon name="microscope" /> Biology</span>
          <div className="fcard">
            <p className="fcard__t">Your learning, organised</p>
            <p className="fcard__by"><img src={images.student} alt="" width="96" height="96" /><span><strong>Study with purpose</strong><small><Icon name="book-open" /> Notes and resources</small></span></p>
          </div>
          <div className="fchip"><img src={images.study} alt="" width="96" height="96" /><span><strong>Active recall</strong><small>Practise what you learn</small></span><em>Learn</em></div>
          <span className="vscroll" aria-hidden="true">Explore</span>
        </div>
      </div>
      <div className="container hero__row">
        <div className="collage" aria-hidden="true"><img src={images.sketch} alt="" width="500" height="560" /><img src={images.notes} alt="" width="500" height="360" /><img src={images.study} alt="" width="500" height="360" /></div>
        <Link className="process" to="/classroom"><span className="process__ic"><Icon name="play" /></span><span className="pill">Learn at your pace</span><span className="process__t">Move from learning to confident understanding</span><span className="process__go"><Icon name="arrow-right" /></span></Link>
        <div className="stats"><dl className="stats__list">{metrics.map(metric => <div key={metric.label}><dt>{metric.label}</dt><dd>{number(metric.value)}<sup>+</sup></dd></div>)}</dl><p className="happy"><span className="avatars"><img src={images.student} alt="" width="96" height="96" /><img src={images.portrait} alt="" width="96" height="96" /><img src={images.notes} alt="" width="96" height="96" /></span><span><strong>{activeLevelName || 'O-Level · A-Level · Pharmacy'}</strong><br />Learning pathways</span></p></div>
      </div>
    </section>
  );
}
