/* features/mood/MoodCheckSection.jsx */
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';

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
    <section className="section reveal rounded-2xl px-5 py-8 sm:px-8" style={{ backgroundColor: '#E8F4F2' }}>
      <span className="sec-label">Mood Check</span>
      <h2 className="section-title">
        How Are You<br />Feeling Today?
      </h2>
      <p className="section-subtitle">
        Your feedback helps us improve your learning experience.
      </p>

      <div className="card card-tone-primary mood-card">
        <div className="mood-emoji-row">
          {MOODS.map((mood) => (
            <Button
              key={mood.key}
              variant={moodSelected === mood.key ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => onMoodSelect(mood.key)}
              icon={mood.icon}
            >
              {mood.label}
            </Button>
          ))}
        </div>

        {moodSelected && !moodSubmitted && (
          <div>
            <textarea
              className="mood-textarea block min-h-32 w-full min-w-0 resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-800 shadow-sm outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
              placeholder="Tell us more (optional)..."
              value={moodMessage}
              onChange={(event) => onMessageChange(event.target.value)}
              rows={3}
            />
            <Button onClick={onSubmit} icon="paper-plane">Submit</Button>
          </div>
        )}

        {moodSubmitted && (
          <p className="mood-success">
            <Icon name="circle-check" /> Thanks for sharing!
          </p>
        )}
      </div>
    </section>
  );
} 
