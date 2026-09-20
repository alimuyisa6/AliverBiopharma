import { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import ClassSwitcher from '../../components/ClassSwitcher/ClassSwitcher';
import { WhyChooseSection } from './WhyChooseSection';
import { HowItWorksSection } from './HowItWorksSection';
import { StatsGrid } from './StatsGrid';
import { TestimonialSlider } from './TestimonialSlider';
import { ChatWidget } from '../chat/ChatWidget';
import { NewsletterForm } from './NewsletterForm';
import ClassroomTeaser from '../classroom/ClassroomTeaser';
import TutorMarketplaceTeaser from '../tutor-marketplace/TutorMarketplaceTeaser';
import AdsHomeSection from '../../components/Advertising/AdsHomeSection';
import Hero from '../../components/Hero/Hero';
import HomeDashboardCard from '../../components/dashboard/HomeDashboardCard';
import { useLayout } from '../../contexts/LayoutContext';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

function LearningJourneySection({ sections }) {
  const { bootstrap } = useLayout();
  const uiComponents = bootstrap?.ui_components || [];
  const component = uiComponents.find((item) => item.component_key === 'learning_journey_section');
  const primaryImage = component?.properties?.image_url || '/images/students-learning-happy.jpg';
  const subtitle = sections?.section_headings?.content_types_subtitle ||
    'Notes, flashcards, quizzes, past papers and recall — everything you need, all in one place.';

  return (
    <Link to="/resources" className="section home-learning-journey-section home-learning-journey-link">
      <div className="home-learning-journey-content">
        <span className="eyebrow">Get started</span>
        <h2 className="home-learning-journey-title">Start learning with the resources you need</h2>
        <p className="section-description home-learning-journey-description">{subtitle}</p>
        <img src={primaryImage} alt="Happy students learning together" className="home-learning-journey-image" loading="lazy" />
        <span className="btn btn-primary home-learning-journey-cta">Browse resources →</span>
      </div>
    </Link>
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
  const { sections, user, navigate, activeLevelName, activeGroupName, publicStats, chatOpen, chatMessages, chatInput, adminOnline, newsletterEmail, newsletterStatus, newsletterLoading, chatRequestLoading, chatSending, chatDeletingId, handleNewsletterSubmit, sendChat, deleteChatMsg, setChatOpen, setChatInput, setNewsletterEmail, chatBodyRef, continueLearning, curriculumUnits, dailyRecall, onRevealRecall, onStartRecall } = props;

  return (
    <div className="home-page">
      <section className="home-hero-section"><div className="hero-block"><Hero /></div></section>
      <section className="home-stats-section"><StatsGrid stats={{ resources_count: publicStats?.resources_count || 0, users_count: publicStats?.users_count || 0, downloads_count: publicStats?.downloads_count || 0, quiz_attempts: publicStats?.quiz_attempts || 0 }} /></section>
      {user && <section className="home-student-section"><ClassSwitcher className="home-scope-switcher" /><HomeDashboardCard /><ContinueLearningRail items={continueLearning} navigate={navigate} /></section>}
      <WhyChooseSection />
      <HowItWorksSection />
      {user && <div className="home-student-sections-wrap"><CurriculumSnapshot nodes={curriculumUnits} activeLevelName={activeLevelName} activeGroupName={activeGroupName} sections={sections} /><LearningJourneySection sections={sections} /></div>}
      {!user && <LearningJourneySection sections={sections} />}
      {user && <DailyRecallCard recall={dailyRecall} onReveal={onRevealRecall} onStart={onStartRecall} />}
      <section className="home-testimonials-section"><TestimonialSlider quotes={sections?.testimonials?.quotes || []} /></section>
      <section className="home-classroom-section"><ClassroomTeaser /></section>
      <section className="home-tutor-section"><TutorMarketplaceTeaser /></section>
      <section className="home-advertising-section"><AdsHomeSection /></section>
      <section className="home-newsletter-section"><NewsletterForm email={newsletterEmail} status={newsletterStatus} loading={newsletterLoading} onChange={(event) => setNewsletterEmail(event.target.value)} onSubmit={handleNewsletterSubmit} /></section>
      <ChatWidget chatOpen={chatOpen} chatMessages={chatMessages} chatInput={chatInput} adminOnline={adminOnline} onToggle={() => setChatOpen(!chatOpen)} onSend={sendChat} onInputChange={setChatInput} onDeleteMsg={deleteChatMsg} sending={chatSending} deletingId={chatDeletingId} requestLoading={chatRequestLoading} chatBodyRef={chatBodyRef} />
    </div>
  );
}
