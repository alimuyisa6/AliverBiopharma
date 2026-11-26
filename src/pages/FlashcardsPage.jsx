 /* pages/FlashcardsPage.jsx */
import AdSlot from '../components/Advertising/AdSlot';
import StorysetIllustration from '../components/StorysetIllustration';
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useRequireOnboarding } from '../hooks/useRequireOnboarding';
import { useLevelFilter } from '../hooks/useLevelFilter';
import { useContentAccess } from '../hooks/useContentAccess';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import { PendingApprovalScreen } from '../components/access/PendingApprovalScreen';
import { AccessDenied } from '../components/access/AccessDenied';
import FlashcardDeckView from '../components/FlashcardDeckView';
import FlashcardProgress from '../components/Flashcardprogress';
import LearningJourney from '../components/LearningJourney/LearningJourney';
import {
  completeFlashcardSession,
  getKnownFlashcards,
  getFlashcardDecks
} from '../api/client';
import Icon from '../components/Icon/Icon';
import PageSkeleton from '../components/Loading/PageSkeleton';
import Skeleton from '../components/Skeleton/Skeleton';
import Button from '../components/Button/Button';
import Card from '../components/Card/Card';
import EmptyState from '../components/EmptyState/EmptyState';
import Breadcrumb from '../components/Breadcrumb/Breadcrumb';
import { redirectToSubscription } from '../utils/subscriptionNavigation';
import { useLayout } from '../contexts/LayoutContext';
import { useToast } from '../components/Toast/Toast';
import { getCachedStale, setCache } from '../utils/cache';
import { UI } from '../design-system';

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
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isReady } = useRequireOnboarding();
  const access = useContentAccess();
  const { locked, reason } = useSecurityUiLock();
  const { level, class_name, displayName } = useLevelFilter();
  const { bootstrap } = useLayout();
  const addToast = useToast();
  const curriculumUnitId = searchParams.get('unit_id') || null;
  const sourceNoteId = searchParams.get('note_id') || null;
  const activityScope = searchParams.get('activity_scope') || (sourceNoteId ? 'note' : null);
  const cacheKey = `${user?.id || 'anonymous'}:${level || ''}:${class_name || ''}:${curriculumUnitId || 'all'}:${sourceNoteId || 'no-note'}:${activityScope || 'default-scope'}`;
  const initialFlashcards = getCachedStale(`flashcards_page_${cacheKey}`) || flashcardPageCache.get(cacheKey);
  const initialDeckId = searchParams.get('deck_id') || null;
  const initialDeck = initialDeckId ? initialFlashcards?.decks?.find((deck) => String(deck.id) === String(initialDeckId)) : null;

  const [stage, setStage] = useState(() => initialDeck ? STAGE.STUDY : initialFlashcards ? STAGE.SUBJECT : STAGE.LOADING);
  const [selectedDeck, setSelectedDeck] = useState(initialDeck || null);
  const [sessionResult, setSessionResult] = useState(null);
  const [knownIds, setKnownIds] = useState(() => initialFlashcards?.knownIds || []);
  const [decks, setDecks] = useState(() => initialFlashcards?.decks || []);
  const [error, setError] = useState(null);

  const challengeId = searchParams.get('challenge_id') || null;
  const deckId = searchParams.get('deck_id') || null;
  const levelName = displayName || level || '';
  const classLabel = class_name || '';

  useEffect(() => {
    if (!user || !isReady || !access.canAccess) return undefined;

    let active = true;
    init({ active: () => active });
    return () => { active = false; };
  }, [user?.id, isReady, access.canAccess, level, class_name, curriculumUnitId, sourceNoteId, activityScope, deckId]);

  async function init(lifecycle = { active: () => true }) {
    const cached = getCachedStale(`flashcards_page_${cacheKey}`) || flashcardPageCache.get(cacheKey);

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
      if (lifecycle.active()) setError("We couldn't load your flashcards. Please try again.");
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
        getFlashcardDecks({ ...(curriculumUnitId ? { unit_id: curriculumUnitId } : {}), ...(sourceNoteId ? { note_id: sourceNoteId } : {}) })
      ]).then(([knownData, decksData]) => {
        const data = {
          knownIds: Array.isArray(knownData) ? knownData : [],
          decks: Array.isArray(decksData) ? decksData : []
        };
        flashcardPageCache.set(cacheKey, data);
        setCache(`flashcards_page_${cacheKey}`, data);
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
      score: 0,
      activity_outcome: 'incomplete',
      deck_complete: false,
      recommendation: null
    };

    if (sessionId) {
      try {
        const data = await completeFlashcardSession(sessionId);

        result = {
          total: data.card_count ?? total,
          correct: data.correct ?? 0,
          incorrect: data.incorrect ?? 0,
          score: data.score ?? 0,
          activity_outcome: data.activity_outcome || 'incomplete',
          deck_complete: data.deck_complete === true,
          recommendation: data.recommendation || null
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
    return <div className={`${UI.container} py-8 lg:px-8`}><PageSkeleton variant="compact" /></div>;
  }

  if (error) {
    return (
      <div className={`${UI.container} py-8 lg:px-8`}>
        <EmptyState
          image={getEmptyStateImage('general')}
          title="We couldn’t load your flashcards"
          description={error}
          action={<Button onClick={init}>Try again</Button>}
        />
      </div>
    );
  }

  if (stage === STAGE.SUBJECT) {
    return (
      <main className="min-h-screen bg-background">
        <div className={`${UI.container} py-6 lg:px-8`}>
          <Breadcrumb items={[
            { label: 'Home', href: '/' },
            { label: 'Flashcards' },
            ...(curriculumUnitId ? [{ label: 'Selected learning area' }] : [])
          ]} />
        </div>

        <section className={UI.flashcardHeroSection}>
          <div className={UI.container}>
            <header className="flex items-center justify-between gap-5">
              <div className="min-w-0">
                <h1 className={UI.pageTitleHeading}>{levelName || 'Flashcards'}</h1>
                {classLabel && <div className="mt-2 text-sm font-semibold text-primary-800">{classLabel}</div>}
              </div>
              <StorysetIllustration name="studying" alt="Learner reviewing flashcards" className="hidden w-28 shrink-0 object-contain sm:block md:w-36" />
            </header>

            <div className="mt-6">
              <AdSlot placement="flashcards" pageContext="flashcards" />
            </div>

            <p className={`${UI.pageTitleDescription} mt-6`}>
              Review key facts and test your recall in {levelName || 'your programme'}.
            </p>

            {decks.length === 0 ? (
              <div className="mt-8">
                <EmptyState
                  image={getEmptyStateImage('flashcards')}
                  title="No flashcards yet"
                  description={`Flashcard sets for ${classLabel || levelName || 'your programme'} haven’t been added yet.`}
                />
              </div>
            ) : (
              <div className={`${UI.flashcardDeckGrid} mt-8`}>
                {decks.map((deck) => (
                  <Card
                    key={deck.id}
                    image={deck.cover_image_url || deck.image_url || deck.thumbnail_url || 'https://images.pexels.com/photos/16420473/pexels-photo-16420473.jpeg?auto=compress&cs=tinysrgb&w=900&h=600&fit=crop'}
                    title={deck.title}
                    description={deck.description || 'Test your recall of key ideas.'}
                    className={UI.flashcardDeckCard}
                    footer={
                      <Button variant="3d" size="sm" icon="play" onClick={() => handleDeckSelect(deck)} disabled={locked}>
                        Study cards
                      </Button>
                    }
                  >
                    {deck.card_types && (
                      <div className="flex flex-wrap gap-2">
                        {deck.card_types.map((type) => (
                          <span key={type} className={UI.flashcardTypeBadge}>{type.replace('_', ' ')}</span>
                        ))}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}

            {curriculumUnitId && (
              <LearningJourney
                unitId={curriculumUnitId}
                excludeStages={['flashcards']}
                returnTo={'/flashcards?unit_id=' + encodeURIComponent(curriculumUnitId)}
              />
            )}
          </div>
        </section>
      </main>
    );
  }

  if (stage === STAGE.STUDY && selectedDeck) {
    return (
      <FlashcardDeckView
        deck={selectedDeck}
        onPremiumRequired={() => redirectToSubscription(navigate, location, { preserveCurrent: true, reason: 'premium' })}
        challengeId={challengeId}
        knownIds={knownIds}
        mode="flip"
        onComplete={handleStudyComplete}
        sourceNoteId={sourceNoteId}
        activityScope={activityScope}
        unitId={curriculumUnitId}
      />
    );
  }

  if (stage === STAGE.COMPLETE) {
    return (
      <>
        <FlashcardProgress
          result={sessionResult}
          onRestart={handleRestart}
          onHome={() => navigate('/')}
        />
        {curriculumUnitId && (
          <LearningJourney
            unitId={curriculumUnitId}
            excludeStages={['flashcards']}
            returnTo={'/flashcards?unit_id=' + encodeURIComponent(curriculumUnitId)}
          />
        )}
      </>
    );
  }
  return null;
}

