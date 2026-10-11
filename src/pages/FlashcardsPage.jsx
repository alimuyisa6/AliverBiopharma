 /* pages/FlashcardsPage.jsx */
import AdSlot from '../components/Advertising/AdSlot';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRequireOnboarding } from '../hooks/useRequireOnboarding';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import { PendingApprovalScreen } from '../components/access/PendingApprovalScreen';
import { AccessDenied } from '../components/access/AccessDenied';
import FlashcardDeckView from '../components/FlashcardDeckView';
import FlashcardProgress from '../components/Flashcardprogress';
import {
  completeFlashcardSession,
  getKnownFlashcards,
  getFlashcardDecks
} from '../api/cachedClient';
import Icon from '../components/Icon/Icon';
import Spinner from '../components/Spinner/Spinner';
import Skeleton from '../components/Skeleton/Skeleton';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import EmptyState from '../components/EmptyState/EmptyState';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../components/Toast/Toast';

const flashcardPageCache = new Map();
const flashcardPageRequests = new Map();

const STAGE = {
  LOADING: 'loading',
  SUBJECT: 'subject',
  STUDY: 'study',
  COMPLETE: 'complete'
};

export default function FlashcardsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReady } = useRequireOnboarding();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();
  const { level, class_name, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const addToast = useToast();

  const [stage, setStage] = useState(STAGE.LOADING);
  const [selectedDeck, setSelectedDeck] = useState(null);
  const [sessionResult, setSessionResult] = useState(null);
  const [knownIds, setKnownIds] = useState([]);
  const [decks, setDecks] = useState([]);
  const [error, setError] = useState(null);

  const curriculumUnitId = searchParams.get('unit_id') || null;
  const cacheKey = `${user?.id || 'anonymous'}:${level || ''}:${class_name || ''}:${curriculumUnitId || 'all'}`;
  const challengeId = searchParams.get('challenge_id') || null;
  const deckId = searchParams.get('deck_id') || null;
  const levelName = displayName || level || '';
  const classLabel = class_name || '';

  useEffect(() => {
    if (!user || !isReady || !access.canAccess) return undefined;

    let active = true;
    init({ active: () => active });
    return () => { active = false; };
  }, [user?.id, isReady, access.canAccess, level, class_name, curriculumUnitId, deckId]);

  async function init(lifecycle = { active: () => true }) {
    const cached = flashcardPageCache.get(cacheKey);

    if (cached) {
      setKnownIds(cached.knownIds);
      setDecks(cached.decks);
      setError(null);
      applyRequestedDeck(cached.decks);
      // Refresh in the background without replacing visible content with a spinner.
      refreshFlashcards(lifecycle, false);
      return;
    }

    setStage(STAGE.LOADING);
    setError(null);

    try {
      const data = await refreshFlashcards(lifecycle, true);
      if (!lifecycle.active() || !data) return;
      applyRequestedDeck(data.decks);
    } catch {
      if (lifecycle.active()) setError('Failed to load flashcards. Please refresh.');
    }
  }

  function applyRequestedDeck(deckList) {
    const requestedDeck = deckId
      ? (deckList || []).find((deck) => String(deck.id) === String(deckId))
      : null;

    if (requestedDeck) {
      setSelectedDeck(requestedDeck);
      setStage(STAGE.STUDY);
    } else {
      setSelectedDeck(null);
      setStage(STAGE.SUBJECT);
    }
  }

  async function refreshFlashcards(lifecycle, throwOnError = false) {
    let request = flashcardPageRequests.get(cacheKey);
    if (!request) {
      request = Promise.all([
        getKnownFlashcards(),
        getFlashcardDecks(curriculumUnitId ? { unit_id: curriculumUnitId } : {})
      ]).then(([knownData, decksData]) => {
        const data = {
          knownIds: Array.isArray(knownData) ? knownData : [],
          decks: Array.isArray(decksData) ? decksData : []
        };
        flashcardPageCache.set(cacheKey, data);
        return data;
      }).finally(() => {
        flashcardPageRequests.delete(cacheKey);
      });
      flashcardPageRequests.set(cacheKey, request);
    }

    try {
      const data = await request;
      if (lifecycle.active()) {
        setKnownIds(data.knownIds);
        setDecks(data.decks);
        setError(null);
      }
      return data;
    } catch (error) {
      if (throwOnError) throw error;
      return null;
    }
  }

  function handleDeckSelect(deck) {
    if (locked) {
      addToast(reason || 'Action temporarily disabled', 'error');
      return;
    }

    setSelectedDeck(deck);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set('deck_id', String(deck.id));
      return next;
    }, { replace: true });
    setStage(STAGE.STUDY);
  }

  async function handleStudyComplete({ sessionId, total }) {
    let result = {
      total,
      correct: 0,
      incorrect: 0,
      score: 0
    };

    if (sessionId) {
      try {
        const data = await completeFlashcardSession(sessionId);

        result = {
          total: data.card_count ?? total,
          correct: data.correct ?? 0,
          incorrect: data.incorrect ?? 0,
          score: data.score ?? 0
        };
      } catch {}
    }

    setSessionResult(result);
    setStage(STAGE.COMPLETE);
  }

  function handleRestart() {
    setSelectedDeck(null);
    setSessionResult(null);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('deck_id');
      return next;
    }, { replace: true });
    setStage(STAGE.SUBJECT);
  }

  function getEmptyStateImage(key) {
    const uiComponents = bootstrap?.ui_components || [];
    const component = uiComponents.find((item) => item.component_key === `empty_state_${key}`);

    return component?.properties?.image_url || null;
  }

  if (!isReady || access.isPending) return <PendingApprovalScreen />;
  if (!access.canAccess) return <AccessDenied />;

  if (stage === STAGE.LOADING) {
    return (
      <div className="fcd-loading-wrap">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="section flashcard-error">
        <EmptyState
          image={getEmptyStateImage('general')}
          title="Error"
          description={error}
          action={<Button onClick={init}>Try Again</Button>}
        />
      </div>
    );
  }

  if (stage === STAGE.SUBJECT) {
    return (
      <>
     <div className="flashcards-page">
        <div className="section flashcard-subject-section">
          <span className="sec-label">Study Tools</span>
          <h1 className="section-title flashcard-title">
            {levelName || 'Flashcards'}
          </h1>

          {classLabel && <p className="flashcard-class">{classLabel}</p>}

          <AdSlot placement="flashcards" pageContext="flashcards" />

          <p className="section-subtitle flashcard-subtitle">
            Study cards for {levelName || 'your programme'}.
          </p>

          {decks.length === 0 ? (
            <EmptyState
              image={getEmptyStateImage('flashcards')}
              title="Build Your Recall"
              description={`Flashcard decks for ${classLabel || levelName || 'this programme'} will appear here when they are ready.`}
            />
          ) : (
            <div className="flashcard-decks-grid">
              {decks.map((deck) => (
                <Card
                  key={deck.id}
                  icon="layer-group"
                  title={deck.title}
                  description={deck.description || 'No description'}
                  className="flashcard-deck-card"
                  footer={
                    <Button variant="3d" size="sm" icon="play" onClick={() => handleDeckSelect(deck)} disabled={locked}>
                      Start
                    </Button>
                  }
                >
                  {deck.card_types && (
                    <div className="flashcard-type-row">
                      {deck.card_types.map((type) => (
                        <span key={type} className="chip">{type.replace('_', ' ')}</span>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      </>
    );
  }

  if (stage === STAGE.STUDY && selectedDeck) {
    return (
      <FlashcardDeckView
        deck={selectedDeck}
        challengeId={challengeId}
        knownIds={knownIds}
        mode="flip"
        onComplete={handleStudyComplete}
      />
    );
  }

  if (stage === STAGE.COMPLETE) {
    return (
      <FlashcardProgress
        result={sessionResult}
        onRestart={handleRestart}
        onHome={() => navigate('/')}
      />
    );
  }
  return null;
}

