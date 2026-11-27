 // src/pages/Quiz.jsx
import AdSlot from '../components/Advertising/AdSlot';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import { useRequireOnboarding } from '../hooks/useRequireOnboarding';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import { useToast } from '../components/Toast/Toast';
import {
  getQuizBlock,
  checkQuizAnswer,
  recordDailyVisit,
  getUserStreak,
  startQuizSession,
  trackTabSwitch,
  submitQuizWithSession,
  getQuizSessionStatus
} from '../api/cachedClient';
import { apiCall, listQuizTopics, getQuizTopics, getQuizAttempt } from '../api/client';
import { PendingApprovalScreen } from '../components/access/PendingApprovalScreen';
import { AccessDenied } from '../components/access/AccessDenied';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import { isPremiumAccessError, redirectToSubscription } from '../utils/subscriptionNavigation';
import QuizHero from '../components/quiz/QuizHero';
import QuizLearningPath from '../components/quiz/QuizLearningPath';
import QuizWeakAreas from '../components/quiz/QuizWeakAreas';
import Icon from '../components/Icon/Icon';
import StorysetIllustration from '../components/StorysetIllustration';
import PageSkeleton from '../components/Loading/PageSkeleton';
import PageHeader from '../components/PageHeader/PageHeader';
import { getCachedStale, setCache } from '../utils/cache';
import QuizAnswerLoader from '../components/quiz/QuizAnswerLoader';
import QuizQuestionRenderer from '../components/quiz/QuizQuestionRenderer';
import { prepareQuizAnswerAudio, playQuizAnswerSound, formatQuizRetryTime, createIdempotencyKey } from '../utils/quizRuntime';




import ProgressBar from '../components/ProgressBar/ProgressBar';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Modal from '../components/Modal/Modal';
import { useI18n } from '../contexts/I18nContext';
import { UI } from '../design-system';



export default function Quiz() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isQuizCardsPage = location.pathname === '/quiz/blocks';
  const [searchParams] = useSearchParams();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const sourceNoteId = searchParams.get('note_id') || null;
  const activityScope = searchParams.get('activity_scope') || (sourceNoteId ? 'note' : null);
  const { isReady } = useRequireOnboarding();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();
  const { level, class_name, displayName } = useLevelFilter();
  const addToast = useToast();
  const { t } = useI18n();

  const activeGroupId = profile?.active_group_id;
  const isPharmacy = /pharmacy/i.test(
    `${level?.display_name || ''} ${level?.id || ''} ${profile?.track || ''} ${displayName || ''}`
  );
  const topicHeading = isPharmacy ? 'Course Units' : t('common.availableTopics');
  const topicsCacheKey = `quiz_topics_page_${user?.id || 'guest'}:${activeGroupId || 'all'}:${curriculumUnitId || 'all'}:${sourceNoteId || 'no-note'}:${activityScope || 'default'}`;

  const initialTopics = getCachedStale(topicsCacheKey) || [];
  const [activeUnitId, setActiveUnitId] = useState(() => (location.pathname === '/quiz/blocks' && curriculumUnitId && initialTopics[0]?.unit_id) ? initialTopics[0].unit_id : null);
  const [currentTopic, setCurrentTopic] = useState(() => (location.pathname === '/quiz/blocks' && curriculumUnitId) ? initialTopics[0]?.topic_name || '' : '');
  const [allTopics, setAllTopics] = useState(() => initialTopics);
  const [topicsLoading, setTopicsLoading] = useState(() => !getCachedStale(topicsCacheKey));
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showNextNavigation, setShowNextNavigation] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [totalBlocks, setTotalBlocks] = useState(0);
  const [resultData, setResultData] = useState(null);
  const [showResultNavigationMenu, setShowResultNavigationMenu] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [pendingBlock, setPendingBlock] = useState(null);
  const [loading, setLoading] = useState(true);
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [answerSubmitting, setAnswerSubmitting] = useState(false);
  const [draftAnswer, setDraftAnswer] = useState('');
  const [markedQuestions, setMarkedQuestions] = useState([]);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [startingBlock, setStartingBlock] = useState(false);
  const [blockSubmitting, setBlockSubmitting] = useState(false);
  const [checkingMessage, setCheckingMessage] = useState('Checking your answer');
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [maxTabSwitches, setMaxTabSwitches] = useState(3);
  const [integrityMonitoringStarted, setIntegrityMonitoringStarted] = useState(false);
  const [integrityOverlay, setIntegrityOverlay] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [quizMode, setQuizMode] = useState('study');

  const heartbeatRef = useRef(null);

  const quizModeIsExam = quizMode === 'exam';

  const activeQuizRoute = quizQuestions.length > 0 && activeUnitId && currentTopic && currentBlock !== null;


  useEffect(() => {
    setActiveUnitId(null);
    setCurrentTopic('');
    setQuizQuestions([]);
    setUserAnswers([]);
    setCurrentIndex(0);
    setShowNextNavigation(false);
    setCurrentBlock(0);
    setTotalBlocks(0);
    setResultData(null);
    setTimeLeft(null);
    setIntegrityOverlay(null);
    setAnswerSubmitting(false);
    setIntegrityMonitoringStarted(false);
    setSessionId(null);
  }, [activeGroupId, curriculumUnitId, sourceNoteId, activityScope]);

  useEffect(() => {
    if (!isReady || !access.canAccess || access.isPending) return;

    setLoading(false);

    if (user) {
      recordDailyVisit().catch(() => {});
      getUserStreak()
        .then((streakData) => setStreak(streakData?.count || 0))
        .catch(() => {});
    }
  }, [isReady, access.canAccess, access.isPending, user, curriculumUnitId, sourceNoteId, activityScope]);

  useEffect(() => {
    if (!isReady || !access.canAccess || access.isPending || !user) return;

    let cancelled = false;

    (async () => {
      try {
        const status = await getQuizSessionStatus(curriculumUnitId, null, sourceNoteId, activityScope);
        const session = status?.session;
        if (cancelled || !status?.exists || !session || session.auto_submitted) return;

        const sessionUnitId = session.unit_id;
        const sessionBlock = Number(session.block_number);

        if (!sessionUnitId || !Number.isInteger(sessionBlock)) return;

        const data = await getQuizBlock(sessionUnitId, sessionBlock, sourceNoteId, activityScope);
        if (cancelled || !data?.questions?.length) return;

        const priorAnswers = (data.prior_answers || []).map((answer) =>
          answer ? {
            selected: answer.selected,
            correct: answer.correct,
            correct_option: answer.correct_option,
            correct_answer_text: answer.correct_answer_text,
            explanation: answer.explanation || null
          } : null
        );

        setActiveUnitId(sessionUnitId);
        setCurrentBlock(sessionBlock);
        setCurrentTopic(session.topic || data.unit_name || '');
        setSessionId(session.session_id || null);
        setQuizMode(session.mode || 'study');
        setTabSwitchCount(session.tab_switches || 0);
        setMaxTabSwitches(session.max_allowed || 3);
        setQuizQuestions(data.questions);
        setUserAnswers(
          priorAnswers.length === data.questions.length
            ? priorAnswers
            : new Array(data.questions.length).fill(null)
        );
        setCurrentIndex(Math.max(0, priorAnswers.findIndex((answer) => answer === null)));
        setIntegrityMonitoringStarted(
          session.monitoring_started === true ||
          priorAnswers.some(Boolean)
        );
        setTimeLeft(session.time_left ?? data.time_left ?? 600);
        setResultData(null);
      } catch {
        // A refresh should remain non-disruptive; normal quiz loading follows if no active session exists.
      }
    })();

    return () => { cancelled = true; };
  }, [isReady, access.canAccess, access.isPending, user, curriculumUnitId, sourceNoteId, activityScope]);

  useEffect(() => {
    if (!isReady || !access.canAccess || access.isPending) return;

    const cachedTopics = getCachedStale(topicsCacheKey);
    if (cachedTopics) {
      setAllTopics(cachedTopics);
      setTopicsLoading(false);
      if (isQuizCardsPage && curriculumUnitId) {
        setActiveUnitId(curriculumUnitId);
        setCurrentTopic(cachedTopics[0]?.topic_name || '');
        setTotalBlocks(Number(cachedTopics[0]?.total_blocks) || Math.ceil((Number(cachedTopics[0]?.question_count) || 0) / 10));
      }
    } else {
      setTopicsLoading(true);
    }

    const request = curriculumUnitId
      ? getQuizTopics(curriculumUnitId, sourceNoteId, activityScope).then((topic) => ({
          topics: topic?.unit_id ? [
            {
              unit_id: topic.unit_id,
              topic_name: topic.unit_name,
              topic_image_url: topic.topic_image_url,
              question_count: topic.total_questions || 0,
              total_blocks: topic.total_blocks || 0,
              completed_blocks: topic.completed_blocks || [],
              failed_blocks: topic.failed_blocks || [],
              pending_review_blocks: topic.pending_review_blocks || [],
              all_done: topic.all_done || false
            }
          ] : []
        }))
      : listQuizTopics();

    request
      .then((res) => {
        const topics = Array.isArray(res?.topics) ? res.topics : [];
        setAllTopics(topics);
        setCache(topicsCacheKey, topics);
        if (isQuizCardsPage && curriculumUnitId) {
          setActiveUnitId(curriculumUnitId);
          setCurrentTopic(topics[0]?.topic_name || '');
          setTotalBlocks(Number(topics[0]?.total_blocks) || Math.ceil((Number(topics[0]?.question_count) || 0) / 10));
        }
      })
      .catch(() => setAllTopics([]))
      .finally(() => setTopicsLoading(false));
  }, [isReady, access.canAccess, access.isPending, activeGroupId, curriculumUnitId, sourceNoteId, activityScope, isQuizCardsPage]);

  useEffect(() => {
    if (!answerSubmitting) {
      setCheckingMessage('Checking your answer');
      return;
    }

    const messages = [
      'Checking your answer',
      'Analyzing your response',
      'Comparing with the correct answer',
      'Evaluating your response',
      'Preparing your feedback'
    ];

    const pickMessage = () => {
      const index = Math.floor(Math.random() * messages.length);
      setCheckingMessage(messages[index]);
    };

    pickMessage();

    const id = setInterval(pickMessage, 700);

    return () => clearInterval(id);
  }, [answerSubmitting]);

  useEffect(() => {
    if (timeLeft === null || resultData) return;

    if (timeLeft <= 0) {
      submitBlock();
      return;
    }

    const id = setInterval(() => {
      setTimeLeft((current) => (current === null ? current : current - 1));
    }, 1000);

    return () => clearInterval(id);
  }, [timeLeft, resultData]);

  useEffect(() => {
    if (!sessionId || resultData) return;

    const sendHeartbeat = () => {
      apiCall('quiz', 'quiz_heartbeat', {
        session_id: sessionId,
        client_timestamp: new Date().toISOString(),
        idempotency_key: createIdempotencyKey('heartbeat')
      }).catch(() => {});
    };

    sendHeartbeat();

    heartbeatRef.current = setInterval(sendHeartbeat, 30000);

    return () => clearInterval(heartbeatRef.current);
  }, [sessionId, resultData]);

  useEffect(() => {
    if (
      !activeUnitId ||
      !quizQuestions.length ||
      resultData ||
      !integrityMonitoringStarted
    ) return;

    const onVisibilityChange = async () => {
      if (document.visibilityState !== 'hidden') return;

      try {
        const result = await trackTabSwitch(activeUnitId, currentBlock, createIdempotencyKey('tab'), sourceNoteId, activityScope);

        setTabSwitchCount(result.tab_switches ?? tabSwitchCount + 1);
        setMaxTabSwitches(result.max_allowed ?? maxTabSwitches);

        if (result.auto_submitted) {
          setIntegrityOverlay(result.message || 'Quiz locked due to a tab-switch violation.');
        }
      } catch {
        addToast("We couldn't record that tab change. Please continue with the quiz.", 'error');
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [
    activeUnitId,
    currentBlock,
    quizQuestions.length,
    resultData,
    integrityMonitoringStarted,
    tabSwitchCount,
    maxTabSwitches
  ]);

  useEffect(() => {
    if (!integrityOverlay) return;

    const id = setTimeout(() => {
      setIntegrityOverlay(null);
      setIntegrityMonitoringStarted(false);
      setCurrentTopic('');
      setQuizQuestions([]);
      setResultData(null);
      setSessionId(null);
    }, 10000);

    return () => clearTimeout(id);
  }, [integrityOverlay]);


  useEffect(() => {
    const attemptId = resultData?.attempt_id;
    if (!resultData?.pending_review || !attemptId) return undefined;

    let cancelled = false;
    const refreshReviewedAttempt = async () => {
      try {
        const attempt = await getQuizAttempt(attemptId);
        if (cancelled || !attempt || attempt.status === 'pending_review') return;

        const answers = (attempt.answers || []).map((answer) => ({
          question: answer.question_text,
          question_type: answer.question_type,
          userAnswerText: answer.user_answer_text,
          correctAnswerText: answer.correct_answer_text,
          isCorrect: answer.correct,
          explanation: answer.explanation,
          review_status: answer.review_status,
          marks_awarded: answer.marks_awarded,
          max_marks: answer.max_marks,
          teacher_feedback: answer.teacher_feedback
        }));

        setResultData((current) => {
          if (!current || current.attempt_id !== attemptId) return current;
          return {
            ...current,
            pending_review: false,
            status: attempt.status,
            passed: Boolean(attempt.passed),
            percentage: Number(attempt.percentage) || 0,
            score: Number(attempt.marks_awarded_total ?? attempt.score) || 0,
            total: Number(attempt.total_questions) || answers.length,
            max_marks: Number(attempt.max_marks_total) || answers.reduce((sum, answer) => sum + (Number(answer.max_marks) || 0), 0),
            has_essays: answers.some((answer) => answer.question_type === 'essay'),
            answers
          };
        });
      } catch {
        // Keep the pending result visible and retry on the next polling interval.
      }
    };

    refreshReviewedAttempt();
    const interval = setInterval(refreshReviewedAttempt, 20000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [resultData?.attempt_id, resultData?.pending_review]);

  const getFirstUnansweredIndex = useCallback((answers) => {
    return answers.findIndex((answer) => answer === null);
  }, []);

  const canNavigateTo = useCallback((targetIndex, answers) => {
    if (answers[targetIndex] !== null) return true;

    return targetIndex === answers.findIndex((answer) => answer === null);
  }, []);

  const navigateTo = (index) => setCurrentIndex(index);

  const selectAnswer = async (selectedValue) => {
    if (locked || userAnswers[currentIndex] !== null || answerSubmitting) return;

    prepareQuizAnswerAudio();
    setAnswerFeedback(null);
    setAnswerSubmitting(true);

    const question = quizQuestions[currentIndex];

    try {
      const result = await checkQuizAnswer({
        unit_id: activeUnitId,
        block_number: currentBlock,
        question_id: question.id,
        selected_answer: selectedValue,
        ...(typeof selectedValue === 'string' && ['A', 'B', 'C', 'D'].includes(selectedValue) ? { selected_option: selectedValue } : {}),
        idempotency_key: createIdempotencyKey('answer'),
        note_id: sourceNoteId,
        activity_scope: activityScope
      });

      if (result.auto_submitted) {
        setIntegrityOverlay('Time limit exceeded. This block was auto-submitted.');
        return;
      }

      const newAnswers = [...userAnswers];

      newAnswers[currentIndex] = {
        selected: selectedValue,
        correct: result.correct,
        correct_option: result.correct_option,
        correct_answer_text: result.correct_answer_text,
        explanation: result.explanation || null,
        user_answer_text: result.user_answer_text || null,
        question_type: result.question_type || question.question_type || 'single_choice'
      };

      setUserAnswers(newAnswers);
      if (quizMode !== 'exam' && question.question_type !== 'essay') playQuizAnswerSound(Boolean(result.correct));
      // Keep the result visible briefly so the SVG can animate before auto-advance.
      if (quizMode !== 'exam' && question.question_type !== 'essay') {
        setAnswerFeedback(result.correct ? 'correct' : 'wrong');
        await new Promise((resolve) => setTimeout(resolve, 520));
      }

      // The server activates monitoring when this answer is persisted.
      // Start the client listener only after that successful response.
      setIntegrityMonitoringStarted(true);

      // Normal answer flow auto-advances; the temporary Next control
      // should only appear when the user explicitly taps Previous.
      setShowNextNavigation(false);

      const firstUnanswered = newAnswers.findIndex((answer) => answer === null);

      if (firstUnanswered !== -1 && firstUnanswered !== currentIndex) {
        navigateTo(firstUnanswered);
      }
      setAnswerFeedback(null);
    } catch (error) {
      addToast(error.message || "We couldn't verify your answer. Please try again.", 'error');
    } finally {
      setAnswerSubmitting(false);
    }
  };

  const submitBlock = async () => {
    if (locked || !quizQuestions.length) return;

    const answersPayload = quizQuestions.map((question, index) => ({
      id: question.id,
      selectedOption: userAnswers[index]?.selected || 'X'
    }));

    setBlockSubmitting(true);
    setLoading(true);

    try {
      const result = await submitQuizWithSession(
        activeUnitId,
        currentBlock,
        answersPayload,
        null,
        createIdempotencyKey('submit'),
        sourceNoteId,
        activityScope
      );

      setTimeLeft(null);
      setResultData(result);
      setSessionId(null);

      const topicsRes = curriculumUnitId
        ? await getQuizTopics(curriculumUnitId, sourceNoteId, activityScope)
        : await listQuizTopics(activeGroupId);

      setAllTopics(curriculumUnitId
        ? (topicsRes?.unit_id ? [{
            unit_id: topicsRes.unit_id,
            topic_name: topicsRes.unit_name,
            topic_image_url: topicsRes.topic_image_url,
            question_count: topicsRes.total_questions || 0,
            total_blocks: topicsRes.total_blocks || 0,
            completed_blocks: topicsRes.completed_blocks || [],
            failed_blocks: topicsRes.failed_blocks || [],
            pending_review_blocks: topicsRes.pending_review_blocks || [],
            locked_blocks: topicsRes.locked_blocks || [],
            retry_after: topicsRes.retry_after || {},
            all_done: topicsRes.all_done || false
          }] : [])
        : (Array.isArray(topicsRes?.topics) ? topicsRes.topics : []));
    } catch {
      addToast("Your answers couldn't be submitted. Please try again.", 'error');
    } finally {
      setLoading(false);
      setBlockSubmitting(false);
      setStartingBlock(false);
    }
  };

  const openTopicBlocks = (topic) => {
    navigate(`/quiz/blocks?unit_id=${encodeURIComponent(topic.unit_id)}`);
  };

  const startBlock = async (blockNum) => {
    if (locked || !user) {
      addToast(locked ? reason || 'This action is temporarily unavailable.' : 'Please sign in to start the quiz.', 'error');
      return;
    }

    if (!activeUnitId) {
      addToast('Choose a topic before starting the quiz.', 'error');
      return;
    }

    setPendingBlock(blockNum);
    setIntegrityMonitoringStarted(false);
    setShowRulesModal(true);
  };

  const confirmStartBlock = async () => {
    setShowRulesModal(false);
    setStartingBlock(true);

    const blockNum = pendingBlock;

    setCurrentBlock(blockNum);
    setLoading(true);

    try {
      const session = await startQuizSession(activeUnitId, blockNum, {
        mode: quizMode,
        idempotency_key: createIdempotencyKey('start'),
        note_id: sourceNoteId,
        activity_scope: activityScope
      });

      setSessionId(session.session_id || null);
      setIntegrityMonitoringStarted(false);
      setQuizMode(session.mode || 'study');
      setTabSwitchCount(session.tab_switches || 0);
      setMaxTabSwitches(session.max_allowed || 3);

      const data = await getQuizBlock(activeUnitId, blockNum, sourceNoteId, activityScope);

      if (!data?.questions?.length) {
        addToast('This question set is not ready yet. Try another set later.', 'error');
        return;
      }

      setQuizQuestions(data.questions);
      setMarkedQuestions([]);

      const priorAnswers = (data.prior_answers || []).map((answer) => (
        answer ? { ...answer, selected: answer.selected } : null
      ));

      const resumedWithAnswer = priorAnswers.some(Boolean);

      setUserAnswers(
        priorAnswers.length === data.questions.length
          ? priorAnswers
          : new Array(data.questions.length).fill(null)
      );

      setIntegrityMonitoringStarted(
        data.monitoring_started === true || resumedWithAnswer
      );

      setCurrentIndex(0);
      setResultData(null);
      setTimeLeft(data.time_left ?? 600);
    } catch (error) {
      if (isPremiumAccessError(error)) {
        redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' });
        return;
      }
      addToast(error?.message || "We couldn't load this question block. Please try again.", 'error');
    } finally {
      setLoading(false);
      setStartingBlock(false);
    }
  };

  if (!isReady || access.loading) {
    return <div className={`${UI.container} py-6`}><PageSkeleton variant="compact" /></div>;
  }

  if (access.isPending) return <PendingApprovalScreen />;
  if (!access.canAccess) return <AccessDenied />;

  if (loading && !quizQuestions.length && !resultData && !currentTopic) {
    return <div className={`${UI.container} py-6`}><PageSkeleton variant="compact" /></div>;
  }

  if (isQuizCardsPage && curriculumUnitId && currentTopic && !quizQuestions.length && !resultData) {
    const topicData = allTopics.find((topic) => String(topic.unit_id) === String(curriculumUnitId)) || allTopics[0];
    const blockCount = Number(topicData?.total_blocks) || Math.ceil((Number(topicData?.question_count) || 0) / 10);

    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className={`${UI.container} py-8 lg:px-8`}>
          <button type="button" className={`${UI.secondaryButton} mb-6`} onClick={() => navigate('/quiz/blocks')} aria-label="Back to quiz cards">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <PageHeader title={currentTopic} className="max-w-4xl border-b border-border pb-6" />
          <div className={UI.quizTopicGrid}>
            {Array.from({ length: blockCount }).map((_, index) => {
              const failed = topicData?.failed_blocks?.includes(index);
              const pendingReview = topicData?.pending_review_blocks?.includes(index);
              const passed = topicData?.completed_blocks?.includes(index);
              const retryLocked = topicData?.locked_blocks?.includes(index);
              const retryLabel = formatQuizRetryTime(topicData?.retry_after?.[index]);
              return (
                <button
                  key={index}
                  className={`${UI.quizBlockButton} ${passed ? UI.quizBlockButtonPassed : pendingReview ? UI.quizBlockButtonPending : failed ? UI.quizBlockButtonFailed : UI.quizBlockButtonDefault}`}
                  disabled={passed || retryLocked || locked}
                  onClick={() => startBlock(index)}
                  title={retryLocked ? retryLabel : undefined}
                >
                  <span>Question set {index + 1}</span>
                  {passed && <span className={UI.quizBlockStatusLabel}>Passed</span>}
                  {pendingReview && <span className={UI.quizBlockStatusLabel}>Awaiting marking</span>}
                  {failed && (
                    <span className={UI.quizBlockStatusLabel}>
                      {retryLocked ? retryLabel : 'Try again'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Modal open={showRulesModal} onClose={() => setShowRulesModal(false)} title={t('common.quizRules')}>
            <div className={UI.quizModePicker} role="group" aria-label="Choose assessment mode">
            <button type="button" className={`${UI.quizModeOption} ${quizMode === 'study' ? UI.quizModeOptionActive : UI.quizModeOptionInactive}`} onClick={() => setQuizMode('study')}>
              <Icon name="lightbulb" />
              <span><strong>Study mode</strong><small>Get feedback and explanations as you practise.</small></span>
              {quizMode === 'study' && <Icon name="circle-check" />}
            </button>
            <button type="button" className={`${UI.quizModeOption} ${quizMode === 'exam' ? UI.quizModeOptionActive : UI.quizModeOptionInactive}`} onClick={() => setQuizMode('exam')}>
              <Icon name="graduation-cap" />
              <span><strong>Exam mode</strong><small>Complete the assessment before seeing feedback.</small></span>
              {quizMode === 'exam' && <Icon name="circle-check" />}
            </button>
          </div>
          <div className={UI.quizAssessmentFacts}>
            <span><Icon name="list-check" /> 10 questions</span>
            <span><Icon name="clock" /> 10 minutes</span>
            <span><Icon name="flag" /> {t('common.passMark')}</span>
          </div>
          <ul className={UI.quizRulesList}>
              <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.questionsPerBlock')}</span></li>
              <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.passMark')}</span></li>
              <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.immediateFeedback')}</span></li>
              <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.fullExplanations')}</span></li>
              <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.timeLimit')}</span></li>
              <li><Icon name="exclamation-triangle" className="text-amber-700" /> <span>{t('common.tabRecorded')}</span></li>
              <li><Icon name="exclamation-triangle" className="text-red-700" /> <span>{t('common.tabAutoSubmit')}</span></li>
            </ul>
            <div className="mt-6 flex justify-end">
              <Button variant="3d" onClick={confirmStartBlock} loading={startingBlock} loadingContext="brand" loadingLabel={t('common.start')} className="min-w-32">{t('common.start')}</Button>
            </div>
          </Modal>
        </div>
      </main>
    );
  }

  if (isQuizCardsPage && !currentTopic && !quizQuestions.length && !resultData) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <section className="w-full bg-primary-50 py-8 sm:py-10">
          <div className={UI.container}>
          <button
            type="button"
            className={`${UI.secondaryButton} mb-6`}
            onClick={() => navigate('/quiz')}
            aria-label="Back to the quiz overview"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="mb-8 border-b border-border pb-6">
            <h1 className={UI.pageTitleHeading}>{isPharmacy ? 'Course Units' : 'Quiz Topics'}</h1>
          </div>
          <div className={UI.quizTopicGrid}>
            {topicsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} variant="round" loading={true} loadingLines={2} />
              ))
            ) : allTopics.length > 0 ? (
              allTopics.map((topic) => {
                const questionCount = Number(topic.question_count) || 0;
                const blockCount = Number(topic.total_blocks) || Math.ceil(questionCount / 10);
                const allDone = topic.all_done ?? (blockCount > 0 && topic.completed_blocks?.length === blockCount);

                return (
                  <div key={topic.unit_id} className="relative min-w-0">
                    {allDone && (
                      <span className={UI.quizTopicStatusRibbon} aria-label="Completed">
                        Completed
                      </span>
                    )}
                    <Card
                      image={topic.topic_image_url || 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                      title={topic.topic_name}
                      description={questionCount > 0 ? questionCount + ' questions · ' + blockCount + ' blocks' : 'Questions are being prepared for this learning area.'}
                      footer={
                        questionCount > 0 && blockCount > 0 && !allDone ? (
                          <Button variant="primary" size="sm" onClick={() => openTopicBlocks({ ...topic, total_blocks: blockCount })} disabled={locked}>
                            Start
                          </Button>
                        ) : null
                      }
                      className="p-4 sm:p-5"
                    />
                  </div>
                );
              })
            ) : null}
          </div>
          </div>
        </section>
      </main>
    );
  }

  const quizBreadcrumb = isQuizCardsPage
    ? (curriculumUnitId
      ? { label: currentTopic || (isPharmacy ? 'Course Unit' : 'Topic'), parentLabel: isPharmacy ? 'Course Units' : 'Topics' }
      : { label: isPharmacy ? 'Course Units' : 'Topics' })
    : null;

  const firstUnanswered = getFirstUnansweredIndex(userAnswers);
  const allAnswered = userAnswers.length > 0 && userAnswers.every((answer) => answer !== null);
  const timerPercent = timeLeft !== null ? (timeLeft / 600) * 100 : 100;
  const timerClass = timerPercent > 50 ? 'is-good' : timerPercent > 20 ? 'is-warn' : 'is-danger';

  return (
    <main className="min-h-screen w-full bg-background">
      <div className="w-full">
        <Breadcrumb className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8" items={[
          { label: 'Home', href: '/' },
          { label: 'Quiz', href: '/quiz' },
          ...(quizBreadcrumb
            ? [
                ...(quizBreadcrumb.parentLabel
                  ? [{ label: quizBreadcrumb.parentLabel, href: '/quiz/blocks' }]
                  : []),
                { label: quizBreadcrumb.label },
              ]
            : []),
        ]} />

        {!isQuizCardsPage && !currentTopic && !resultData && !quizQuestions.length && !sessionId && (
          <>
            <QuizHero
              level={level}
              class_name={class_name}
              groupId={activeGroupId}
              isPharmacy={isPharmacy}
              onBack={() => navigate('/resources')}
              onNext={() => navigate('/quiz/blocks')}
            />
            <div className={UI.container}>
              <AdSlot placement="quiz" pageContext="quiz" />
            </div>
          </>
        )}

        {isQuizCardsPage && !currentTopic && (
          <div className={`${UI.container} ${UI.quizTopicGrid} py-8`}>
            {topicsLoading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={index} variant="round" loading={true} loadingLines={2} />
              ))
            ) : allTopics.length > 0 ? (
              allTopics.map((topic) => {
                const questionCount = Number(topic.question_count) || 0;
                const blockCount = Number(topic.total_blocks) || Math.ceil(questionCount / 10);
                const allDone = topic.all_done ?? (blockCount > 0 && topic.completed_blocks?.length === blockCount);

                return (
                  <Card
                    key={topic.unit_id}
                    image={topic.topic_image_url || 'https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                    title={topic.topic_name}
                    description={questionCount > 0 ? questionCount + ' questions · ' + blockCount + ' blocks' : 'Questions are being prepared for this learning area.'}
                    footer={
                      questionCount > 0 && blockCount > 0 && !allDone ? (
                        <Button variant="primary" size="sm" onClick={() => openTopicBlocks({ ...topic, total_blocks: blockCount })} disabled={locked}>
                          Start
                        </Button>
                      ) : null
                    }
                    className="p-4 sm:p-5"
                  />
                );
              })
            ) : null}
          </div>
        )}
        {resultData ? (
          <div className={`${UI.container} grid gap-8 py-8`}>
            <section className={`${UI.card} grid gap-5 border-primary-100 bg-white p-6 sm:p-8`} aria-live="polite">
              {resultData.passed && !resultData.pending_review && <StorysetIllustration name="achievement" alt="Achievement for completing the assessment" className="mx-auto mb-4 w-full max-w-[220px] object-contain" />}
              <h2 className={UI.pageTitleHeading}>{resultData.pending_review ? 'Your assessment has been submitted' : resultData.passed ? `${t('common.congratulations')}, ${user?.full_name || 'Learner'}!` : t('common.blockComplete')}</h2>
              {resultData.pending_review ? (
                <div className={UI.quizPendingNotice} role="status">
                  <Icon name="clock" />
                  <div>
                    <strong>Awaiting teacher marking</strong>
                    <p>Your written response has been received. Your final score and pass status will appear after all essay questions are marked.</p>
                    {resultData.attempt_id && <Link className={UI.secondaryButton} to={`/quiz/attempt/${resultData.attempt_id}`}>View submission status</Link>}
                  </div>
                </div>
              ) : (
                <>
                  <div className={`inline-flex w-fit rounded-2xl px-6 py-4 text-4xl font-extrabold tracking-tight ${resultData.passed ? 'bg-emerald-50 text-emerald-900' : 'bg-red-50 text-red-900'}`}>
                    {resultData.percentage}%
                  </div>
                  <p>{resultData.has_essays ? `${resultData.score}/${resultData.max_marks || resultData.total} marks awarded` : `${resultData.score}/${resultData.total} correct`}</p>
                </>
              )}
              {resultData.recommendation && (
                <div className={UI.quizResultRecommendation} aria-live="polite">
                  <h3>{resultData.recommendation.title || 'Recommended next step'}</h3>
                  <p>{resultData.recommendation.message}</p>
                  <Link className={UI.primaryButton} to={resultData.recommendation.route || '/resources'}>
                    {resultData.recommendation.label || 'Continue learning'}
                  </Link>
                </div>
              )}
            </section>

            <section className={UI.quizReviewSection}>
              <h3 className={UI.sectionHeadingTitle}>Review question set {currentBlock + 1} · {currentTopic}</h3>

              {(resultData.answers || []).map((answer, idx) => (
                <article key={idx} className={UI.card}>
                  <div className={UI.quizReviewHeader}>
                    <span className={`${UI.quizReviewStatus} ${answer.review_status === 'pending_review' ? 'bg-amber-100 text-amber-900' : answer.question_type === 'essay' ? 'bg-emerald-100 text-emerald-900' : answer.isCorrect ? 'bg-emerald-100 text-emerald-900' : 'bg-red-100 text-red-900'}`}>
                      {answer.review_status === 'pending_review' ? 'Awaiting review' : answer.question_type === 'essay' ? 'Marked' : answer.isCorrect ? 'Passed' : 'Failed'}
                    </span>
                    <span className="text-xs font-bold text-muted">Q{idx + 1}</span>
                  </div>
                  <p className="text-base font-semibold leading-7 text-primary-950">{answer.question}</p>
                  <p className={`${UI.quizReviewAnswer} ${answer.review_status === 'pending_review' ? '' : answer.isCorrect ? 'border border-emerald-200 bg-emerald-50 text-emerald-900' : 'border border-red-200 bg-red-50 text-red-900'}`}>
                    Your answer: {answer.userAnswerText}
                  </p>
                  {answer.review_status === 'pending_review' && <p className={UI.quizReviewExplanation}>This written response will be marked by an approved reviewer.</p>}
                  {answer.question_type === 'essay' && answer.max_marks && <p className={UI.quizReviewExplanation}>Marks: {answer.marks_awarded ?? 0}/{answer.max_marks}</p>}
                  {answer.question_type === 'essay' && answer.teacher_feedback && <p className={UI.quizReviewExplanation}><strong>Teacher feedback:</strong> {answer.teacher_feedback}</p>}
                  {answer.question_type !== 'essay' && !answer.isCorrect && <p className={UI.quizReviewCorrectAnswer}>Correct: {answer.correctAnswerText}</p>}
                  {answer.explanation && <p className={UI.quizReviewExplanation}>{answer.explanation}</p>}
                </article>
              ))}
            </section>

            <div className="relative flex flex-wrap items-center gap-3 border-t border-border pt-6">
              <div className="relative">
                <Button
                  variant="secondary"
                  type="button"
                  aria-expanded={showResultNavigationMenu}
                  aria-haspopup="menu"
                  onClick={() => setShowResultNavigationMenu((open) => !open)}
                >
                  {isPharmacy ? 'Back to Course Units' : 'Back to Topics'}
                </Button>
                {showResultNavigationMenu && (
                  <div className={UI.quizReturnOptions} role="menu">
                    <button
                      type="button"
                      role="menuitem"
                      className={UI.quizReturnOption}
                      onClick={() => {
                        setShowResultNavigationMenu(false);
                        setCurrentTopic('');
                        setResultData(null);
                        navigate(activeUnitId
                          ? `/quiz/blocks?unit_id=${encodeURIComponent(activeUnitId)}`
                          : '/quiz/blocks');
                      }}
                    >
                      {isPharmacy ? 'Continue with this course unit' : 'Continue with this topic'}
                      <span className="text-xs font-normal text-muted">Choose another block here</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className={UI.quizReturnOption}
                      onClick={() => {
                        setShowResultNavigationMenu(false);
                        setCurrentTopic('');
                        setResultData(null);
                        navigate('/quiz/blocks');
                      }}
                    >
                      {isPharmacy ? 'Choose another course unit' : 'Choose another topic'}
                      <span className="text-xs font-normal text-muted">Return to all question sets</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : quizQuestions.length > 0 ? (
          <div>
            {integrityOverlay && (
              <div className={UI.quizIntegrityOverlay}>
                <Icon name="exclamation-triangle" />
                <p>{integrityOverlay}</p>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-white p-4 sm:p-5">
              <div>
                <h3 className="text-lg font-bold text-primary-950">Question navigator</h3>
                <p className="mt-1 text-sm text-muted">{userAnswers.filter(Boolean).length} of {quizQuestions.length} answered</p>
              </div>
              <div className="flex flex-wrap gap-3 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Answered</span>
                <span className="inline-flex items-center gap-2"><i className="h-2.5 w-2.5 rounded-full bg-secondary-500" /> Review</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {quizQuestions.map((question, idx) => {
                const answered = Boolean(userAnswers[idx]);
                const tone = idx === currentIndex ? UI.quizNavPillCurrent : markedQuestions.includes(quizQuestions[idx].id) ? UI.quizNavPillWrong : answered ? UI.quizNavPillAnswered : UI.quizNavPillDefault;

                return (
                  <button
                    key={idx}
                    className={`${UI.quizNavPill} ${tone}`}
                    onClick={() => {
                      if (!canNavigateTo(idx, userAnswers)) {
                        addToast('Answer the earlier questions before moving ahead.', 'warning');
                      } else {
                        navigateTo(idx);
                      }
                    }}
                    disabled={!canNavigateTo(idx, userAnswers)}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {timeLeft !== null && (
              <div className={UI.quizTimerPanel}>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted"><Icon name="clock" /> {t('common.timeRemaining')}</span>
                  <span className={`text-lg font-extrabold tabular-nums ${timerClass === 'is-good' ? 'text-emerald-700' : timerClass === 'is-warn' ? 'text-secondary-700' : 'text-red-700'}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                <ProgressBar value={timeLeft} max={600} variant="primary" />
              </div>
            )}

            <ProgressBar value={currentIndex + 1} max={quizQuestions.length} variant="primary" />
            <p className="text-sm font-semibold text-muted">
              Block {currentBlock + 1} • Q {currentIndex + 1}/{quizQuestions.length} • {currentTopic}
            </p>

            {(answerSubmitting || answerFeedback) && (
              <div className={UI.quizAnsweringIndicator} role="status" aria-live="polite">
                <div className="shrink-0" aria-hidden="true">
                  <QuizAnswerLoader status={answerFeedback || 'checking'} size={72} />
                </div>
                <span>
                  {answerFeedback === 'correct'
                    ? 'Correct answer'
                    : answerFeedback === 'wrong'
                      ? 'Review this answer'
                      : checkingMessage}
                </span>
              </div>
            )}

            <Card
              image={quizQuestions[currentIndex].image_url}
              className="border-0 bg-transparent p-0 shadow-none"
            >
              <QuizQuestionRenderer
                key={quizQuestions[currentIndex].id}
                question={quizQuestions[currentIndex]}
                answer={userAnswers[currentIndex]}
                disabled={answerSubmitting || locked}
                marked={markedQuestions.includes(quizQuestions[currentIndex].id)}
                onToggleMark={() => setMarkedQuestions((current) => current.includes(quizQuestions[currentIndex].id)
                  ? current.filter((id) => id !== quizQuestions[currentIndex].id)
                  : [...current, quizQuestions[currentIndex].id])}
                onSubmit={selectAnswer}
              />

              {quizMode === 'study' && userAnswers[currentIndex]?.explanation && (
                <div className="mt-4 rounded-xl border border-primary-100 bg-primary-50 p-4 text-sm leading-6 text-primary-950">
                  {userAnswers[currentIndex].explanation}
                </div>
              )}
            </Card>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button
                variant="secondary"
                className="min-w-28"
                onClick={() => {
                  if (currentIndex > 0) {
                    navigateTo(currentIndex - 1);
                    setShowNextNavigation(true);
                  }
                }}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>

              {showNextNavigation && currentIndex < quizQuestions.length - 1 && (
                <Button
                  variant="primary"
                  className="min-w-28"
                  onClick={() => {
                    navigateTo(currentIndex + 1);
                    setShowNextNavigation(false);
                  }}
                  disabled={locked || answerSubmitting}
                >
                  Next
                </Button>
              )}

              {markedQuestions.length > 0 && (
                <Button variant="secondary" onClick={() => {
                  const flaggedIndex = quizQuestions.findIndex((question) => markedQuestions.includes(question.id));
                  if (flaggedIndex >= 0) navigateTo(flaggedIndex);
                }}>
                  <Icon name="flag" /> Review flagged ({markedQuestions.length})
                </Button>
              )}
              {allAnswered && (
                <Button
                  variant="primary"
                  onClick={submitBlock}
                  disabled={locked || loading || blockSubmitting}
                  className={blockSubmitting ? 'min-w-32 opacity-80' : 'min-w-32'}
                >
                  {blockSubmitting ? (
                    <span>Submitting…</span>
                  ) : (
                    <>
                      <Icon name="clipboard-check" /> {t('common.submitBlock')}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        ) : (
          <section className="w-full bg-primary-50 py-8">
            <div className={`${UI.container} ${UI.quizTopicGrid}`}>
              {Array.from({ length: totalBlocks }).map((_, index) => {
                const topicData = allTopics.find((topic) => topic.topic_name === currentTopic);
                const failed = topicData?.failed_blocks?.includes(index);
                const pendingReview = topicData?.pending_review_blocks?.includes(index);
                const passed = topicData?.completed_blocks?.includes(index);
                const retryLocked = topicData?.locked_blocks?.includes(index);
                const retryLabel = formatQuizRetryTime(topicData?.retry_after?.[index]);

                const blockTone = passed ? UI.quizBlockButtonPassed : pendingReview ? UI.quizBlockButtonPending : failed ? UI.quizBlockButtonFailed : UI.quizBlockButtonDefault;
                return (
                  <button
                    key={index}
                    className={`${UI.quizBlockButton} ${blockTone}`}
                    disabled={passed || retryLocked || locked}
                    onClick={() => startBlock(index)}
                    title={retryLocked ? retryLabel : undefined}
                  >
                    <span>Question set {index + 1}</span>
                    {passed && <span className={UI.quizBlockStatusLabel}>Passed</span>}
                    {pendingReview && <span className={UI.quizBlockStatusLabel}>Awaiting marking</span>}
                    {failed && (
                      <span className={UI.quizBlockStatusLabel}>
                        {retryLocked ? retryLabel : 'Try again'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {resultData && curriculumUnitId && (
          <LearningJourney
            unitId={curriculumUnitId}
            nodeName={currentTopic}
            excludeStages={['quiz']}
            returnTo={'/quiz/blocks?unit_id=' + encodeURIComponent(curriculumUnitId)}
          />
        )}

        {!isQuizCardsPage && !currentTopic && !curriculumUnitId && <QuizLearningPath level={level} class_name={class_name} groupId={activeGroupId} />}
        {!isQuizCardsPage && !currentTopic && !curriculumUnitId && <QuizWeakAreas user={user} level={level} class_name={class_name} groupId={activeGroupId} />}

        <Modal open={showRulesModal} onClose={() => setShowRulesModal(false)} title={t('common.quizRules')}>
          <div className={UI.quizModePicker} role="group" aria-label="Choose assessment mode">
            <button type="button" className={`${UI.quizModeOption} ${quizMode === 'study' ? UI.quizModeOptionActive : UI.quizModeOptionInactive}`} onClick={() => setQuizMode('study')}>
              <Icon name="lightbulb" />
              <span><strong>Study mode</strong><small>Get feedback and explanations as you practise.</small></span>
              {quizMode === 'study' && <Icon name="circle-check" />}
            </button>
            <button type="button" className={`${UI.quizModeOption} ${quizMode === 'exam' ? UI.quizModeOptionActive : UI.quizModeOptionInactive}`} onClick={() => setQuizMode('exam')}>
              <Icon name="graduation-cap" />
              <span><strong>Exam mode</strong><small>Complete the assessment before seeing feedback.</small></span>
              {quizMode === 'exam' && <Icon name="circle-check" />}
            </button>
          </div>
          <div className={UI.quizAssessmentFacts}>
            <span><Icon name="list-check" /> 10 questions</span>
            <span><Icon name="clock" /> 10 minutes</span>
            <span><Icon name="flag" /> {t('common.passMark')}</span>
          </div>
          <ul className={UI.quizRulesList}>
            <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.questionsPerBlock')}</span></li>
            <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.passMark')}</span></li>
            <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.immediateFeedback')}</span></li>
            <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.fullExplanations')}</span></li>
            <li><span className={UI.quizRulesBullet} aria-hidden="true" /> <span>{t('common.timeLimit')}</span></li>
            <li><Icon name="exclamation-triangle" className="text-amber-700" /> <span>{t('common.tabRecorded')}</span></li>
            <li><Icon name="exclamation-triangle" className="text-red-700" /> <span>{t('common.tabAutoSubmit')}</span></li>
          </ul>
          <div className="mt-6 flex justify-end">
            <Button variant="3d" onClick={confirmStartBlock} loading={startingBlock} loadingContext="brand" loadingLabel={t('common.start')} className="min-w-32">{t('common.start')}</Button>
          </div>
        </Modal>
      </div>
    </main>
  );
}
