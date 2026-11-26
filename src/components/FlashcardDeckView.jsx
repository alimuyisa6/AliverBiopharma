 /* components/FlashcardDeckView.jsx */
import { useState, useEffect } from 'react';
import { isPremiumAccessError } from '../utils/subscriptionNavigation';
import {
  getFlashcardDeck,
  toggleFlashcardKnown,
  toggleFlashcardBookmark,
  rateFlashcard,
  checkFlashcardAnswer,
  startFlashcardSession,
  updateFlashcardSession
} from '../api/cachedClient';
import Icon from './Icon/Icon';
import Button from './Button/Button';
import ProgressBar from './ProgressBar/ProgressBar';
import Spinner from './Spinner/Spinner';
import { useToast } from './Toast/Toast';
import { useSecurityUiLock } from '../hooks/useSecurityUiLock';
import { UI } from '../design-system';

const MODES = [
  { value: 'flip', icon: 'rotate', label: 'Flip' },
  { value: 'typed', icon: 'keyboard', label: 'Typed' },
  { value: 'multiple_choice', icon: 'list-check', label: 'MCQ' },
  { value: 'structure_identification', icon: 'microscope', label: 'Structure' }
];



export default function FlashcardDeckView({ deck: deckMeta, knownIds = [], mode: initialMode = 'flip', onComplete, onPremiumRequired, challengeId = null, sourceNoteId = null, activityScope = null, unitId = null }) {
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [index, setIndex] = useState(0);
  const [mode, setMode] = useState(initialMode);
  const [flipped, setFlipped] = useState(false);
  const [known, setKnown] = useState(new Set(knownIds));
  const [bookmarked, setBookmarked] = useState(new Set());
  const [sessionId, setSessionId] = useState(null);
  const [typedAnswer, setTypedAnswer] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [mcAnswered, setMcAnswered] = useState(null);
  const [structureTab, setStructureTab] = useState('name');
  const [loading, setLoading] = useState(true);
  const addToast = useToast();
  const { locked, reason } = useSecurityUiLock();

  const card = cards[index] || null;

  useEffect(() => {
    loadDeck();
  }, [deckMeta.id, sourceNoteId, activityScope, unitId, challengeId]);

  useEffect(() => {
    const handler = (event) => {
      if (event.key === 'ArrowRight') handleNext();
      if (event.key === 'ArrowLeft') handlePrev();
      if (event.key === ' ') {
        event.preventDefault();
        setFlipped((current) => !current);
      }
    };

    window.addEventListener('keydown', handler);

    return () => window.removeEventListener('keydown', handler);
  }, [index, cards.length]);

  async function loadDeck() {
    setLoading(true);

    try {
      const data = await getFlashcardDeck(deckMeta.id);

      setDeck(data);
      setCards(data.cards || []);

      const session = await startFlashcardSession(deckMeta.id, mode, challengeId, sourceNoteId, activityScope, unitId);

      setSessionId(session?.session_id || null);
    } catch (error) {
      if (isPremiumAccessError(error)) {
        onPremiumRequired?.();
      } else {
        addToast('Failed to load deck', 'error');
      }
    } finally {
      setLoading(false);
    }
  }

  function resetCard() {
    setFlipped(false);
    setTypedAnswer('');
    setFeedback(null);
    setMcAnswered(null);
    setStructureTab('name');
  }

  function handleNext() {
    if (index >= cards.length - 1) return;

    setIndex((current) => current + 1);
    resetCard();
  }

  function handlePrev() {
    if (index <= 0) return;

    setIndex((current) => current - 1);
    resetCard();
  }

  async function handleToggleKnown() {
    if (locked || !card) return;

    try {
      await toggleFlashcardKnown(card.id);

      setKnown((prev) => {
        const next = new Set(prev);

        if (next.has(card.id)) next.delete(card.id);
        else next.add(card.id);

        return next;
      });
    } catch {}
  }

  async function handleToggleBookmark() {
    if (locked || !card) return;

    try {
      await toggleFlashcardBookmark(card.id);

      setBookmarked((prev) => {
        const next = new Set(prev);

        if (next.has(card.id)) next.delete(card.id);
        else next.add(card.id);

        return next;
      });
    } catch {}
  }

  async function handleRate(difficulty) {
    if (locked || !card) return;

    try {
      await rateFlashcard(card.id, difficulty);
    } catch {}
  }

  async function handleCheckTyped(checkType = 'answer') {
    if (locked || !card || !typedAnswer.trim()) return;

    try {
      const result = await checkFlashcardAnswer(card.id, typedAnswer.trim(), checkType);

      setFeedback(result);

      if (sessionId) {
        await updateFlashcardSession(sessionId, card.id, result.correct, index).catch(() => {});
      }
    } catch {}
  }

  async function handleMCSelect(optionIndex) {
    if (locked || !card || mcAnswered !== null) return;

    const correct = optionIndex === card.mc_correct_index;

    setMcAnswered(optionIndex);
    setFeedback({
      correct,
      strength: correct ? 'excellent' : 'incorrect',
      correct_answer: card.mc_options?.[card.mc_correct_index]
    });

    if (sessionId) {
      await updateFlashcardSession(sessionId, card.id, correct, index).catch(() => {});
    }
  }

  function handleFinish() {
    if (locked) return;

    onComplete({ sessionId, total: cards.length });
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center px-4 py-10">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!card) {
    return (
      <div className="mx-auto flex min-h-[40vh] w-full max-w-5xl flex-col items-center justify-center gap-4 px-4 py-10 text-center">
        <Icon name="layer-group" className="h-8 w-8 text-primary-700" />
        <p>No cards in this deck yet.</p>
        <Button variant="ghost" onClick={() => onComplete({ sessionId, total: 0 })} icon="arrow-left">
          Back
        </Button>
      </div>
    );
  }

  const isKnown = known.has(card.id);
  const isBookmarked = bookmarked.has(card.id);
  const isLast = index === cards.length - 1;
  const cardColor = UI.flashcardModeColors[mode] || UI.flashcardModeColors.flip;

  return (
    <div className="w-full">
      <div className={UI.studyContainer}>
        <div className="mb-4">
          <ProgressBar value={index + 1} max={cards.length} variant="primary" />
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {MODES.map((item) => (
            <Button
              key={item.value}
              variant={mode === item.value ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => { setMode(item.value); resetCard(); }}
              icon={item.icon}
              disabled={locked}
            >
              {item.label}
            </Button>
          ))}
        </div>

        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="rounded-lg bg-slate-100 px-3 py-1 font-bold text-slate-700">{index + 1} / {cards.length}</span>
          {deck?.title && <span className="font-semibold text-slate-500">{deck.title}</span>}
        </div>

        {mode === 'flip' && (
          <div className="grid gap-4">
            <div className={`${UI.flashcardPrompt} relative min-h-[18rem] sm:p-8 ${cardColor}`} aria-live="polite">
              <span className={`relative grid min-h-[18rem] [transform-style:preserve-3d] transition-transform duration-500 ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
                <span className={`${UI.flashcardFace} ${cardColor}`}>
                  <span className={UI.flashcardQuestionBadge}>Question</span>
                  <span className="text-xl font-bold leading-8 sm:text-2xl">{card.front_text}</span>
                  {card.image_url && <img src={card.image_url} alt="" className="mt-3 max-h-72 w-full rounded-xl object-contain" />}
                </span>
                <span className={`${UI.flashcardFaceBack} ${cardColor}`}>
                  <span className={UI.flashcardAnswerBadge}>Answer</span>
                  <span className="text-xl font-bold leading-8 sm:text-2xl">{card.back_text}</span>
                </span>
              </span>
            </div>
            <Button
              type="button"
              variant="secondary"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-600"
              onClick={() => setFlipped((current) => !current)}
              aria-pressed={flipped}
            >
              <Icon name="rotate" /> {flipped ? 'Show question' : 'Reveal answer'}
            </Button>
          </div>
        )}

        {mode === 'typed' && (
          <div>
            <div className={`${UI.flashcardPrompt} ${cardColor}`}>
              <span className={UI.flashcardQuestionBadge}>Question</span>
              <h3>{card.front_text}</h3>
              {card.image_url && <img src={card.image_url} alt="" className="mt-3 max-h-72 w-full rounded-xl object-contain" />}
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className={`${UI.inputBase} text-sm leading-6`}
                placeholder="Type your answer..."
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleCheckTyped(); }}
                disabled={!!feedback || locked}
              />
              {!feedback && (
                <Button onClick={() => handleCheckTyped()} disabled={!typedAnswer.trim() || locked} icon="circle">
                  Check
                </Button>
              )}
            </div>

            {feedback && (
              <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                <Icon name={feedback.correct ? 'circle-check' : 'circle-xmark'} />
                <span>
                  {feedback.correct ? 'Correct. ' : 'Incorrect. '}
                  Correct answer: <strong>{feedback.correct_answer}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {mode === 'multiple_choice' && (
          <div>
            <div className={`${UI.flashcardPrompt} ${cardColor}`}>
              <span className={UI.flashcardQuestionBadge}>Question</span>
              <h3>{card.front_text}</h3>
            </div>

            {card.mc_options?.length > 0 ? (
              <div className="grid gap-3">
                {card.mc_options.map((option, optionIndex) => {
                  let variant = 'secondary';

                  if (mcAnswered !== null) {
                    if (optionIndex === card.mc_correct_index) variant = 'primary';
                    else if (optionIndex === mcAnswered) variant = 'danger';
                  }

                  return (
                    <Button
                      key={optionIndex}
                      variant={variant}
                      onClick={() => handleMCSelect(optionIndex)}
                      disabled={mcAnswered !== null || locked}
                    >
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-50 text-xs font-extrabold text-primary-800">{String.fromCharCode(65 + optionIndex)}</span>
                      {option}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">No MCQ options for this card.</p>
            )}

            {feedback && (
              <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                <Icon name={feedback.correct ? 'circle-check' : 'circle-xmark'} />
                <span>
                  {feedback.correct ? 'Correct. ' : `Incorrect. Answer: `}
                  <strong>{feedback.correct_answer}</strong>
                </span>
              </div>
            )}
          </div>
        )}

        {mode === 'structure_identification' && (
          <div>
            <div className={`${UI.flashcardPrompt} ${cardColor}`}>
              <span className={UI.flashcardQuestionBadge}>Structure</span>
              {card.image_url ? (
                <img src={card.image_url} alt={card.structure_name || 'Structure'} className="max-h-[28rem] w-full rounded-xl object-contain" />
              ) : (
                <div className="flex min-h-48 flex-col items-center justify-center gap-3 rounded-xl bg-slate-100 p-5 text-center text-slate-500">
                  <Icon name="image" className="h-8 w-8 text-slate-400" />
                  <p>{card.structure_name || 'Image coming soon'}</p>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant={structureTab === 'name' ? 'primary' : 'ghost'} size="sm" onClick={() => setStructureTab('name')} icon="tag" disabled={locked}>
                Name
              </Button>
              <Button variant={structureTab === 'function' ? 'primary' : 'ghost'} size="sm" onClick={() => setStructureTab('function')} icon="gear" disabled={locked}>
                Function
              </Button>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <input
                className={`${UI.inputBase} text-sm leading-6`}
                placeholder={structureTab === 'name' ? 'What is this structure called?' : 'What is its function?'}
                value={typedAnswer}
                onChange={(event) => setTypedAnswer(event.target.value)}
                onKeyDown={(event) => { if (event.key === 'Enter') handleCheckTyped(structureTab); }}
                disabled={!!feedback || locked}
              />
              {!feedback && (
                <Button onClick={() => handleCheckTyped(structureTab)} disabled={!typedAnswer.trim() || locked} icon="circle">
                  Check
                </Button>
              )}
            </div>

            {feedback && (
              <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm leading-6 ${feedback.correct ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-900"}`}>
                <Icon name={feedback.correct ? 'circle-check' : 'circle-xmark'} />
                <span>
                  {feedback.correct ? 'Correct. ' : 'Not quite. '}
                  {structureTab === 'name'
                    ? <>Structure: <strong>{feedback.correct_answer || card.structure_name}</strong></>
                    : <>Function: <strong>{feedback.correct_answer}</strong></>}
                </span>
              </div>
            )}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-4 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => handleRate('easy')} disabled={locked}>Easy</Button>
            <Button variant="ghost" size="sm" onClick={() => handleRate('medium')} disabled={locked}>Medium</Button>
            <Button variant="ghost" size="sm" onClick={() => handleRate('hard')} disabled={locked}>Hard</Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant={isKnown ? 'primary' : 'ghost'} size="sm" onClick={handleToggleKnown} icon={'circle'} disabled={locked}>
              {isKnown ? 'Known' : 'Mark Known'}
            </Button>
            <Button variant={isBookmarked ? 'warm' : 'ghost'} size="sm" onClick={handleToggleBookmark} icon="bookmark" disabled={locked}>
              {isBookmarked ? 'Saved' : 'Save'}
            </Button>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={handlePrev} disabled={index === 0} icon="arrow-left" />
          {isLast ? (
            <Button onClick={handleFinish} icon="flag-checkered" disabled={locked}>Finish</Button>
          ) : (
            <Button onClick={handleNext} icon="arrow-right" />
          )}
        </div>

        <p className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
          <Icon name="keyboard" /> Arrow keys navigate · Space flips
        </p>
      </div>
    </div>
  );
}
