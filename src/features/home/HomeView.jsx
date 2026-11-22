import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import ClassSwitcher from '../../components/ClassSwitcher/ClassSwitcher';
import { StatsGrid } from './StatsGrid';
import { PricingCards } from './PricingCards';
import { TestimonialSlider } from './TestimonialSlider';
import { ChatWidget } from '../chat/ChatWidget';
import { NewsletterForm } from './NewsletterForm';
import ClassroomTeaser from '../classroom/ClassroomTeaser';
import TutorMarketplaceTeaser from '../tutor-marketplace/TutorMarketplaceTeaser';
import AdsHomeSection from '../../components/Advertising/AdsHomeSection';
import AdSlot from '../../components/Advertising/AdSlot';
import LernwickHomeHero from './LernwickHomeHero';
import { ProgrammeDiscovery, LearningProcess, ConnectedLearning } from './LernwickHomeSections';
import HomeDashboardCard from '../../components/dashboard/HomeDashboardCard';
import DynamicActions from '../../components/DynamicActions';
import ThreeDButton from '../../components/buttons/ThreeDButton';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import StorysetIllustration from '../../components/StorysetIllustration';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

function ContinueLearningRail({ items, navigate }) {
  if (!items?.length) return null;
  return (
    <section className="w-full bg-background px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto mb-7 flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          
          <h2>Continue learning</h2>
        </div>
        <Link to="/dashboard" className="text-sm font-bold text-primary-700 hover:text-secondary-700">View all learning activity →</Link>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-xl text-primary-700">
              <Icon name={CONTINUE_ICON[item.type] || 'book-open'} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-primary-900">{item.title}</div>
              <div className="mt-2 flex flex-col gap-2 text-xs text-slate-600 sm:flex-row sm:items-center">
                <span>{item.type} · {item.subject || 'Biology'}</span>
                <span className="h-2 min-w-24 flex-1 overflow-hidden rounded-full bg-slate-100" aria-label={`${item.progress_percent || 0}% complete`}>
                  <span className="block h-full rounded-full bg-primary-500" style={{ width: `${item.progress_percent || 0}%` }} />
                </span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600 sm:justify-end">
              <span>{item.progress_label}</span>
              <ThreeDButton type="button" variant="soft" size="sm" iconRight="arrow-right" onClick={() => navigate(item.route)}>{item.cta_label}</ThreeDButton>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function curriculumNodeLabel(node, isPharmacy) {
  const type = String(node?.node_type || '').toLowerCase();
  if (type === 'unit') return isPharmacy ? 'Course Unit' : 'Topic';
  if (type === 'sub_course_unit' && isPharmacy) return 'Sub-course Unit';
  if (type === 'topic') return 'Topic';
  if (type === 'subtopic') return 'Subtopic';
  if (type === 'theme') return 'Theme';
  if (type === 'lesson') return 'Lesson';
  return 'Learning area';
}

function CurriculumNodeList({ nodes, parentId = null, isPharmacy = false, onSelect }) {
  const children = nodes
    .filter((node) => (node.parent_id || null) === parentId)
    .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.name.localeCompare(b.name));

  if (!children.length) return null;

  return (
    <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Curriculum items at this level">
      {children.map((node) => {
        const childNodes = nodes.filter((item) => item.parent_id === node.id);
        const label = curriculumNodeLabel(node, isPharmacy);
        const nodeSlug = node.slug || String(node.name || '')
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const href = `/curriculum/${node.group_id}/${nodeSlug}`;
        return (
          <article key={node.id} className="flex min-w-0 flex-col rounded-2xl border border-secondary-100 bg-white p-4 shadow-sm transition duration-200 hover:border-primary-200 hover:shadow-md sm:p-5">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700" aria-hidden="true">
              <Icon name={node.icon || 'book-open'} className="h-5 w-5" />
            </div>
            <h3 className="text-base font-bold leading-6 text-primary-900 sm:text-lg">{node.name}</h3>
            <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
            <div className="mt-auto pt-5">
              {childNodes.length > 0 ? (
                <button type="button" onClick={() => onSelect(node)} className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-primary-50 px-4 py-2.5 text-sm font-semibold text-primary-800 transition hover:bg-primary-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                  <span>Explore {label.toLowerCase()}</span><Icon name="arrow-right" className="h-4 w-4 shrink-0" />
                </button>
              ) : (
                <Link to={href} className="inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500">
                  <span>Open {label.toLowerCase()}</span><Icon name="arrow-right" className="h-4 w-4 shrink-0" />
                </Link>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CurriculumSnapshot({ nodes, activeLevelName, activeGroupName, sections }) {
  const [currentParent, setCurrentParent] = useState(null);
  if (!nodes?.length) return null;
  const isPharmacy = /pharmacy/i.test(`${activeLevelName || ''} ${activeGroupName || ''}`);
  const firstStepLabel = isPharmacy ? 'course unit' : 'topic';
  const configuredDescription = sections?.section_headings?.curriculum_subtitle;
  const description = isPharmacy
    ? 'Choose a course unit to explore its next step. Open one level at a time, then continue into themes and lessons.'
    : configuredDescription && !/sub?[- ]?course unit|course unit/i.test(configuredDescription)
      ? configuredDescription
      : 'Choose a Biology topic and explore one level at a time, from subtopics to themes and lessons.';
  const selectedNode = currentParent ? nodes.find((node) => node.id === currentParent) : null;
  const visibleParentId = selectedNode?.id || null;
  const levelLabel = selectedNode ? curriculumNodeLabel(selectedNode, isPharmacy) : (isPharmacy ? 'Course Units' : 'Topics');
  const breadcrumbs = [];
  let cursor = selectedNode;
  while (cursor) {
    breadcrumbs.unshift(cursor);
    cursor = nodes.find((node) => node.id === cursor.parent_id) || null;
  }

  return (
    <section className="w-full bg-secondary-50 px-5 py-12 sm:px-8 sm:py-16 lg:px-12" aria-labelledby="home-curriculum-heading">
      <div className="mx-auto mb-6 flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          
          <h2 id="home-curriculum-heading" className="home-curriculum-heading mt-2">{selectedNode ? selectedNode.name : `Choose a ${firstStepLabel}`}</h2>
          <p className="section-description home-curriculum-description mt-8">{description}</p>
        </div>
      </div>
      <div className="mx-auto max-w-7xl rounded-2xl border border-secondary-100 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <Breadcrumb
            className="flex-1"
            items={[
              { label: isPharmacy ? 'Course Units' : 'Topics', onClick: () => setCurrentParent(null) },
              ...breadcrumbs.map((item) => ({ label: item.name })),
            ]}
          />
          {selectedNode && <button type="button" onClick={() => setCurrentParent(selectedNode.parent_id || null)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500"><Icon name="arrow-left" className="h-4 w-4" />Back</button>}
        </div>
        <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">{levelLabel}</p>
        <CurriculumNodeList nodes={nodes} parentId={visibleParentId} isPharmacy={isPharmacy} onSelect={setCurrentParent} />
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
    <div className='mx-auto flex max-w-7xl items-center justify-between gap-6'><div className='home-challenge-treasure-copy min-w-0 flex-1'><h2 id='home-challenge-heading'>{challenge.title}</h2><p className='mt-8'>{challenge.description}</p><div className='home-challenge-meta'><span><Icon name={icons[challengeType] || 'star'} /> {labels[challengeType] || 'Challenge'}</span><span>+{challenge.reward_xp} XP</span></div><ThreeDButton type='button' variant='solid' iconRight='arrow-right' onClick={onOpen}>{challenge.passed ? 'View challenge' : 'Start challenge'}</ThreeDButton></div><StorysetIllustration name='onlineTest' alt='Learner taking a knowledge challenge' className='hidden w-36 shrink-0 object-contain sm:block md:w-44' /></div>
  </section>;
}

function DailyRecallCard({ recall, onReveal, onStart }) {
  if (!recall) return null;
  const { question_text, meta, score } = recall;
  const progress = score?.total ? (score.completed / score.total) * 100 : 0;  return (
    <section className="section section-emerald home-daily-recall-section card-glass">
      <div className="mx-auto mb-7 flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div className="min-w-0"><h2>{question_text}</h2><p className="section-description home-daily-recall-description mt-8">{meta}</p></div></div>
      <div className="card card-lifted card-surface-solid card-elevation-soft card-density-comfortable row home-daily-recall-card">
        <div className="min-w-0 flex-1">{score && <div className="home-daily-recall-progress"><div className="home-daily-recall-score"><span>Today's recall</span><strong>{score.completed} / {score.total}</strong><span>· +{score.xp_earned} XP</span></div><div className="progress-track" aria-label={`${Math.round(progress)}% complete`}><span className="progress-fill emerald" style={{ width: `${progress}%` }} /></div></div>}</div>
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
  const { sections, user, navigate, activeLevelName, activeGroupName, activeGroupId, publicStats, subscriptionPlans, chatOpen, chatMessages, chatInput, adminOnline, newsletterEmail, newsletterStatus, newsletterLoading, chatRequestLoading, chatSending, chatDeletingId, handleNewsletterSubmit, sendChat, deleteChatMsg, setChatOpen, setChatInput, setNewsletterEmail, chatBodyRef, continueLearning, curriculumUnits, dailyRecall, onRevealRecall, onStartRecall, dailyChallenge, onOpenChallenge } = props;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="w-full" id="top" aria-label="Introduction">
        <LernwickHomeHero user={user} activeLevelName={activeLevelName} activeGroupName={activeGroupName} activeGroupId={activeGroupId} />
      </section>

      <DynamicActions pageId="home" className="home-dynamic-actions" />

      <ProgrammeDiscovery activeLevelName={activeLevelName} activeGroupName={activeGroupName} activeGroupId={activeGroupId} />

      {user && <CurriculumSnapshot nodes={curriculumUnits} activeLevelName={activeLevelName} activeGroupName={activeGroupName} sections={sections} />}

      <LearningProcess activeLevelName={activeLevelName} activeGroupName={activeGroupName} />

      <ConnectedLearning />

      {user && (
        <section className="w-full bg-primary-50 px-5 py-12 sm:px-8 lg:px-12" id="dashboard">
          {!isDesktopViewport && <ClassSwitcher className="home-scope-switcher" />}
          <HomeDashboardCard />
          <ContinueLearningRail items={continueLearning} navigate={navigate} />
        </section>
      )}

      {user && <section className="w-full bg-secondary-50 px-5 py-12 sm:px-8 lg:px-12" aria-label="Daily learning activities">
        <ChallengeTreasureCard challenge={dailyChallenge} onOpen={onOpenChallenge} />
        <DailyRecallCard recall={dailyRecall} onReveal={onRevealRecall} onStart={onStartRecall} />
      </section>}

      <section className="home-testimonials-section" id="testimonials">
        <TestimonialSlider quotes={sections?.testimonials?.quotes || []} />
      </section>

      <section className="home-stats-section" aria-label="Platform statistics">
        <StatsGrid stats={publicStats || {}} scopeLabel={activeGroupName || activeLevelName || 'All learning levels'} />
      </section>

      <PricingCards plans={subscriptionPlans} user={user} />
      <section className="home-classroom-section" id="classroom"><ClassroomTeaser /></section>
      <section className="home-tutor-section" id="instructors"><TutorMarketplaceTeaser /></section>
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