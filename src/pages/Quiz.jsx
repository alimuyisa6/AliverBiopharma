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
import PageSkeleton from '../components/Loading/PageSkeleton';
import { getCachedStale, setCache } from '../utils/cache';
import QuizAnswerLoader from '../components/quiz/QuizAnswerLoader';
import QuizQuestionRenderer from '../components/quiz/QuizQuestionRenderer';

// Browser-native answer sounds. Prepare audio on the learner's tap for mobile autoplay rules.
let quizAudioContext = null;

function prepareQuizAnswerAudio() {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    if (!quizAudioContext || quizAudioContext.state === 'closed') {
      quizAudioContext = new AudioContextClass();
    }
    if (quizAudioContext.state === 'suspended') {
      quizAudioContext.resume().catch(() => {});
    }
  } catch {
    // Audio is optional and must never interrupt quiz progress.
  }
}

function playQuizAnswerSound(isCorrect) {
  try {
    const audio = quizAudioContext;
    if (!audio || audio.state === 'closed') return;

    const play = () => {
      const now = audio.currentTime;
      const gain = audio.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.connect(audio.destination);

      const notes = isCorrect
        ? [{ frequency: 660, start: 0, duration: 0.12 }, { frequency: 880, start: 0.11, duration: 0.17 }]
        : [{ frequency: 300, start: 0, duration: 0.15 }, { frequency: 220, start: 0.13, duration: 0.18 }];

      notes.forEach(({ frequency, start, duration }) => {
        const oscillator = audio.createOscillator();
        const noteStart = now + start;
        oscillator.type = isCorrect ? 'sine' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, noteStart);
        oscillator.connect(gain);
        gain.gain.setValueAtTime(0.0001, noteStart);
        gain.gain.exponentialRampToValueAtTime(isCorrect ? 0.12 : 0.09, noteStart + 0.018);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + duration);
        oscillator.start(noteStart);
        oscillator.stop(noteStart + duration + 0.02);
      });
    };

    if (audio.state === 'suspended') {
      audio.resume().then(play).catch(() => {});
    } else {
      play();
    }
  } catch {
    // Audio must never interrupt answer verification or quiz progression.
  }
}


import ProgressBar from '../components/ProgressBar/ProgressBar';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import Modal from '../components/Modal/Modal';
import { useI18n } from '../contexts/I18nContext';

function formatQuizRetryTime(retryAt) {
  if (!retryAt) return 'Retry later';
  const remaining = new Date(retryAt).getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return 'Retry';
  const totalMinutes = Math.ceil(remaining / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? 'Retry in ' + hours + 'h ' + minutes + 'm' : 'Retry in ' + minutes + 'm';
}

function createIdempotencyKey(prefix = 'quiz') {
  try {
    return `${prefix}_${crypto.randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }
}

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
    return <div className="section"><PageSkeleton variant="compact" /></div>;
  }

  if (access.isPending) return <PendingApprovalScreen />;
  if (!access.canAccess) return <AccessDenied />;

  if (loading && !quizQuestions.length && !resultData && !currentTopic) {
    return <div className="section"><PageSkeleton variant="compact" /></div>;
  }

  if (isQuizCardsPage && curriculumUnitId && currentTopic && !quizQuestions.length && !resultData) {
    const topicData = allTopics.find((topic) => String(topic.unit_id) === String(curriculumUnitId)) || allTopics[0];
    const blockCount = Number(topicData?.total_blocks) || Math.ceil((Number(topicData?.question_count) || 0) / 10);

    return (
      <div className="quiz-page quiz-blocks-route-page">
        <div className="section quiz-page-section">
          <button type="button" className="quiz-cards-route-back" onClick={() => navigate('/quiz/blocks')} aria-label="Back to quiz cards">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="quiz-cards-route-header">
            <span className="eyebrow">{isPharmacy ? 'Course Unit' : 'Topic'}</span>
            <h1 className="section-title quiz-page-title">{currentTopic}</h1>
          </div>
          <div className="quiz-blocks-grid">
            {Array.from({ length: blockCount }).map((_, index) => {
              const failed = topicData?.failed_blocks?.includes(index);
              const pendingReview = topicData?.pending_review_blocks?.includes(index);
              const passed = topicData?.completed_blocks?.includes(index);
              const retryLocked = topicData?.locked_blocks?.includes(index);
              const retryLabel = formatQuizRetryTime(topicData?.retry_after?.[index]);
              return (
                <button
                  key={index}
                  className={`btn ${passed ? 'btn-success' : pendingReview ? 'btn-primary' : failed ? 'btn-danger' : 'btn-secondary'} quiz-block-status-button`}
                  disabled={passed || retryLocked || locked}
                  onClick={() => startBlock(index)}
                  title={retryLocked ? retryLabel : undefined}
                >
                  <span>Question set {index + 1}</span>
                  {passed && <span className="quiz-block-status-label">Passed</span>}
                  {pendingReview && <span className="quiz-block-status-label">Awaiting marking</span>}
                  {failed && (
                    <span className="quiz-block-status-label">
                      {retryLocked ? retryLabel : 'Try again'}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <Modal open={showRulesModal} onClose={() => setShowRulesModal(false)} title={t('common.quizRules')}>
            <div className="quiz-mode-picker" role="group" aria-label="Choose assessment mode">
            <button type="button" className={`quiz-mode-option ${quizMode === 'study' ? 'is-active' : ''}`} onClick={() => setQuizMode('study')}>
              <Icon name="lightbulb" />
              <span><strong>Study mode</strong><small>Get feedback and explanations as you practise.</small></span>
              {quizMode === 'study' && <Icon name="circle-check" />}
            </button>
            <button type="button" className={`quiz-mode-option ${quizMode === 'exam' ? 'is-active' : ''}`} onClick={() => setQuizMode('exam')}>
              <Icon name="graduation-cap" />
              <span><strong>Exam mode</strong><small>Complete the assessment before seeing feedback.</small></span>
              {quizMode === 'exam' && <Icon name="circle-check" />}
            </button>
          </div>
          <div className="quiz-assessment-facts">
            <span><Icon name="list-check" /> 10 questions</span>
            <span><Icon name="clock" /> 10 minutes</span>
            <span><Icon name="flag" /> {t('common.passMark')}</span>
          </div>
          <ul className="quiz-rules-list">
              <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.questionsPerBlock')}</span></li>
              <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.passMark')}</span></li>
              <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.immediateFeedback')}</span></li>
              <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.fullExplanations')}</span></li>
              <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.timeLimit')}</span></li>
              <li><Icon name="exclamation-triangle" className="quiz-rules-icon is-warning" /> <span>{t('common.tabRecorded')}</span></li>
              <li><Icon name="exclamation-triangle" className="quiz-rules-icon is-error" /> <span>{t('common.tabAutoSubmit')}</span></li>
            </ul>
            <div className="quiz-rules-submit">
              <Button variant="3d" onClick={confirmStartBlock} loading={startingBlock} loadingContext="brand" loadingLabel={t('common.start')} className="quiz-rules-submit-btn">{t('common.start')}</Button>
            </div>
          </Modal>
        </div>
      </div>
    );
  }

  if (isQuizCardsPage && !currentTopic && !quizQuestions.length && !resultData) {
    return (
      <div className="quiz-page quiz-cards-route-page">
        <div className="section quiz-page-section">
          <button
            type="button"
            className="quiz-cards-route-back"
            onClick={() => navigate('/quiz')}
            aria-label="Back to the quiz overview"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <path d="M14.5 5.5 8 12l6.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="quiz-cards-route-header">
            <span className="eyebrow">{isPharmacy ? 'Course Units' : 'Topics'}</span>
            <h1 className="section-title quiz-page-title">{isPharmacy ? 'Course Units' : 'Quiz Topics'}</h1>
          </div>
          <div className="grid grid-cols-3 quiz-topic-cards">
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
                  <div key={topic.unit_id} className={`quiz-topic-ribbon-card${allDone ? ' is-completed' : ''}`}>
                    {allDone && (
                      <span className="quiz-topic-status-ribbon" aria-label="Completed">
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
                      className={allDone ? 'card-compact' : undefined}
                    />
                  </div>
                );
              })
            ) : null}
          </div>
        </div>
      </div>
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
    <div className={`quiz-page${!isQuizCardsPage && !currentTopic && !resultData && !quizQuestions.length && !sessionId ? ' quiz-landing-page' : ''}`}>
      <div className={`section quiz-page-section${!isQuizCardsPage && !currentTopic && !resultData && !quizQuestions.length && !sessionId ? ' quiz-landing-section' : ''}`}>
        <Breadcrumb items={[
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
            <AdSlot placement="quiz" pageContext="quiz" />
          </>
        )}

        {isQuizCardsPage && !currentTopic && (
          <div className="grid grid-cols-3 quiz-topic-cards">
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
                    className={allDone ? 'card-compact' : undefined}
                  />
                );
              })
            ) : null}
          </div>
        )}
        {resultData ? (
          <div className="quiz-result-container">
            <Card variant="flat" className="quiz-result-card card-surface-solid card-elevation-soft">
              <h2>{resultData.pending_review ? 'Your assessment has been submitted' : resultData.passed ? `${t('common.congratulations')}, ${user?.full_name || 'Learner'}!` : t('common.blockComplete')}</h2>
              {resultData.pending_review ? (
                <div className="quiz-pending-review-notice" role="status">
                  <Icon name="clock" />
                  <div>
                    <strong>Awaiting teacher marking</strong>
                    <p>Your written response has been received. Your final score and pass status will appear after all essay questions are marked.</p>
                    {resultData.attempt_id && <Link className="btn btn-secondary" to={`/quiz/attempt/${resultData.attempt_id}`}>View submission status</Link>}
                  </div>
                </div>
              ) : (
                <>
                  <div className={`quiz-result-score ${resultData.passed ? 'is-pass' : 'is-fail'}`}>
                    {resultData.percentage}%
                  </div>
                  <p>{resultData.has_essays ? `${resultData.score}/${resultData.max_marks || resultData.total} marks awarded` : `${resultData.score}/${resultData.total} correct`}</p>
                </>
              )}
              {resultData.recommendation && (
                <div className="quiz-result-recommendation" aria-live="polite">
                  <h3>{resultData.recommendation.title || 'Recommended next step'}</h3>
                  <p>{resultData.recommendation.message}</p>
                  <Link className="btn btn-primary" to={resultData.recommendation.route || '/resources'}>
                    {resultData.recommendation.label || 'Continue learning'}
                  </Link>
                </div>
              )}
            </Card>

            <div className="quiz-review-section">
              <h3 className="quiz-review-heading">Review question set {currentBlock + 1} · {currentTopic}</h3>

              {(resultData.answers || []).map((answer, idx) => (
                <Card key={idx} variant="flat" className="quiz-review-card card-surface-subtle card-elevation-none">
                  <div className="quiz-review-header">
                    <span className={`quiz-review-status ${answer.review_status === 'pending_review' ? 'is-pending' : answer.question_type === 'essay' ? 'is-passed' : answer.isCorrect ? 'is-passed' : 'is-failed'}`}>
                      {answer.review_status === 'pending_review' ? 'Awaiting review' : answer.question_type === 'essay' ? 'Marked' : answer.isCorrect ? 'Passed' : 'Failed'}
                    </span>
                    <span className="quiz-review-qnum">Q{idx + 1}</span>
                  </div>
                  <p>{answer.question}</p>
                  <p className={`quiz-review-answer ${answer.review_status === 'pending_review' ? '' : answer.isCorrect ? 'is-correct' : 'is-incorrect'}`}>
                    Your answer: {answer.userAnswerText}
                  </p>
                  {answer.review_status === 'pending_review' && <p className="quiz-review-explanation">This written response will be marked by an approved reviewer.</p>}
                  {answer.question_type === 'essay' && answer.max_marks && <p className="quiz-review-explanation">Marks: {answer.marks_awarded ?? 0}/{answer.max_marks}</p>}
                  {answer.question_type === 'essay' && answer.teacher_feedback && <p className="quiz-review-explanation"><strong>Teacher feedback:</strong> {answer.teacher_feedback}</p>}
                  {answer.question_type !== 'essay' && !answer.isCorrect && <p className="quiz-review-correct-answer">Correct: {answer.correctAnswerText}</p>}
                  {answer.explanation && <p className="quiz-review-explanation">{answer.explanation}</p>}
                </Card>
              ))}
            </div>

            <div className="quiz-result-actions">
              <div className="quiz-result-return-menu">
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
                  <div className="quiz-result-return-options" role="menu">
                    <button
                      type="button"
                      role="menuitem"
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
                      <span>Choose another block here</span>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setShowResultNavigationMenu(false);
                        setCurrentTopic('');
                        setResultData(null);
                        navigate('/quiz/blocks');
                      }}
                    >
                      {isPharmacy ? 'Choose another course unit' : 'Choose another topic'}
                      <span>Return to all question sets</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : quizQuestions.length > 0 ? (
          <div>
            {integrityOverlay && (
              <div className="quiz-integrity-overlay">
                <Icon name="exclamation-triangle" />
                <p>{integrityOverlay}</p>
              </div>
            )}

            <div className="quiz-question-navigation-header">
              <div>
                <h3>Question navigator</h3>
                <p>{userAnswers.filter(Boolean).length} of {quizQuestions.length} answered</p>
              </div>
              <div className="quiz-question-legend">
                <span><i className="is-answered" /> Answered</span>
                <span><i className="is-flagged" /> Review</span>
              </div>
            </div>
            <div className="quiz-nav-pills">
              {quizQuestions.map((question, idx) => {
                let cls = 'btn btn-sm btn-ghost';

                if (userAnswers[idx]) {
                  cls = quizModeIsExam || question.question_type === 'essay'
                    ? 'btn btn-sm btn-primary'
                    : userAnswers[idx].correct
                      ? 'btn btn-sm btn-success'
                      : 'btn btn-sm btn-danger';
                }

                return (
                  <button
                    key={idx}
                    className={`${cls} ${idx === currentIndex ? 'btn-secondary' : ''} ${markedQuestions.includes(quizQuestions[idx].id) ? 'is-flagged' : ''} quiz-nav-pill`}
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
              <div className="quiz-timer-row">
                <div className="quiz-timer-header">
                  <span className="quiz-timer-label"><Icon name="clock" /> {t('common.timeRemaining')}</span>
                  <span className={`quiz-timer-value ${timerClass}`}>
                    {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}
                  </span>
                </div>
                <ProgressBar value={timeLeft} max={600} variant="primary" />
              </div>
            )}

            <ProgressBar value={currentIndex + 1} max={quizQuestions.length} variant="gradient" />
            <p className="quiz-progress-label">
              Block {currentBlock + 1} • Q {currentIndex + 1}/{quizQuestions.length} • {currentTopic}
            </p>

            {(answerSubmitting || answerFeedback) && (
              <div className="quiz-answering-indicator" role="status" aria-live="polite">
                <div className="quiz-answer-loader" aria-hidden="true">
                  <QuizAnswerLoader status={answerFeedback || 'checking'} size={72} />
                </div>
                <span className="quiz-spinner-label">
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
              className="quiz-question-card card-surface-solid card-elevation-raised"
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
                <div className="quiz-review-explanation">
                  {userAnswers[currentIndex].explanation}
                </div>
              )}
            </Card>

            <div className="quiz-nav-buttons">
              <Button
                variant="secondary"
                className="quiz-nav-button-card"
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
                  className="quiz-nav-button-card"
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
                  className={blockSubmitting ? 'quiz-submit-button is-submitting' : undefined}
                >
                  {blockSubmitting ? (
                    <span className="quiz-submitting-label">
                      Submitting<span className="quiz-submitting-dots" aria-hidden="true">...</span>
                    </span>
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
          <div className="quiz-blocks-page">
            <div className="quiz-blocks-grid">
              {Array.from({ length: totalBlocks }).map((_, index) => {
                const topicData = allTopics.find((topic) => topic.topic_name === currentTopic);
                const failed = topicData?.failed_blocks?.includes(index);
                const pendingReview = topicData?.pending_review_blocks?.includes(index);
                const passed = topicData?.completed_blocks?.includes(index);
                const retryLocked = topicData?.locked_blocks?.includes(index);
                const retryLabel = formatQuizRetryTime(topicData?.retry_after?.[index]);

                return (
                  <button
                    key={index}
                    className={`btn ${passed ? 'btn-success' : pendingReview ? 'btn-primary' : failed ? 'btn-danger' : 'btn-secondary'} quiz-block-status-button`}
                    disabled={passed || retryLocked || locked}
                    onClick={() => startBlock(index)}
                    title={retryLocked ? retryLabel : undefined}
                  >
                    <span>Question set {index + 1}</span>
                    {passed && <span className="quiz-block-status-label">Passed</span>}
                    {pendingReview && <span className="quiz-block-status-label">Awaiting marking</span>}
                    {failed && (
                      <span className="quiz-block-status-label">
                        {retryLocked ? retryLabel : 'Try again'}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

          </div>       )}

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
          <div className="quiz-mode-picker" role="group" aria-label="Choose assessment mode">
            <button type="button" className={`quiz-mode-option ${quizMode === 'study' ? 'is-active' : ''}`} onClick={() => setQuizMode('study')}>
              <Icon name="lightbulb" />
              <span><strong>Study mode</strong><small>Get feedback and explanations as you practise.</small></span>
              {quizMode === 'study' && <Icon name="circle-check" />}
            </button>
            <button type="button" className={`quiz-mode-option ${quizMode === 'exam' ? 'is-active' : ''}`} onClick={() => setQuizMode('exam')}>
              <Icon name="graduation-cap" />
              <span><strong>Exam mode</strong><small>Complete the assessment before seeing feedback.</small></span>
              {quizMode === 'exam' && <Icon name="circle-check" />}
            </button>
          </div>
          <div className="quiz-assessment-facts">
            <span><Icon name="list-check" /> 10 questions</span>
            <span><Icon name="clock" /> 10 minutes</span>
            <span><Icon name="flag" /> {t('common.passMark')}</span>
          </div>
          <ul className="quiz-rules-list">
            <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.questionsPerBlock')}</span></li>
            <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.passMark')}</span></li>
            <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.immediateFeedback')}</span></li>
            <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.fullExplanations')}</span></li>
            <li><span className="quiz-rules-bullet" aria-hidden="true" /> <span>{t('common.timeLimit')}</span></li>
            <li><Icon name="exclamation-triangle" className="quiz-rules-icon is-warning" /> <span>{t('common.tabRecorded')}</span></li>
            <li><Icon name="exclamation-triangle" className="quiz-rules-icon is-error" /> <span>{t('common.tabAutoSubmit')}</span></li>
          </ul>
          <div className="quiz-rules-submit">
            <Button variant="3d" onClick={confirmStartBlock} loading={startingBlock} loadingContext="brand" loadingLabel={t('common.start')} className="quiz-rules-submit-btn">{t('common.start')}</Button>
          </div>
        </Modal>
      </div>
    </div>
  );
}
