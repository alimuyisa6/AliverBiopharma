import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import ClassSwitcher from '../../components/ClassSwitcher/ClassSwitcher';
import { WhyChooseSection } from './WhyChooseSection';
import { HowItWorksSection } from './HowItWorksSection';
import EducationalShowcase from './EducationalShowcase';
import { StatsGrid } from './StatsGrid';
import { TestimonialSlider } from './TestimonialSlider';
import { ChatWidget } from '../chat/ChatWidget';
import { NewsletterForm } from './NewsletterForm';
import ClassroomTeaser from '../classroom/ClassroomTeaser';
import TutorMarketplaceTeaser from '../tutor-marketplace/TutorMarketplaceTeaser';
import AdsHomeSection from '../../components/Advertising/AdsHomeSection';
import AdSlot from '../../components/Advertising/AdSlot';
import Hero from '../../components/Hero/Hero';
import HomeDashboardCard from '../../components/dashboard/HomeDashboardCard';
import DynamicActions from '../../components/DynamicActions';
import { useLayout } from '../../contexts/LayoutContext';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

function LearningJourneySection({ sections, navigate }) {
  const { bootstrap } = useLayout();
  const uiComponents = bootstrap?.ui_components || [];
  const component = uiComponents.find((item) => item.component_key === 'learning_journey_section');
  const subtitle = sections?.section_headings?.content_types_subtitle ||
    'Course-matched notes, flashcards, clinical cases, quizzes, past papers, downloadable PDFs and active-recall practice—plus learning and assessment resources tailored to your course unit, from certificate through to degree level.';

  return (
    <section className="section home-learning-journey-section">
      <div className="home-learning-journey-content">
        <span className="eyebrow">YOUR STUDY TOOLKIT</span>
        <h2 className="home-learning-journey-title">Find the right resource for your next study session</h2>
        <p className="section-description home-learning-journey-description">{subtitle}</p>
        <div className="home-learning-journey-images">
          <div className="home-get-started-art home-get-started-art--notes" aria-hidden="true">
            <svg viewBox="0 0 72 72" focusable="false"><rect x="14" y="12" width="42" height="50" rx="5" fill="var(--primary)" opacity=".13"/><path d="M20 9h31a5 5 0 0 1 5 5v43H25a5 5 0 0 1-5-5V9Z" fill="var(--surface-card)" stroke="var(--primary)" strokeWidth="2"/><path d="M29 23h18M29 31h18M29 39h13M29 47h16" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><path d="M20 9v43a5 5 0 0 0 5 5" fill="none" stroke="var(--primary)" strokeWidth="2"/></svg>
          </div>
          <div className="home-get-started-art home-get-started-art--flask" aria-hidden="true">
            <svg viewBox="0 0 72 72" focusable="false"><path d="M27 9h18M31 9v20L17 52a7 7 0 0 0 6 11h26a7 7 0 0 0 6-11L41 29V9" fill="var(--surface-card)" stroke="var(--secondary)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/><path d="M22 48h28l5 8a5 5 0 0 1-5 5H22a5 5 0 0 1-5-5l5-8Z" fill="var(--secondary)" opacity=".3"/><circle cx="32" cy="51" r="2.5" fill="var(--secondary)"/><circle cx="42" cy="56" r="2" fill="var(--secondary)"/><circle cx="37" cy="46" r="1.8" fill="var(--secondary)"/></svg>
          </div>
          <div className="home-get-started-art home-get-started-art--cards" aria-hidden="true">
            <svg viewBox="0 0 72 72" focusable="false"><rect x="11" y="16" width="38" height="43" rx="5" transform="rotate(-9 11 16)" fill="var(--accent)" opacity=".18"/><rect x="22" y="13" width="38" height="46" rx="5" fill="var(--surface-card)" stroke="var(--accent)" strokeWidth="2.5"/><path d="M30 25h21M30 33h21M30 41h14" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round"/><path d="m43 49 4 4 7-8" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <div className="home-get-started-art home-get-started-art--molecule" aria-hidden="true">
            <svg viewBox="0 0 72 72" focusable="false"><path d="m20 20 30 32M50 20 20 52" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" opacity=".65"/><circle cx="20" cy="20" r="8" fill="var(--primary)"/><circle cx="50" cy="20" r="8" fill="var(--secondary)"/><circle cx="20" cy="52" r="8" fill="var(--accent)"/><circle cx="50" cy="52" r="8" fill="var(--primary)"/><circle cx="35" cy="36" r="7" fill="var(--surface-card)" stroke="var(--secondary)" strokeWidth="2.5"/></svg>
          </div>
        </div>
        <button type="button" className="btn btn-primary home-learning-journey-cta" onClick={() => navigate('/resources')}>Browse resources →</button>
      </div>
    </section>
  );
}

function ContinueLearningRail({ items, navigate }) {
  if (!items?.length) return null;
  return (
    <section className="section home-continue-learning-section">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">Pick up where you stopped</span>
          <h2>Continue learning</h2>
        </div>
        <Link to="/activity" className="text-link">See all activity →</Link>
      </div>
      <div className="row-list home-continue-learning-list">
        {items.map((item) => (
          <div key={item.id} className="row home-continue-learning-row">
            <div className="row-thumb home-continue-learning-thumb">
              {item.thumbnail_url ? <img src={item.thumbnail_url} alt={item.title} loading="lazy" /> : <Icon name={CONTINUE_ICON[item.type] || 'book-open'} />}
            </div>
            <div className="row-body">
              <div className="row-title">{item.title}</div>
              <div className="row-meta">
                <span>{item.type} · {item.subject || 'Biology'}</span>
                <span className="progress-track home-continue-learning-progress" aria-label={`${item.progress_percent || 0}% complete`}>
                  <span className={`progress-fill ${item.progress_color || 'blue'}`} style={{ width: `${item.progress_percent || 0}%` }} />
                </span>
              </div>
            </div>
            <div className="row-actions">
              <span>{item.progress_label}</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => navigate(item.route)}>{item.cta_label} →</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CurriculumNodeList({ nodes, parentId = null, depth = 0 }) {
  const children = nodes
    .filter((node) => (node.parent_id || null) === parentId)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));
  if (!children.length) return null;

  return (
    <div className={`home-curriculum-node-list home-curriculum-depth-${depth}`}>
      {children.map((node) => (
        <div key={node.id} className="home-curriculum-node">
          <div className="home-curriculum-node-line">
            <span className="home-curriculum-node-marker" aria-hidden="true" />
            <span className="home-curriculum-node-name">{node.name}</span>
            <span className="home-curriculum-node-type">{node.node_type}</span>
          </div>
          <CurriculumNodeList nodes={nodes} parentId={node.id} depth={depth + 1} />
        </div>
      ))}
    </div>
  );
}

function CurriculumSnapshot({ nodes, activeLevelName, activeGroupName, sections }) {
  if (!nodes?.length) return null;
  const description = sections?.section_headings?.curriculum_subtitle ||
    'Your syllabus structure, from programme level down to the topics and concepts it contains.';

  return (
    <section className="section home-curriculum-section" aria-labelledby="home-curriculum-heading">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">{activeLevelName}{activeGroupName ? ` · ${activeGroupName}` : ''}</span>
          <h2 id="home-curriculum-heading" className="home-curriculum-heading">Your curriculum</h2>
          <p className="section-description home-curriculum-description">{description}</p>
        </div>
      </div>
      <div className="home-curriculum-map" aria-label="Curriculum overview">
        <CurriculumNodeList nodes={nodes} />
      </div>
    </section>
  );
}

function ChallengeTreasureCard({ challenge, onOpen }) {
  if (!challenge) return null;
  const challengeType = challenge.challenge_type || challenge.type;
  const labels = { recall: 'Recall Challenge', flashcards: 'Flashcard Challenge', quiz: 'Quiz Challenge' };
  const icons = { recall: 'brain', flashcards: 'layers', quiz: 'clipboard-check' };
  return <section className={'section home-challenge-treasure home-challenge-' + (challengeType || 'daily')} aria-labelledby='home-challenge-heading'>
    <div className='home-challenge-treasure-art' aria-hidden='true'><div className='home-challenge-character'><div className='home-challenge-face'><span /><span /></div><div className='home-challenge-smile' /><div className='home-challenge-book' /></div><span className='home-challenge-spark one' /><span className='home-challenge-spark two' /></div>
    <div className='home-challenge-treasure-copy'><span className='eyebrow'>Daily challenge treasure</span><h2 id='home-challenge-heading'>{challenge.title}</h2><p>{challenge.description}</p><div className='home-challenge-meta'><span><Icon name={icons[challengeType] || 'star'} /> {labels[challengeType] || 'Challenge'}</span><span>+{challenge.reward_xp} XP</span></div><button type='button' className='btn btn-primary' onClick={onOpen}>{challenge.passed ? 'View challenge' : 'Open challenge'} <Icon name='arrow-right' /></button></div>
  </section>;
}

function DailyRecallCard({ recall, onReveal, onStart }) {
  if (!recall) return null;
  const { question_text, meta, score } = recall;
  const progress = score?.total ? (score.completed / score.total) * 100 : 0;
  return (
    <section className="section section-emerald home-daily-recall-section card-glass">
      <div className="section-head"><div className="section-head-left"><span className="eyebrow">Daily active recall</span><h2>{question_text}</h2><p className="section-description home-daily-recall-description">{meta}</p></div></div>
      <div className="card card-lifted card-surface-solid card-elevation-soft card-density-comfortable row home-daily-recall-card">
        <div className="row-body">{score && <div className="home-daily-recall-progress"><div className="home-daily-recall-score"><span>Today's recall</span><strong>{score.completed} / {score.total}</strong><span>· +{score.xp_earned} XP</span></div><div className="progress-track" aria-label={`${Math.round(progress)}% complete`}><span className="progress-fill emerald" style={{ width: `${progress}%` }} /></div></div>}</div>
        <div className="row-actions home-daily-recall-actions"><button type="button" className="btn btn-primary" onClick={onReveal}>Reveal answer</button><button type="button" className="btn btn-secondary" onClick={onStart}>Start recall</button></div>
      </div>
    </section>
  );
}

export default function HomeView(props) {
  const { sections, user, navigate, activeLevelName, activeGroupName, publicStats, chatOpen, chatMessages, chatInput, adminOnline, newsletterEmail, newsletterStatus, newsletterLoading, chatRequestLoading, chatSending, chatDeletingId, handleNewsletterSubmit, sendChat, deleteChatMsg, setChatOpen, setChatInput, setNewsletterEmail, chatBodyRef, continueLearning, curriculumUnits, dailyRecall, onRevealRecall, onStartRecall, dailyChallenge, onOpenChallenge } = props;

  return (
    <div className="home-page">
      <section className="home-hero-section"><div className="hero-block"><Hero /></div></section>
      <DynamicActions pageId="home" className="home-dynamic-actions" />
      <section className="home-stats-section"><StatsGrid stats={{ resources_count: publicStats?.resources_count || 0, users_count: publicStats?.users_count || 0, downloads_count: publicStats?.downloads_count || 0, quiz_attempts: publicStats?.quiz_attempts || 0 }} /></section>
      {user && <section className="home-student-section"><ClassSwitcher className="home-scope-switcher" /><HomeDashboardCard /><ContinueLearningRail items={continueLearning} navigate={navigate} /></section>}
      <WhyChooseSection />
      <HowItWorksSection />
      <EducationalShowcase />
      {user && <div className="home-student-sections-wrap"><CurriculumSnapshot nodes={curriculumUnits} activeLevelName={activeLevelName} activeGroupName={activeGroupName} sections={sections} /><LearningJourneySection sections={sections} navigate={navigate} /></div>}
      {!user && <LearningJourneySection sections={sections} navigate={navigate} />}
      {user && <ChallengeTreasureCard challenge={dailyChallenge} onOpen={onOpenChallenge} />}
      {user && <DailyRecallCard recall={dailyRecall} onReveal={onRevealRecall} onStart={onStartRecall} />}
      <section className="home-testimonials-section"><TestimonialSlider quotes={sections?.testimonials?.quotes || []} /></section>
      <section className="home-classroom-section"><ClassroomTeaser /></section>
      <section className="home-tutor-section"><TutorMarketplaceTeaser /></section>
      <section className="home-advertising-section"><AdsHomeSection />
      <AdSlot placement="homepage" pageContext="home" /></section>
      <section className="home-newsletter-section"><NewsletterForm email={newsletterEmail} status={newsletterStatus} loading={newsletterLoading} onChange={(event) => setNewsletterEmail(event.target.value)} onSubmit={handleNewsletterSubmit} /></section>
      <ChatWidget chatOpen={chatOpen} chatMessages={chatMessages} chatInput={chatInput} adminOnline={adminOnline} onToggle={() => setChatOpen(!chatOpen)} onSend={sendChat} onInputChange={setChatInput} onDeleteMsg={deleteChatMsg} sending={chatSending} deletingId={chatDeletingId} requestLoading={chatRequestLoading} chatBodyRef={chatBodyRef} />
    </div>
  );
}
