// components/recall/RecallProgressTab.jsx
import Icon from '../Icon/Icon';
import Card from '../Card/Card';
import ProgressBar from '../ProgressBar/ProgressBar';

export default function RecallProgressTab({ xpProgress, accuracy, rankTitle, achievementsList, masteryTopics }) {
  const topicEntries = Object.entries(masteryTopics)
    .filter(([topic]) => topic && topic !== 'null')
    .slice(0, 6);

  return (
    <div className="w-full min-w-0 space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card>
          <div className="flex min-w-0 flex-col gap-3 p-4 sm:p-5">
            <Icon name="trophy" className="h-7 w-7 text-amber-600" />
            <h3 className="text-base font-bold leading-6 text-slate-900">XP Progress</h3>
            <p className="text-sm leading-6 text-slate-600">
              Level {xpProgress.level} · {rankTitle}
            </p>
            <ProgressBar value={xpProgress.xpIntoLevel} max={100} variant="gradient" />
            <p className="text-xs font-medium tabular-nums text-slate-500">
              {xpProgress.xpIntoLevel} / 100 XP to next level
            </p>
          </div>
        </Card>

        <Card>
          <div className="recall-stat-card-inner">
            <Icon name="bullseye" className="h-7 w-7 text-primary-700" />
            <h3 className="recall-stat-card-heading font-poppins">Accuracy</h3>
            <ProgressBar value={accuracy} max={100} variant="primary" />
            <p className="recall-stat-card-footer font-mono">
              {accuracy}% across all sessions
            </p>
          </div>
        </Card>

        <Card>
          <div className="recall-stat-card-inner">
            <Icon name="trophy" className="recall-stat-card-icon is-accent" />
            <h3 className="recall-stat-card-heading font-poppins">Achievements</h3>
            <div className="flex flex-wrap gap-2">
              {achievementsList.slice(0, 6).map((achievement) => (
                <span
                  key={achievement.id}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-secondary-50 text-secondary-700"
                  title={achievement.name}
                >
                  <Icon
                    name={
                      achievement.icon === 'dna'
                        ? 'microscope'
                        : achievement.icon || 'medal'
                    }
                  />
                </span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {topicEntries.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold leading-7 text-primary-950">Topic Mastery</h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topicEntries.map(([topic, mastery]) => (
              <Card key={topic}>
                <div className="flex min-w-0 flex-col gap-3 p-4">
                  <Icon name="book-open" className="h-6 w-6 text-primary-700" />
                  <h4 className="break-words text-sm font-bold leading-5 text-slate-800">{topic}</h4>
                  <ProgressBar value={mastery} max={100} variant="success" />
                  <p className="text-xs font-bold tabular-nums text-slate-500">{Math.round(mastery)}%</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
