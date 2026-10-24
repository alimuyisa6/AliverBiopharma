import { useState, useEffect } from 'react';
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
import AdSlot from '../../components/Advertising/AdSlot';
import Hero from '../../components/Hero/Hero';
import HomeDashboardCard from '../../components/dashboard/HomeDashboardCard';
import DynamicActions from '../../components/DynamicActions';
import { useLayout } from '../../contexts/LayoutContext';
import ThreeDButton from '../../components/buttons/ThreeDButton';
import StudyQuoteCard from './StudyQuoteCard';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

function LearningJourneySection({ sections, navigate }) {
  const { bootstrap, level } = useLayout();
  const uiComponents = bootstrap?.ui_components || [];
  const component = uiComponents.find((item) => item.component_key === 'learning_journey_section');
  const levelName = `${level?.display_name || level?.name || level?.title || ''}`.toLowerCase();
  const isPharmacy = levelName.includes('pharmacy');
  const isALevel = /a[- ]?level/.test(levelName);
  const isOLevel = /o[- ]?level/.test(levelName);
  const defaultSubtitle = isPharmacy
    ? 'Course-unit notes, medicine-focused flashcards, clinical cases, and quizzes for your Pharmacy programme.'
    : isALevel
      ? 'Build deeper Biology understanding with topic notes, diagrams, past papers, and active-recall practice.'
      : isOLevel
        ? 'Build strong Biology foundations with clear topic notes, flashcards, quizzes, and exam practice.'
        : 'Find Biology notes, flashcards, quizzes, and recall practice matched to your learning pathway.';
  const subtitle = sections?.section_headings?.content_types_subtitle || defaultSubtitle;

  return (
    <section className="section home-learning-journey-section">
      <div className="home-learning-journey-content">
        <span className="eyebrow">YOUR STUDY TOOLKIT</span>
        <h2 className="home-learning-journey-title">Find what you need for your next study session</h2>
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
        <ThreeDButton type="button" variant="solid" iconRight="arrow-right" className="home-learning-journey-cta" onClick={() => navigate('/resources')}>Browse learning resources</ThreeDButton>
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
          <span className="eyebrow">Pick up where you left off</span>
          <h2>Continue learning</h2>
        </div>
        <Link to="/activity" className="text-link">View all learning activity →</Link>
      </div>
      <div className="row-list home-continue-learning-list">
        {items.map((item) => (
          <div key={item.id} className="row home-continue-learning-row">
            <div className="row-thumb home-continue-learning-thumb">
              <Icon name={CONTINUE_ICON[item.type] || 'book-open'} />
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
              <ThreeDButton type="button" variant="soft" size="sm" iconRight="arrow-right" onClick={() => navigate(item.route)}>{item.cta_label}</ThreeDButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CurriculumNodeList({ nodes, parentId = null, isPharmacy = false }) {
  const children = nodes
    .filter((node) => (node.parent_id || null) === parentId)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));

  if (!children.length) return null;

  return (
    <div className="home-curriculum-node-list" aria-label="Available curriculum topics">
      {children.map((node) => {
        const nodeSlug = node.slug || String(node.name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const nodeType = String(node.node_type || '').toLowerCase();
        const pharmacyNode = isPharmacy || nodeType === 'sub_course_unit';
        const label = nodeType === 'sub_course_unit'
          ? 'Sub-course Unit'
          : nodeType === 'topic'
            ? 'Topic'
            : nodeType === 'unit'
              ? (pharmacyNode ? 'Course Unit' : 'Topic')
              : nodeType === 'subtopic'
                ? 'Subtopic'
                : nodeType === 'theme'
                  ? 'Theme'
                  : nodeType === 'lesson'
                    ? 'Lesson'
                    : 'Learning area';

        return (
          <Link
            key={node.id}
            to={`/curriculum/${node.group_id}/${nodeSlug}`}
            className="home-curriculum-node home-curriculum-node-link"
            aria-label={`Open ${label.toLowerCase()} ${node.name}`}
          >
            <span className="home-curriculum-node-marker" aria-hidden="true" />
            <span className="home-curriculum-node-copy">
              <strong className="home-curriculum-node-name">{node.name}</strong>
              <small className="home-curriculum-node-type">{label}</small>
            </span>
            <Icon name="chevron-right" />
          </Link>
        );
      })}
    </div>
  );
}

function CurriculumSnapshot({ nodes, activeLevelName, activeGroupName, sections }) {
  if (!nodes?.length) return null;
  const isPharmacy = /pharmacy/i.test(`${activeLevelName || ''} ${activeGroupName || ''}`);
  const firstStepLabel = isPharmacy ? 'course unit' : 'topic';
  const configuredDescription = sections?.section_headings?.curriculum_subtitle;
  const description = isPharmacy
    ? 'Choose a course unit, then move through its sub-course units, themes and lessons. Your curriculum is matched to your selected programme.'
    : configuredDescription && !/sub?[- ]?course unit|course unit/i.test(configuredDescription)
      ? configuredDescription
      : 'Choose a Biology topic, then explore its subtopics, themes and lessons for your selected class.';

  return (
    <section className="section home-curriculum-section" aria-labelledby="home-curriculum-heading">
      <div className="section-head">
        <div className="section-head-left">
          <span className="eyebrow">{activeLevelName}{activeGroupName ? ` · ${activeGroupName}` : ''}</span>
          <h2 id="home-curriculum-heading" className="home-curriculum-heading">
            Choose a {firstStepLabel}
          </h2>
          <p className="section-description home-curriculum-description">{description}</p>
        </div>
      </div>
      <div className="home-curriculum-map" aria-label="Your curriculum">
        <CurriculumNodeList nodes={nodes} isPharmacy={isPharmacy} />
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
    <div className='home-challenge-treasure-copy'><span className='eyebrow'>Your daily challenge</span><h2 id='home-challenge-heading'>{challenge.title}</h2><p>{challenge.description}</p><div className='home-challenge-meta'><span><Icon name={icons[challengeType] || 'star'} /> {labels[challengeType] || 'Challenge'}</span><span>+{challenge.reward_xp} XP</span></div><ThreeDButton type='button' variant='solid' iconRight='arrow-right' onClick={onOpen}>{challenge.passed ? 'View challenge' : 'Start challenge'}</ThreeDButton></div>
  </section>;
}

function DailyRecallCard({ recall, onReveal, onStart }) {
  if (!recall) return null;
  const { question_text, meta, score } = recall;
  const progress = score?.total ? (score.completed / score.total) * 100 : 0;  return (
    <section className="section section-emerald home-daily-recall-section card-glass">
      <div className="section-head"><div className="section-head-left"><span className="eyebrow">Daily active recall</span><h2>{question_text}</h2><p className="section-description home-daily-recall-description">{meta}</p></div></div>
      <div className="card card-lifted card-surface-solid card-elevation-soft card-density-comfortable row home-daily-recall-card">
        <div className="row-body">{score && <div className="home-daily-recall-progress"><div className="home-daily-recall-score"><span>Today's recall</span><strong>{score.completed} / {score.total}</strong><span>· +{score.xp_earned} XP</span></div><div className="progress-track" aria-label={`${Math.round(progress)}% complete`}><span className="progress-fill emerald" style={{ width: `${progress}%` }} /></div></div>}</div>
        <div className="row-actions home-daily-recall-actions"><ThreeDButton type="button" variant="soft" onClick={onReveal}>Reveal answer</ThreeDButton><ThreeDButton type="button" variant="solid" iconRight="arrow-right" onClick={onStart}>Start recall</ThreeDButton></div>
      </div>
    </section>
  );
}

export default function HomeView(props) {
  const [isDesktopViewport, setIsDesktopViewport] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width: 769px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(min-width: 769px)');
    const updateViewport = (event) => setIsDesktopViewport(event.matches);
    setIsDesktopViewport(media.matches);
    media.addEventListener('change', updateViewport);
    return () => media.removeEventListener('change', updateViewport);
  }, []);
  const { sections, user, navigate, activeLevelName, activeGroupName, publicStats, chatOpen, chatMessages, chatInput, adminOnline, newsletterEmail, newsletterStatus, newsletterLoading, chatRequestLoading, chatSending, chatDeletingId, handleNewsletterSubmit, sendChat, deleteChatMsg, setChatOpen, setChatInput, setNewsletterEmail, chatBodyRef, continueLearning, curriculumUnits, dailyRecall, onRevealRecall, onStartRecall, dailyChallenge, onOpenChallenge } = props;

  return (
    <div className="home-page home-page-redesign">
      <section className="home-hero-section" id="top" aria-label="Introduction">
        <div className="hero-block"><Hero /></div>
      </section>

      <DynamicActions pageId="home" className="home-dynamic-actions" />

      <section className="home-stats-section" aria-label="Platform statistics">
        <StatsGrid stats={publicStats || {}} scopeLabel={activeGroupName || activeLevelName || 'All learning levels'} />
      </section>



      {user && (
        <section className="home-student-section" id="dashboard">
          {!isDesktopViewport && <ClassSwitcher className="home-scope-switcher" />}
          <HomeDashboardCard />
          <ContinueLearningRail items={continueLearning} navigate={navigate} />
        </section>
      )}

      <WhyChooseSection />
      <HowItWorksSection />
      <StudyQuoteCard />

      <section className="home-learning-journey-wrap" id="journey">
        <LearningJourneySection sections={sections} navigate={navigate} />
      </section>

      {user && <ChallengeTreasureCard challenge={dailyChallenge} onOpen={onOpenChallenge} />}
      {user && <DailyRecallCard recall={dailyRecall} onReveal={onRevealRecall} onStart={onStartRecall} />}

      <section className="home-testimonials-section" id="testimonials">
        <TestimonialSlider quotes={sections?.testimonials?.quotes || []} />
      </section>
      <section className="home-classroom-section" id="classroom"><ClassroomTeaser /></section>
      <section className="home-tutor-section"><TutorMarketplaceTeaser /></section>
      <section className="home-advertising-section">
        <AdsHomeSection />
        <AdSlot placement="homepage" pageContext="home" />
      </section>
      <section className="home-newsletter-section" id="newsletter">
        <NewsletterForm email={newsletterEmail} status={newsletterStatus} loading={newsletterLoading} onChange={(event) => setNewsletterEmail(event.target.value)} onSubmit={handleNewsletterSubmit} />
      </section>
      <ChatWidget chatOpen={chatOpen} chatMessages={chatMessages} chatInput={chatInput} adminOnline={adminOnline} onToggle={() => setChatOpen(!chatOpen)} onSend={sendChat} onInputChange={setChatInput} onDeleteMsg={deleteChatMsg} sending={chatSending} deletingId={chatDeletingId} requestLoading={chatRequestLoading} chatBodyRef={chatBodyRef} />
    </div>
  );
}