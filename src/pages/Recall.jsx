import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRequireOnboarding } from '../hooks/useRequireOnboarding';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useContentAccess } from '../hooks/useContentAccess';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import StorysetIllustration from '../components/StorysetIllustration';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import { useToast } from '../components/Toast/Toast';
import {
  getRecallStats,
  getRecallAchievements,
  getRecallDashboard,
  getRecallTopics,
  startRecallSession,
  continueRecallSession,
  submitRecallAnswer,
  completeRecallSession,
  getLeaderboard,
  getRecallDueQueue,
  submitRecallConfidence
} from '../api/cachedClient';
import { PendingApprovalScreen } from '../components/access/PendingApprovalScreen';
import { AccessDenied } from '../components/access/AccessDenied';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import Skeleton from '../components/Skeleton/Skeleton';
import ProgressBar from '../components/ProgressBar/ProgressBar';
import Button from '../components/Button/Button';
import ContentSwitcher from '../components/ContentSwitcher/ContentSwitcher';
import Card from '../components/Card/Card';
import Modal from '../components/Modal/Modal';
import Input from '../components/Input/Input';
import RecallAnalyticsHub from '../components/recall/RecallAnalyticsHub';
import RecallProgressTab from '../components/recall/RecallProgressTab';
import RecallInsightsTab from '../components/recall/RecallInsightsTab';
import RecallLeaderboardTab from '../components/recall/RecallLeaderboardTab';

function computeXpProgress(totalXp) {
  const xp = totalXp || 0;
  const level = Math.floor(xp / 100) + 1;
  const xpIntoLevel = xp % 100;
  const xpToNext = 100 - xpIntoLevel;

  return {
    level,
    xpIntoLevel,
    xpToNext,
    progressPercent: xpIntoLevel
  };
}

const CONFIDENCE_LEVELS = [
  { key: 'again', label: 'Again', icon: 'rotate', variant: 'danger' },
  { key: 'hard', label: 'Hard', icon: 'wrench', variant: 'warm' },
  { key: 'good', label: 'Good', icon: 'check', variant: 'primary' },
  { key: 'easy', label: 'Easy', icon: 'star', variant: 'success' }
];

export default function BioRecall() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const sourceNoteId = searchParams.get('note_id') || null;
  const activityScope = searchParams.get('activity_scope') || (sourceNoteId ? 'note' : null);
  const challengeId = searchParams.get('challenge_id') || null;
  const resumeRequested = searchParams.get('resume') === '1';
  const resumeSessionId = searchParams.get('session_id') || null;
  const { isReady } = useRequireOnboarding();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();
  const { level, class_name, displayName } = useLevelFilter();
  const addToast = useToast();

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [sessionActive, setSessionActive] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessionQuote, setSessionQuote] = useState(null);
  const [xpTotal, setXpTotal] = useState(0);
  const [streakDays, setStreakDays] = useState(0);
  const [masteryTopics, setMasteryTopics] = useState({});
  const [accuracy, setAccuracy] = useState(0);
  const [showReport, setShowReport] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);
  const [sessionRecommendation, setSessionRecommendation] = useState(null);
  const [newlyAwarded, setNewlyAwarded] = useState([]);
  const [achievementsList, setAchievementsList] = useState([]);
  const [topicModalOpen, setTopicModalOpen] = useState(false);
  const [topicList, setTopicList] = useState([]);
  const [levelMeta, setLevelMeta] = useState(null);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [feedbackResult, setFeedbackResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [rankTitle, setRankTitle] = useState('Beginner');
  const [xpProgress, setXpProgress] = useState({
    level: 1,
    xpIntoLevel: 0,
    xpToNext: 100,
    progressPercent: 0
  });
  const [dueQueue, setDueQueue] = useState([]);
  const [dueTotal, setDueTotal] = useState(0);
  const [dueQueueOpen, setDueQueueOpen] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQuestion, setReviewQuestion] = useState(null);
  const [submittingConfidence, setSubmittingConfidence] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [clozeAnswer, setClozeAnswer] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try {
      return localStorage.getItem('bioRecall_sound') !== 'off';
    } catch {
      return true;
    }
  });
  const [activeTab, setActiveTab] = useState('progress');
  const [isTabView, setIsTabView] = useState(false);

  const answerInputRef = useRef(null);
  const isMounted = useRef(true);
  const resumeStarted = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !access.canAccess || access.isPending) return;

    loadUserProgress();
    loadDueQueue();
  }, [isReady, access.canAccess, access.isPending, curriculumUnitId, sourceNoteId, activityScope]);

  useEffect(() => {
    if (
      !resumeRequested ||
      resumeStarted.current ||
      loading ||
      !isReady ||
      !access.canAccess ||
      access.isPending ||
      locked ||
      !curriculumUnitId
    ) return;

    const topic = topicList.find(
      (item) => String(item.unit_id) === String(curriculumUnitId)
    );

    if (!topic) return;

    resumeStarted.current = true;
    setSelectedTopic(topic);
    setLoading(true);

    (resumeSessionId
      ? continueRecallSession(resumeSessionId)
      : startRecallSession(topic.unit_id, challengeId, sourceNoteId, activityScope))
      .then((started) => {
        if (!started?.session_id || !started?.current_question) {
          addToast('No active questions available for this topic', 'warning');
          return;
        }

        setSessionId(started.session_id);
        setTotalQuestions(started.total_questions || 0);
        setCurrentIndex(started.current_index || 0);
        setCurrentQuestion(started.current_question);
        setSessionQuote(started.quote || null);

        if (started.level) setLevelMeta(started.level);

        setFeedbackResult(null);
        setClozeAnswer('');
        setReviewMode(false);
        setSessionActive(true);
        setIsTabView(false);
      })
      .catch(() => {
        addToast('Failed to resume BioRecall session', 'error');
      })
      .finally(() => setLoading(false));
  }, [
    resumeRequested,
    loading,
    isReady,
    access.canAccess,
    access.isPending,
    locked,
    curriculumUnitId,
    sourceNoteId,
    activityScope,
    challengeId,
    resumeSessionId,
    topicList,
    addToast
  ]);

  async function loadUserProgress() {
    setLoading(true);
    setSectionLoading(true);

    try {
      const [dash, stats, achievements, topicsRes, lb] = await Promise.all([
        getRecallDashboard().catch(() => null),
        getRecallStats().catch(() => null),
        getRecallAchievements().catch(() => []),
        getRecallTopics({ ...(curriculumUnitId ? { unit_id: curriculumUnitId } : {}), ...(sourceNoteId ? { note_id: sourceNoteId } : {}) }).catch(() => ({ level: null, units: [] })),
        getLeaderboard(displayName || level || null, 10).catch(() => [])
      ]);

      if (!isMounted.current) return;

      if (dash) {
        setXpTotal(dash.total_xp || 0);
        setStreakDays(dash.current_streak || 0);
        setRankTitle(dash.rank_title || 'Beginner');
        setXpProgress(
          dash.xp_progress ||
            computeXpProgress(dash.total_xp || 0)
        );

        if (dash.level_meta) {
          setLevelMeta(dash.level_meta);
        }

        if (typeof dash.accuracy === 'number') {
          setAccuracy(dash.accuracy);
        }
      }

      if (stats) {
        setMasteryTopics(stats.mastery_topics || {});

        if (typeof stats.accuracy === 'number') {
          setAccuracy(stats.accuracy);
        }
      }

      setAchievementsList(
        Array.isArray(achievements) ? achievements : []
      );

      const availableTopics = Array.isArray(topicsRes?.units)
        ? topicsRes.units
        : [];

      setTopicList(
        curriculumUnitId
          ? availableTopics.filter(
              (topic) => String(topic.unit_id) === String(curriculumUnitId)
            )
          : availableTopics
      );

      if (topicsRes?.level) {
        setLevelMeta((prev) => prev || topicsRes.level);
      }

      setLeaderboard(
        Array.isArray(lb) ? lb : []
      );
    } catch {
      addToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
      setSectionLoading(false);
    }
  }

  async function loadDueQueue() {
    try {
      const result = await getRecallDueQueue(20);

      if (!isMounted.current) return;

      setDueQueue(
        Array.isArray(result?.items) ? result.items : []
      );

      setDueTotal(result?.total || 0);
    } catch {}
  }

  const openTopicModal = () => setTopicModalOpen(true);
  const closeTopicModal = () => setTopicModalOpen(false);
  const openDueQueue = () => setDueQueueOpen(true);
  const closeDueQueue = () => setDueQueueOpen(false);

  async function handleStartSession(topic) {
    if (locked) {
      addToast(
        reason || 'Action temporarily disabled',
        'error'
      );
      return;
    }

    setSelectedTopic(topic);
    setTopicModalOpen(false);
    setLoading(true);

    try {
      const started = await startRecallSession(
        topic.unit_id,
        challengeId,
        sourceNoteId,
        activityScope
      );

      if (
        !started?.session_id ||
        !started?.current_question
      ) {
        addToast(
          'No questions available for this topic',
          'warning'
        );
        return;
      }

      setSessionId(started.session_id);
      setTotalQuestions(
        started.total_questions || 0
      );
      setCurrentIndex(
        started.current_index || 0
      );
      setCurrentQuestion(
        started.current_question
      );
      setSessionQuote(
        started.quote || null
      );

      if (started.level) {
        setLevelMeta(started.level);
      }

      setFeedbackResult(null);
      setClozeAnswer('');
      setReviewMode(false);
      setSessionActive(true);
      setIsTabView(false);
    } catch {
      addToast(
        'Failed to start session',
        'error'
      );
    } finally {
      setLoading(false);
      setStartingSession(false);
    }
  }

  async function handleStartReview(item) {
    if (locked) {
      addToast(
        reason || 'Action temporarily disabled',
        'error'
      );
      return;
    }

    setDueQueueOpen(false);
    setReviewMode(true);
    setReviewQuestion(item);
    setFeedbackResult(null);
    setSessionActive(false);
    setIsTabView(false);

    setCurrentQuestion({
      id: item.question_id,
      question_text: item.question_text,
      question_type: 'open_ended'
    });
  }

  async function handleReviewConfidence(confidence) {
    if (!reviewQuestion) return;

    setSubmittingConfidence(true);

    try {
      await submitRecallConfidence(
        'review-queue',
        reviewQuestion.question_id,
        confidence
      );

      addToast(
        `Marked as ${confidence}`,
        'success'
      );

      setReviewQuestion(null);
      setFeedbackResult(null);
      loadDueQueue();
    } catch {
      addToast(
        'Failed to update review',
        'error'
      );
    } finally {
      setSubmittingConfidence(false);
    }
  }

  async function handleSubmitAnswer() {
    if (locked) {
      addToast(
        reason || 'Action temporarily disabled',
        'error'
      );
      return;
    }

    let answer = '';

    if (
      currentQuestion?.question_type === 'cloze'
    ) {
      answer = clozeAnswer.trim();
    } else {
      answer =
        answerInputRef.current?.value?.trim();
    }

    if (!answer || !currentQuestion) return;

    setAnalyzing(true);

    try {
      const result = await submitRecallAnswer(
        sessionId,
        currentQuestion.id,
        answer
      );

      setFeedbackResult(result);

      if (
        typeof result.total_xp === 'number'
      ) {
        setXpTotal(result.total_xp);
        setXpProgress(
          computeXpProgress(result.total_xp)
        );
      } else if (result.xp_earned) {
        setXpTotal((prev) => {
          const newTotal =
            (prev || 0) + result.xp_earned;

          setXpProgress(
            computeXpProgress(newTotal)
          );

          return newTotal;
        });
      }
    } catch {
      addToast(
        "We couldn't submit your answer. Please try again.",
        'error'
      );
    } finally {
      setAnalyzing(false);

      if (answerInputRef.current) {
        answerInputRef.current.value = '';
      }

      setClozeAnswer('');
    }
  }

  async function handleSessionConfidence(confidence) {
    if (
      locked ||
      !currentQuestion ||
      !sessionId
    ) {
      return;
    }

    setSubmittingConfidence(true);

    try {
      await submitRecallConfidence(
        sessionId,
        currentQuestion.id,
        confidence
      );

      if (confidence === 'again') {
        addToast(
          'Will show again soon',
          'info'
        );
      } else {
        addToast(
          'Scheduled for review',
          'success'
        );
      }

      loadDueQueue();
    } catch {
      addToast(
        'Failed to record confidence',
        'error'
      );
    } finally {
      setSubmittingConfidence(false);
    }
  }

  async function handleNextQuestion() {
    if (
      locked ||
      !feedbackResult
    ) {
      return;
    }

    if (feedbackResult.is_complete) {
      setLoading(true);

      try {
        const result =
          await completeRecallSession(
            sessionId
          );

        setSessionReport(
          result?.report || null
        );
        setSessionRecommendation(result?.recommendation || null);

        setNewlyAwarded(
          Array.isArray(result?.newly_awarded)
            ? result.newly_awarded
            : []
        );

        if (
          result?.streak_info?.current_streak !=
          null
        ) {
          setStreakDays(
            result.streak_info.current_streak
          );
        }
      } catch {
        addToast(
          'Failed to complete session',
          'error'
        );
      } finally {
        setSessionActive(false);
        setShowReport(true);
        setLoading(false);
      }

      return;
    }

    setLoading(true);

    try {
      const cont =
        await continueRecallSession(
          sessionId
        );

      setCurrentQuestion(
        cont.current_question || null
      );

      setCurrentIndex(
        cont.current_index || 0
      );

      setTotalQuestions(
        cont.total_questions ||
          totalQuestions
      );

      setFeedbackResult(null);
      setClozeAnswer('');
    } catch {
      addToast(
        "We couldn't load the next question. Please try again.",
        'error'
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleSound() {
    setSoundEnabled((prev) => {
      const next = !prev;

      try {
        localStorage.setItem(
          'bioRecall_sound',
          next ? 'on' : 'off'
        );
      } catch {}

      return next;
    });
  }

  if (!isReady || access.loading) {
    return (
      <div className="fcd-loading-wrap">
        <Spinner size="lg" />
      </div>
    );
  }

  if (access.isPending) {
    return <PendingApprovalScreen />;
  }

  if (!access.canAccess) {
    return <AccessDenied />;
  }

  if (
    loading &&
    !sessionActive &&
    !showReport &&
    !reviewMode &&
    !isTabView
  ) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-primary-50">
        <Spinner size="lg" />
      </div>
    );
  }

  const topicEntries = Object.entries(
    masteryTopics
  )
    .filter(
      ([topic]) =>
        topic &&
        topic !== 'null'
    )
    .slice(0, 6);

  const levelName =
    levelMeta?.display_name ||
    displayName ||
    level?.id ||
    '';

  const unitLabel =
    levelMeta?.unit_label ||
    'Topic';

  const groupLabel =
    levelMeta?.group_label ||
    'Class';

  const classLabel =
    class_name || '';

  const levelIcon =
    levelMeta?.icon === 'dna'
      ? 'microscope'
      : levelMeta?.icon ||
        'microscope';

  function rankClass(index) {
    if (index === 0) return 'is-gold';
    if (index === 1) return 'is-silver';
    if (index === 2) return 'is-bronze';

    return 'is-default';
  }

  const renderTabBar = () => (
    <ContentSwitcher
      title="Recall dashboard"
      options={[
        { value: 'progress', label: 'Your Progress', icon: <Icon name="chart-line" /> },
        { value: 'insights', label: 'Insights & Analytics', icon: <Icon name="chart-pie" /> },
        { value: 'leaderboard', label: 'Leaderboard', icon: <Icon name="trophy" /> }
      ]}
      value={activeTab}
      onChange={setActiveTab}
    />
  );

  if (isTabView) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white p-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsTabView(false)}
          >
            <Icon name="arrow-left" />
            Back
          </Button>
          {renderTabBar()}
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'progress' && (
            <RecallProgressTab
              xpProgress={xpProgress}
              accuracy={accuracy}
              rankTitle={rankTitle}
              achievementsList={achievementsList}
              masteryTopics={masteryTopics}
            />
          )}
          {activeTab === 'insights' && <RecallInsightsTab />}
          {activeTab === 'leaderboard' && (
            <RecallLeaderboardTab leaderboard={leaderboard} />
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen w-full bg-background text-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
        <Breadcrumb items={[{ label: 'Home', href: '/' }, { label: 'Recall practice' }]} />

        <header className="mb-8 flex flex-col gap-4 border-b border-border pb-8">
          

          <div className="flex items-center justify-between gap-5">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-primary-900 sm:text-4xl font-fraunces">{levelName || 'Strengthen your learning with active recall'}</h1>
            <StorysetIllustration name="personalGoals" alt="Learner building a consistent study habit" className="hidden w-32 shrink-0 object-contain sm:block" />
          </div>

          <p className="text-sm leading-7 text-muted">
            Use spaced repetition to review key ideas, answer questions, and track your progress.
          </p>

          {levelName && (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex rounded-full bg-primary-100 px-3 py-1.5 text-xs font-bold text-primary-900 font-maven-pro">
                {levelName}
              </span>

              {classLabel && (
                <span className="inline-flex rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-bold text-secondary-900 font-maven-pro">
                  {groupLabel}: {classLabel}
                </span>
              )}
            </div>
          )}
        </header>

        {dueTotal > 0 &&
          !sessionActive &&
          !showReport &&
          !reviewMode && (
            <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-primary-200 bg-primary-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <Icon
                  name="calendar-clock"
                  className="h-8 w-8 shrink-0 text-primary-700"
                />

                <div>
                  <h3 className="text-lg font-extrabold text-primary-900 font-poppins">
                    {dueTotal} {dueTotal === 1 ? 'review' : 'reviews'} due
                  </h3>

                  <p className="text-sm leading-6 text-muted font-source-sans">
                    Review these questions to strengthen your memory.
                  </p>
                </div>
              </div>

              <Button
                variant="warm"
                size="sm"
                onClick={openDueQueue}
              >
                <Icon name="layer-group" />
                Review now
              </Button>
            </div>
          )}

        {!sessionActive &&
          !showReport &&
          !reviewMode && (
            <>
              {sectionLoading ? (
                <div className="grid gap-4">
                  <Skeleton height={140} />

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Skeleton height={100} />
                    <Skeleton height={100} />
                    <Skeleton height={100} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
                    <Icon
                      name={levelIcon}
                      className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-100 p-3 text-primary-800"
                    />

                    <Button
                      onClick={openTopicModal}
                      size="lg"
                      disabled={locked}
                    >
                      Choose a topic
                    </Button>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <Icon
                          name="fire"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 p-2 text-primary-700"
                        />

                        <span className="mt-2 block text-sm font-semibold text-muted font-source-sans">
                          {streakDays}-day streak
                        </span>
                      </div>

                      <div>
                        <Icon
                          name="star"
                          className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 p-2 text-primary-700"
                        />

                        <span className="mt-2 block text-sm font-semibold text-muted font-source-sans">
                          Level {xpProgress.level} · {xpTotal} XP · {rankTitle}
                        </span>
                      </div>
                    </div>
                  </div>

                  {renderTabBar()}

                  <div className="flex justify-end py-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsTabView(true)}
                    >
                      <Icon name="expand" />
                      Open full screen
                    </Button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                    <h3 className="text-lg font-extrabold text-primary-900 font-poppins">
                      Study preferences
                    </h3>

                    <Button
                      variant="ghost"
                      onClick={toggleSound}
                    >
                      <Icon
                        name={
                          soundEnabled
                            ? 'volume-high'
                            : 'volume-xmark'
                        }
                      />
                      Sound:{' '}
                      {soundEnabled ? 'On' : 'Off'}
                    </Button>
                  </div>
                </>
              )}
            </>
          )}

        {sessionActive &&
          currentQuestion && (
            <div>
              <ProgressBar
                value={currentIndex + 1}
                max={totalQuestions}
                variant="primary"
              />

              <p className="quiz-progress-label font-source-sans">
                Question {currentIndex + 1} of{' '}
                {totalQuestions}

                {selectedTopic?.topic_name && (
                  <span className="ml-2 inline-flex rounded-full bg-primary-100 px-3 py-1 text-xs font-bold text-primary-900">
                    {selectedTopic.topic_name}
                  </span>
                )}
              </p>

              {sessionQuote && (
                <p className="rounded-xl bg-primary-50 p-4 text-sm leading-7 text-primary-900 font-fraunces">
                  "{sessionQuote.quote}"
                  {sessionQuote.author
                    ? ` — ${sessionQuote.author}`
                    : ''}
                </p>
              )}

              <Card className="border border-border bg-white p-5">
                {currentQuestion.question_type ===
                  'cloze' &&
                currentQuestion.cloze_template ? (
                  <div className="grid gap-4">
                    <p className="text-sm leading-7 text-slate-700 font-source-sans">
                      {currentQuestion.cloze_template
                        .split('___')
                        .map(
                          (
                            part,
                            index,
                            array
                          ) => (
                            <span key={index}>
                              {part}

                              {index <
                                array.length -
                                  1 && (
                                <input
                                  className={`${UI.inputBase} border-border`}
                                  value={
                                    clozeAnswer
                                  }
                                  onChange={(e) =>
                                    setClozeAnswer(
                                      e.target
                                        .value
                                    )
                                  }
                                  disabled={
                                    analyzing ||
                                    locked
                                  }
                                  placeholder="..."
                                  aria-label="Fill in the blank"
                                />
                              )}
                            </span>
                          )
                        )}
                    </p>
                  </div>
                ) : (
                  <>
                    <h3 className="text-lg font-extrabold leading-7 text-primary-900 font-poppins">
                      {
                        currentQuestion.question_text
                      }
                    </h3>

                    <Input
                      ref={answerInputRef}
                      placeholder="Type your answer..."
                      disabled={
                        analyzing || locked
                      }
                    />
                  </>
                )}

                {analyzing && (
                  <div className="flex items-center gap-3 rounded-xl bg-primary-50 p-4">
                    <Spinner size="sm" />

                    <span className="text-sm font-semibold text-muted font-maven-pro">
                      Checking
                    </span>
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  {!feedbackResult ? (
                    <Button
                      onClick={
                        handleSubmitAnswer
                      }
                      disabled={
                        analyzing || locked
                      }
                      loading={analyzing}
                    >
                      <Icon name="paper-plane" />
                      Submit
                    </Button>
                  ) : (
                    <Button
                      onClick={
                        handleNextQuestion
                      }
                      loading={loading}
                      disabled={
                        loading || locked
                      }
                    >
                      {feedbackResult.is_complete
                        ? 'Finish session'
                        : 'Next question'}

                      <Icon name="arrow-right" />
                    </Button>
                  )}
                </div>
              </Card>

              {feedbackResult && (
                <Card className="grid gap-4 border border-border bg-white p-5">
                  <div className="flex items-center gap-3">
                    <Icon
                      name={
                        feedbackResult.strength ===
                        'excellent'
                          ? 'star'
                          : feedbackResult.strength ===
                            'strong'
                          ? 'circle'
                          : 'rotate'
                      }
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${
                        feedbackResult.strength ===
                        'excellent'
                          ? 'bg-emerald-100 text-emerald-800'
                          : feedbackResult.strength ===
                            'strong'
                          ? 'bg-primary-100 text-primary-800'
                          : 'bg-secondary-100 text-secondary-800'
                      }`}
                    />

                    <div>
                      <h4 className="font-poppins">
                        {feedbackResult.strength ===
                        'excellent'
                          ? 'Perfect'
                          : feedbackResult.strength ===
                            'strong'
                          ? 'Close'
                          : 'Needs Review'}
                      </h4>

                      <p className="inline-flex w-fit rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-bold text-secondary-900 font-mono">
                        +{feedbackResult.xp_earned} XP
                      </p>
                    </div>
                  </div>

                  <p className="font-source-sans">
                    <strong>
                      Correct answer:
                    </strong>{' '}
                    {
                      feedbackResult.correct_answer
                    }
                  </p>

                  {feedbackResult.note && (
                    <p className="rounded-xl bg-primary-50 p-3 text-sm leading-6 text-slate-700 font-open-sans">
                      {feedbackResult.note}
                    </p>
                  )}

                  {feedbackResult.explanation && (
                    <p className="text-sm leading-7 text-slate-700 font-open-sans">
                      {
                        feedbackResult.explanation
                      }
                    </p>
                  )}

                  <div className="grid gap-3">
                    <span className="text-sm font-bold text-primary-900 font-poppins">
                      How well did you recall this?
                    </span>

                    <div className="flex flex-wrap gap-2">
                      {CONFIDENCE_LEVELS.map(
                        (item) => (
                          <Button
                            key={item.key}
                            variant={
                              item.variant
                            }
                            size="sm"
                            loading={
                              submittingConfidence
                            }
                            onClick={() =>
                              handleSessionConfidence(
                                item.key
                              )
                            }
                          >
                            <Icon
                              name={item.icon}
                            />
                            {item.label}
                          </Button>
                        )
                      )}
                    </div>
                  </div>
                </Card>
              )}
            </div>
          )}

        {reviewMode &&
          reviewQuestion && (
            <div>
              <Card className="border border-border bg-white p-5">
                <div className="inline-flex w-fit items-center gap-2 rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-bold text-secondary-900 font-comfortaa">
                  <Icon name="calendar-clock" />
                  Due Review
                </div>

                <h3 className="text-lg font-extrabold leading-7 text-primary-900 font-poppins">
                  {reviewQuestion.question_text}
                </h3>

                <p className="rounded-xl bg-primary-50 p-4 text-sm leading-6 text-slate-700 font-source-sans">
                  <strong>Answer:</strong>{' '}
                  {reviewQuestion.correct_answer}
                </p>

                {reviewQuestion.explanation && (
                  <p className="text-sm leading-7 text-muted font-open-sans">
                    {
                      reviewQuestion.explanation
                    }
                  </p>
                )}

                <div className="grid gap-3">
                  <span className="text-sm font-bold text-primary-900 font-poppins">
                    How well did you recall this?
                  </span>

                  <div className="flex flex-wrap gap-2">
                    {CONFIDENCE_LEVELS.map(
                      (item) => (
                        <Button
                          key={item.key}
                          variant={item.variant}
                          size="sm"
                          loading={
                            submittingConfidence
                          }
                          onClick={() =>
                            handleReviewConfidence(
                              item.key
                            )
                          }
                        >
                          <Icon
                            name={item.icon}
                          />
                          {item.label}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setReviewMode(false);
                      setReviewQuestion(null);
                    }}
                  >
                    <Icon name="xmark" />
                    Close
                  </Button>
                </div>
              </Card>
            </div>
          )}

        {showReport &&
          sessionReport && (
            <Card className="grid gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm">
              <Icon
                name="trophy"
                className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary-100 p-3 text-primary-800"
              />

              <h2 className="font-fraunces">
                Session Complete
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="text-3xl font-extrabold text-emerald-700 font-poppins">
                    {sessionReport.excellent ||
                      0}
                  </div>

                  <div className="text-xs font-semibold text-muted font-source-sans">
                    Excellent
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-primary-800 font-poppins">
                    {sessionReport.strong ||
                      0}
                  </div>

                  <div className="text-xs font-semibold text-muted font-source-sans">
                    Strong
                  </div>
                </div>

                <div>
                  <div className="text-3xl font-extrabold text-secondary-700 font-poppins">
                    {sessionReport.developing ||
                      0}
                  </div>

                  <div className="text-xs font-semibold text-muted font-source-sans">
                    Needs Review
                  </div>
                </div>
              </div>

              <p className="font-source-sans">
                Mastery Score:{' '}
                {sessionReport.mastery_score ||
                  0}
                %
              </p>

              <p className="text-sm text-muted font-mono">
                Total time:{' '}
                {
                  sessionReport.total_time_formatted
                }{' '}
                · Avg:{' '}
                {
                  sessionReport.avg_time_formatted
                }{' '}
                per question
              </p>

              {sessionRecommendation && (
                <div className="grid gap-3 rounded-xl bg-primary-50 p-4" aria-live="polite">
                  <h3>{sessionRecommendation.title || 'Recommended next step'}</h3>
                  <p>{sessionRecommendation.message}</p>
                  <Button variant="secondary" onClick={() => navigate(sessionRecommendation.route || '/resources')}>
                    {sessionRecommendation.label || 'Continue learning'}
                  </Button>
                </div>
              )}

              {newlyAwarded.length > 0 && (
                <div className="grid gap-3">
                  <h4 className="font-poppins">
                    New Achievements
                  </h4>

                  <div className="flex flex-wrap gap-2">
                    {newlyAwarded.map(
                      (achievement) => (
                        <span
                          key={achievement.id}
                          className="inline-flex items-center gap-2 rounded-full bg-secondary-100 px-3 py-1.5 text-xs font-bold text-secondary-900 font-comfortaa"
                          title={
                            achievement.description ||
                            achievement.name
                          }
                        >
                          <Icon
                            name={
                              achievement.icon ===
                              'dna'
                                ? 'microscope'
                                : achievement.icon ||
                                  'medal'
                            }
                          />
                          {achievement.name}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                <Button
                  onClick={() => {
                    setShowReport(false);
                    setSessionActive(false);
                    setSessionRecommendation(null);
                    setNewlyAwarded([]);
                    loadUserProgress();
                    setTopicModalOpen(true);
                  }}
                  disabled={locked}
                >
                  <Icon name="rotate" />
                  Study Another {unitLabel}
                </Button>

                <Button
                  variant="secondary"
                  onClick={() =>
                    navigate('/')
                  }
                >
                  <Icon name="home" />
                  Home
                </Button>
              </div>
            </Card>
          )}

        <Modal
          open={topicModalOpen}
          onClose={closeTopicModal}
          title={`Select a ${unitLabel}`}
        >
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto">
            {topicList.length === 0 && (
              <p className="rounded-xl bg-primary-50 p-4 text-sm leading-6 text-muted font-open-sans">
                Explore your {unitLabel.toLowerCase()}s here when they are ready for study.
              </p>
            )}

            {topicList.map((topic) => (
              <button
                key={topic.unit_id}
                className={UI.secondaryButton}
                onClick={() =>
                  handleStartSession(topic)
                }
                disabled={locked}
              >
                <span>
                  {topic.topic_name}
                </span>

                <span className="text-xs font-semibold text-muted font-mono">
                  {topic.question_count}{' '}
                  questions
                </span>
              </button>
            ))}
          </div>
        </Modal>

        <Modal
          open={dueQueueOpen}
          onClose={closeDueQueue}
          title={`Review Queue (${dueTotal} due)`}
        >
          <div className="grid max-h-[60vh] gap-3 overflow-y-auto">
            {dueQueue.length === 0 ? (
              <p className="rounded-xl bg-primary-50 p-4 text-sm leading-6 text-muted font-open-sans">
                No reviews due. Great job!
              </p>
            ) : (
              dueQueue.map((item) => (
                <button
                  key={item.question_id}
                  className={`${UI.secondaryButton} w-full justify-between font-outfit ${
                    item.is_weak_concept ? 'border-secondary-300 bg-secondary-50 text-secondary-900' : 'border-primary-200 bg-primary-50 text-primary-900'
                  }`}
                  onClick={() =>
                    handleStartReview(item)
                  }
                  disabled={locked}
                >
                  <span className="min-w-0 flex-1 text-sm font-semibold leading-6 text-primary-900 font-source-sans">
                    {item.question_text}
                  </span>

                  <span
                    className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold font-comfortaa ${
                      item.is_weak_concept
                        ? 'bg-secondary-100 text-secondary-900'
                        : 'bg-primary-100 text-primary-900'
                    }`}
                  >
                    {item.is_weak_concept
                      ? 'Weak'
                      : `${item.repetitions} reps`}
                  </span>
                </button>
              ))
            )}
          </div>
        </Modal>
      </div>
    </main>
  );
}

