/* features/mood/MoodCheckSection.jsx */
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { UI } from '../../design-system';

const MOODS = [
  { key: 'struggling', icon: 'circle-xmark', label: 'Struggling' },
  { key: 'confused', icon: 'circle-info', label: 'Confused' },
  { key: 'okay', icon: 'circle', label: 'Okay' },
  { key: 'good', icon: 'circle', label: 'Good' },
  { key: 'great', icon: 'star', label: 'Great' }
];

export function MoodCheckSection({
  moodSelected,
  moodMessage,
  moodSubmitted,
  onMoodSelect,
  onMessageChange,
  onSubmit
}) {
  return (
    <section className="w-full bg-secondary-50 px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="mood-check-heading">
      <div className="mx-auto grid w-full max-w-7xl gap-6">
        <header className="grid gap-3"><h2 id="mood-check-heading" className="text-2xl font-extrabold text-primary-900 sm:text-3xl">How Are You Feeling Today?</h2><p className="text-sm leading-7 text-muted">Your feedback helps us improve your learning experience.</p></header>
        <div className="grid w-full max-w-3xl gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Select how you are feeling">
            {MOODS.map((mood) => <Button key={mood.key} variant={moodSelected === mood.key ? 'primary' : 'secondary'} size="sm" onClick={() => onMoodSelect(mood.key)} icon={mood.icon} aria-pressed={moodSelected === mood.key}>{mood.label}</Button>)}
          </div>
          {moodSelected && !moodSubmitted && (
            <div className="grid gap-3">
              <label htmlFor="mood-feedback" className="text-sm font-semibold text-slate-700">Tell us more (optional)</label>
              <textarea id="mood-feedback" className={`${UI.inputBase} min-h-32 resize-y border-border`} placeholder="Share anything that would help us improve your learning experience…" value={moodMessage} onChange={(event) => onMessageChange(event.target.value)} rows={3} />
              <Button onClick={onSubmit} icon="paper-plane">Submit</Button>
            </div>
          )}
          {moodSubmitted && <p className={UI.status.success} role="status"><Icon name="circle-check" /> Thanks for sharing!</p>}
        </div>
      </div>
    </section>
  );
} 
