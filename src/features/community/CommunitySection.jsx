 /* features/community/CommunitySection.jsx */
import Icon from '../../components/Icon/Icon';
import Button from '../../components/Button/Button';
import { UI } from '../../design-system';

export function CommunitySection({
  activity = [],
  weeklyChallenge,
  weeklyChallengeAnswer,
  onWeeklySubmit,
  challengeSubmitting = null
}) {
  return (
    <div className="grid gap-8">
      {weeklyChallenge?.question && (
        <section className="w-full bg-primary-50 px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="community-challenge-heading">
          <div className="mx-auto grid w-full max-w-7xl gap-6">
            <header className="grid gap-3"><h2 id="community-challenge-heading" className="text-2xl font-extrabold text-primary-900 sm:text-3xl">Weekly Challenge</h2><p className="text-sm leading-7 text-muted">Test your knowledge with this week's question.</p></header>
            <div className="mx-auto grid w-full max-w-2xl gap-5 rounded-2xl border border-border bg-white p-5 shadow-sm sm:p-7">
              <h3 className="flex items-start gap-3 text-lg font-bold leading-7 text-primary-900"><Icon name="trophy" className="mt-1 shrink-0 text-secondary-600" />{weeklyChallenge.question}</h3>
              {!weeklyChallengeAnswer ? (
                <div className="grid gap-3">{(weeklyChallenge.options || []).map((option, index) => <Button key={index} variant="secondary" className="w-full justify-start text-left" onClick={() => onWeeklySubmit(index)} loading={challengeSubmitting === index}>{String.fromCharCode(65 + index)}) {option}</Button>)}</div>
              ) : (
                <div className={weeklyChallengeAnswer.correct ? UI.status.success : UI.status.error}>
                  <p className="font-semibold"><Icon name={weeklyChallengeAnswer.correct ? 'circle-check' : 'circle-xmark'} />{weeklyChallengeAnswer.correct ? ' Correct!' : ' Incorrect'}</p>
                  <p className="mt-2 text-sm leading-6">{weeklyChallengeAnswer.explanation}</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {activity.length > 0 && (
        <section className="w-full bg-secondary-50 px-5 py-10 sm:px-8 sm:py-14" aria-labelledby="community-activity-heading">
          <div className="mx-auto grid w-full max-w-7xl gap-6">
            <header className="grid gap-3"><h2 id="community-activity-heading" className="text-2xl font-extrabold text-primary-900 sm:text-3xl">Recent Activity</h2><p className="text-sm leading-7 text-muted">See what other learners are doing.</p></header>
            <div className="mx-auto grid w-full max-w-2xl divide-y divide-border rounded-2xl border border-border bg-white px-4">
              {activity.slice(0, 8).map((item, index) => (
                <div key={index} className="flex min-w-0 items-center gap-4 py-4">
                  <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700"><Icon name={item.type === 'download' ? 'download' : 'graduation-cap'} /></span>
                  <span className="min-w-0 flex-1 text-sm font-medium leading-6 text-slate-700">{item.message}</span>
                  <span className="shrink-0 text-xs text-muted">{new Date(item.time).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
