import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import ClassSwitcher from '../../components/ClassSwitcher/ClassSwitcher';
import { StatsGrid } from './StatsGrid';
import { TestimonialSlider } from './TestimonialSlider';
import { ChatWidget } from '../chat/ChatWidget';
import { NewsletterForm } from './NewsletterForm';
import ClassroomTeaser from '../classroom/ClassroomTeaser';
import TutorMarketplaceTeaser from '../tutor-marketplace/TutorMarketplaceTeaser';
import AdsHomeSection from '../../components/Advertising/AdsHomeSection';
import AdSlot from '../../components/Advertising/AdSlot';
import LernwickHomeHero from './LernwickHomeHero';
import LernwickHomeSections from './LernwickHomeSections';
import HomeDashboardCard from '../../components/dashboard/HomeDashboardCard';
import DynamicActions from '../../components/DynamicActions';
import ThreeDButton from '../../components/buttons/ThreeDButton';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

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
        <LernwickHomeHero user={user} activeLevelName={activeLevelName} activeGroupName={activeGroupName} stats={publicStats || {}} />
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

      <LernwickHomeSections />
      {user && <CurriculumSnapshot nodes={curriculumUnits} activeLevelName={activeLevelName} activeGroupName={activeGroupName} sections={sections} />}

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