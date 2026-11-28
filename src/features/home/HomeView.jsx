import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../components/Icon/Icon';
import ClassSwitcher from '../../components/ClassSwitcher/ClassSwitcher';
const StatsGrid = lazy(() => import('./StatsGrid').then((module) => ({ default: module.StatsGrid })));
const PricingCards = lazy(() => import('./PricingCards').then((module) => ({ default: module.PricingCards })));
const TestimonialSlider = lazy(() => import('./TestimonialSlider').then((module) => ({ default: module.TestimonialSlider })));
const ChatWidget = lazy(() => import('../chat/ChatWidget').then((module) => ({ default: module.ChatWidget })));
const NewsletterForm = lazy(() => import('./NewsletterForm').then((module) => ({ default: module.NewsletterForm })));
const ClassroomTeaser = lazy(() => import('../classroom/ClassroomTeaser'));
const TutorMarketplaceTeaser = lazy(() => import('../tutor-marketplace/TutorMarketplaceTeaser'));
const AdsHomeSection = lazy(() => import('../../components/Advertising/AdsHomeSection'));
import AdSlot from '../../components/Advertising/AdSlot';
import LernwickHomeHero from './LernwickHomeHero';
import { ProgrammeDiscovery, LearningProcess, ConnectedLearning } from './LernwickHomeSections';
const HomeDashboardCard = lazy(() => import('../../components/dashboard/HomeDashboardCard'));
import DynamicActions from '../../components/DynamicActions';
import ThreeDButton from '../../components/buttons/ThreeDButton';
import Breadcrumb from '../../components/Breadcrumb/Breadcrumb';
import StorysetIllustration from '../../components/StorysetIllustration';
import { UI } from '../../design-system';

const CONTINUE_ICON = { note: 'book-open', video: 'play', quiz: 'clipboard-check' };

function DeferredHomeContent({ children, className = '' }) {
  const containerRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setIsReady(true);
      return undefined;
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setIsReady(true);
        observer.disconnect();
      }
    }, { rootMargin: '700px 0px' });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return <div ref={containerRef} className={className}>{isReady ? children : null}</div>;
}

function ContinueLearningRail({ items, navigate }) {
  if (!items?.length) return null;
  return (
    <section className="w-full bg-background px-5 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto mb-7 flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          
          <h2 className={UI.sectionHeadingTitle}>Continue learning</h2>
        </div>
        <Link to="/dashboard" className="text-sm font-bold text-primary-700 hover:text-secondary-700">View all learning activity →</Link>
      </div>
      <div className="mx-auto flex max-w-7xl flex-col gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex flex-col gap-4 border-b border-border py-4 first:pt-0 last:border-0 sm:flex-row sm:items-center">
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
          
          <h2 id="home-curriculum-heading" className={`${UI.sectionHeadingTitle} mt-2`}>{selectedNode ? selectedNode.name : `Choose a ${firstStepLabel}`}</h2>
          <p className={`${UI.sectionHeadingDescription} mt-8`}>{description}</p>
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
  return (
    <section className="w-full bg-secondary-50 py-10 sm:py-14" aria-labelledby="home-challenge-heading">
      <div className="mx-auto grid w-full max-w-7xl items-center gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,1fr)_180px] lg:px-8">
        <div className="min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-secondary-800">{labels[challengeType] || 'Daily Challenge'}</span>
          <h2 id="home-challenge-heading" className="mt-2 text-2xl font-extrabold text-primary-900 sm:text-3xl">{challenge.title}</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-700">{challenge.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm font-semibold text-primary-900"><span className="inline-flex items-center gap-2"><Icon name={icons[challengeType] || 'star'} />{labels[challengeType] || 'Challenge'}</span><span>+{challenge.reward_xp} XP</span></div>
          <div className="mt-5"><ThreeDButton type="button" variant="solid" iconRight="arrow-right" onClick={onOpen}>{challenge.passed ? 'View challenge' : 'Start challenge'}</ThreeDButton></div>
        </div>
        <StorysetIllustration name="onlineTest" alt="Learner taking a knowledge challenge" className="mx-auto hidden w-36 shrink-0 object-contain lg:block" />
      </div>
    </section>
  );
}

function DailyRecallCard({ recall, onReveal, onStart }) {
  if (!recall) return null;
  const { question_text, meta, score } = recall;
  const progress = score?.total ? (score.completed / score.total) * 100 : 0;
  return (
    <section className="w-full bg-primary-50 py-10 sm:py-14" aria-labelledby="home-daily-recall-heading">
      <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 sm:px-6 lg:px-8">
        <header className="grid gap-2"><h2 id="home-daily-recall-heading" className="text-2xl font-extrabold text-primary-900 sm:text-3xl">{question_text}</h2><p className="text-sm leading-7 text-muted">{meta}</p></header>
        <div className="grid gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-6">
          {score ? <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-3 text-sm"><strong className="text-primary-900">Today's recall</strong><span className="font-bold text-primary-800">{score.completed} / {score.total}</span><span className="text-muted">· +{score.xp_earned} XP</span></div><div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100}><span className="block h-full rounded-full bg-emerald-600" style={{ width: `${progress}%` }} /></div></div> : <div />}
          <div className="flex flex-wrap gap-3 sm:justify-end"><ThreeDButton type="button" variant="soft" onClick={onReveal}>Reveal answer</ThreeDButton><ThreeDButton type="button" variant="solid" iconRight="arrow-right" onClick={onStart}>Start recall</ThreeDButton></div>
        </div>
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

      <DynamicActions pageId="home" className="mx-auto w-full max-w-7xl px-4 py-3 sm:px-6 lg:px-8" />

      <ProgrammeDiscovery activeLevelName={activeLevelName} activeGroupName={activeGroupName} activeGroupId={activeGroupId} />

      {user && <CurriculumSnapshot nodes={curriculumUnits} activeLevelName={activeLevelName} activeGroupName={activeGroupName} sections={sections} />}

      <LearningProcess activeLevelName={activeLevelName} activeGroupName={activeGroupName} />

      <ConnectedLearning />

      {user && (
        <section className="w-full bg-primary-50 px-5 py-12 sm:px-8 lg:px-12" id="dashboard">
          {!isDesktopViewport && <ClassSwitcher className="mx-auto mb-4 w-full max-w-xs sm:ml-0 sm:mr-0" />}
          <Suspense fallback={null}><HomeDashboardCard /></Suspense>
          <ContinueLearningRail items={continueLearning} navigate={navigate} />
        </section>
      )}

      {user && <section className="w-full bg-secondary-50 px-5 py-12 sm:px-8 lg:px-12" aria-label="Daily learning activities">
        <ChallengeTreasureCard challenge={dailyChallenge} onOpen={onOpenChallenge} />
        <DailyRecallCard recall={dailyRecall} onReveal={onRevealRecall} onStart={onStartRecall} />
      </section>}

      {sections?.testimonials?.quotes?.length > 0 && <section className="w-full" id="testimonials">
        <DeferredHomeContent className="min-h-[28rem]"><Suspense fallback={null}><TestimonialSlider quotes={sections.testimonials.quotes} /></Suspense></DeferredHomeContent>
      </section>}

      <section className="w-full" aria-label="Platform statistics">
        <DeferredHomeContent className="min-h-[32rem]"><Suspense fallback={null}><StatsGrid stats={publicStats || {}} scopeLabel={activeGroupName || activeLevelName || 'All learning levels'} /></Suspense></DeferredHomeContent>
      </section>

      <DeferredHomeContent className="min-h-[32rem]"><Suspense fallback={null}><PricingCards plans={subscriptionPlans} user={user} /></Suspense></DeferredHomeContent>
      <section className="w-full" id="classroom"><DeferredHomeContent className="min-h-96"><Suspense fallback={null}><ClassroomTeaser /></Suspense></DeferredHomeContent></section>
      <section className="w-full" id="instructors"><DeferredHomeContent className="min-h-[34rem]"><Suspense fallback={null}><TutorMarketplaceTeaser /></Suspense></DeferredHomeContent></section>
      <section className="w-full"><DeferredHomeContent className="min-h-96"><Suspense fallback={null}><AdsHomeSection /></Suspense><AdSlot placement="homepage" pageContext="home" /></DeferredHomeContent></section>
      <section className="w-full" id="newsletter"><DeferredHomeContent className="min-h-[38rem]"><Suspense fallback={null}><NewsletterForm email={newsletterEmail} status={newsletterStatus} loading={newsletterLoading} onChange={(event) => setNewsletterEmail(event.target.value)} onSubmit={handleNewsletterSubmit} /></Suspense></DeferredHomeContent></section>
      <Suspense fallback={null}><ChatWidget chatOpen={chatOpen} chatMessages={chatMessages} chatInput={chatInput} adminOnline={adminOnline} onToggle={() => setChatOpen(!chatOpen)} onSend={sendChat} onInputChange={setChatInput} onDeleteMsg={deleteChatMsg} sending={chatSending} deletingId={chatDeletingId} requestLoading={chatRequestLoading} chatBodyRef={chatBodyRef} /></Suspense>
    </div>
  );
}