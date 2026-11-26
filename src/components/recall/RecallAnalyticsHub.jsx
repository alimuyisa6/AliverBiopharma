import { lazy, Suspense, useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Card from '../Card/Card';
import Icon from '../Icon/Icon';
import Button from '../Button/Button';
const LineAreaChart = lazy(() => import('../charts/LineAreaChart'));
const DonutChart = lazy(() => import('../charts/DonutChart'));
const BarChart = lazy(() => import('../charts/BarChart'));
const RadarChart = lazy(() => import('../charts/RadarChart'));
import Skeleton from '../Skeleton/Skeleton';
import { getRecallDashboard, getRecallStats } from '../../api/cachedClient';

const GRAPH_TYPES = [
  {
    key: 'weekly_xp',
    title: 'Weekly XP Progress',
    icon: 'chart-line',
    color: 'var(--primary)',
    description: 'Track your XP earnings over the last 7 days. This shows your learning momentum and consistency.',
    insight: 'Consistent daily practice leads to steady XP growth. Aim for at least 20 XP per day to maintain your streak.'
  },
  {
    key: 'confidence',
    title: 'Confidence Distribution',
    icon: 'chart-pie',
    color: 'var(--success-color)',
    description: 'See how well you recall concepts. Excellent means perfect recall, Strong means close, Developing means needs review.',
    insight: 'A healthy mix shows you are challenging yourself. Too many "Easy" ratings may mean the questions are too simple.'
  },
  {
    key: 'topic_mastery',
    title: 'Topic Mastery Radar',
    icon: 'bullseye',
    color: 'var(--brand-navy)',
    description: 'Compare your mastery across all biology topics. Each axis represents a topic, and the shape shows your strengths.',
    insight: 'A balanced shape means well-rounded knowledge. If one side is flat, focus more on that topic.'
  },
  {
    key: 'questions_per_topic',
    title: 'Questions per Topic',
    icon: 'chart-bar',
    color: 'var(--secondary)',
    description: 'See how many questions you have answered in each topic. This shows where you spend your study time.',
    insight: 'Make sure your study time is distributed. Over-focusing on one topic may leave gaps elsewhere.'
  }
];

export default function RecallAnalyticsHub() {
  const { user } = useAuth();
  const [activeGraph, setActiveGraph] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    Promise.all([
      getRecallDashboard(),
      getRecallStats()
    ])
      .then(([dash, statsData]) => {
        setStats({
          ...dash,
          ...statsData
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  if (loading || !stats) {
    return (
      <div className="w-full min-w-0">
        <Skeleton height={200} />
      </div>
    );
  }

  const topicNames = Object.keys(stats.mastery_topics || {}).slice(0, 6);
  const topicMastery = topicNames.map((topic) => stats.mastery_topics[topic]);

  const confidenceData = [
    stats.excellent_count || 0,
    stats.strong_count || 0,
    stats.developing_count || 0
  ];

  const weeklyXp = [
    stats.daily_activity?.mon || 0,
    stats.daily_activity?.tue || 0,
    stats.daily_activity?.wed || 0,
    stats.daily_activity?.thu || 0,
    stats.daily_activity?.fri || 0,
    stats.daily_activity?.sat || 0,
    stats.daily_activity?.sun || 0
  ];

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const activeGraphData = GRAPH_TYPES.find((g) => g.key === activeGraph);
  const knowledgeGaps = stats.knowledge_gaps || null;
  const gapStatus = {
    priority: { label: 'Priority revision', className: 'border-red-200 bg-red-50 text-red-800', icon: 'alert-circle' },
    review: { label: 'Needs practice', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: 'book-open' },
    insufficient_evidence: { label: 'Keep practising', className: 'border-slate-200 bg-slate-100 text-slate-700', icon: 'chart-line' },
    on_track: { label: 'On track', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: 'circle-check' }
  };

  const renderGraph = () => {
    switch (activeGraph) {
      case 'weekly_xp':
        return (
          <LineAreaChart
            data={weeklyXp}
            labels={dayLabels}
            label="XP"
            color="var(--primary)"
            height={380}
          />
        );
      case 'confidence':
        return (
          <DonutChart
            data={confidenceData}
            labels={['Excellent', 'Strong', 'Developing']}
            colors={['var(--success-color)', 'var(--primary)', 'var(--warning-color)']}
            centerValue={`${stats.accuracy || 0}%`}
            centerLabel="Accuracy"
            height={380}
          />
        );
      case 'topic_mastery':
        return (
          <RadarChart
            data={topicMastery.length ? topicMastery : [0, 0, 0, 0, 0, 0]}
            labels={topicNames.length ? topicNames : ['Biology', 'Cells', 'Plants', 'Insects', 'Kingdoms', 'Classification']}
            label="Mastery"
            color="var(--accent-dark)"
            height={400}
          />
        );
      case 'questions_per_topic':
        return (
          <BarChart
            data={topicMastery.length ? topicMastery : [0, 0, 0, 0, 0, 0]}
            labels={topicNames.length ? topicNames : ['Biology', 'Cells', 'Plants', 'Insects', 'Kingdoms', 'Classification']}
            label="Questions"
            color="var(--secondary)"
            height={400}
            horizontal={true}
          />
        );
      default:
        return null;
    }
  };

  if (activeGraph && activeGraphData) {
    return (
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">
        <Card className="w-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="flex items-center gap-3 text-xl font-bold leading-7 text-slate-900">
                <Icon name={activeGraphData.icon} className="h-6 w-6 shrink-0 text-primary-700" />
                {activeGraphData.title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{activeGraphData.description}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setActiveGraph(null)}>
              <Icon name="arrow-left" /> Back to Graphs
            </Button>
          </div>

          <div className="min-w-0 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:p-4">
            <Suspense fallback={<div className="flex min-h-48 items-center justify-center rounded-xl bg-slate-50 p-5 text-sm text-slate-500" role="status">Loading chart…</div>}>
              {renderGraph()}
            </Suspense>
          </div>

          <div className="mt-6 flex items-start gap-3 rounded-xl border border-secondary-100 bg-secondary-50 p-4">
            <Icon name="lightbulb" className="h-5 w-5 shrink-0 text-secondary-700" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary-800">Insight</span>
              <p className="mt-1 text-sm leading-6 text-slate-700">{activeGraphData.insight}</p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <section className="mb-8 overflow-hidden rounded-3xl border border-primary-100 bg-white shadow-sm" aria-labelledby="knowledge-gap-heading">
        <div className="flex flex-col gap-4 bg-primary-950 px-5 py-6 text-white sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-secondary-400 text-primary-950 shadow-sm"><Icon name="target" size="1.5rem" /></span>
            <div>
              <h3 id="knowledge-gap-heading" className="m-0 text-xl font-extrabold text-white sm:text-2xl">Knowledge Gap Detector</h3>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-primary-100">A focused view of the {knowledgeGaps?.unit_label?.toLowerCase() || 'curriculum areas'} that need more practice, based on your recent completed quizzes and recall history.</p>
              {knowledgeGaps?.level_name && <p className="mt-2 text-xs font-semibold text-secondary-200">{knowledgeGaps.level_name}{knowledgeGaps.group_name ? ` · ${knowledgeGaps.group_label || 'Class'}: ${knowledgeGaps.group_name}` : ''}</p>}
            </div>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link to="/quiz" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary-400 px-4 py-2 text-sm font-bold text-primary-950 no-underline transition hover:bg-secondary-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Practise questions <Icon name="arrow-up-right" /></Link>
            <Link to="/recall" className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Recall practice</Link>
          </div>
        </div>

        {knowledgeGaps?.status === 'no_curriculum' ? (
          <div className="px-5 py-7 text-sm leading-6 text-slate-600 sm:px-7">Your approved learning {knowledgeGaps.group_label?.toLowerCase() || 'group'} is not available yet. Once your curriculum is assigned, this section will track your progress.</div>
        ) : !knowledgeGaps?.areas?.length ? (
          <div className="px-5 py-7 text-sm leading-6 text-slate-600 sm:px-7">No curriculum {knowledgeGaps?.unit_label?.toLowerCase() || 'areas'} are available for your current learning pathway yet.</div>
        ) : (
          <div className="p-5 sm:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
              <div><p className="m-0 text-sm font-bold text-slate-900">Your learning priorities</p><p className="m-0 mt-1 text-xs text-slate-500">Only repeated evidence is used to flag a learning gap.</p></div>
              <span className="rounded-full border border-primary-100 bg-primary-50 px-3 py-1.5 text-xs font-bold text-primary-800">{knowledgeGaps.assessed_units || 0} assessed {knowledgeGaps.unit_label?.toLowerCase() || 'areas'}</span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {knowledgeGaps.areas.slice(0, 6).map((area) => {
                const status = gapStatus[area.status] || gapStatus.insufficient_evidence;
                return (
                  <article key={area.unit_id} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 transition hover:border-primary-200 hover:bg-white hover:shadow-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="m-0 truncate text-sm font-bold text-slate-900">{area.unit_name}</p>
                      <p className="m-0 mt-1 text-xs text-slate-500">{area.quiz_attempts} quiz attempts · {area.recall_attempts} recall practices</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      {area.score !== null && <span className="text-lg font-extrabold tabular-nums text-slate-900">{Math.round(area.score)}%</span>}
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-bold ${status.className}`}><Icon name={status.icon} />{status.label}</span>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mb-0 mt-4 text-xs leading-5 text-slate-500">A priority or practice label is guidance, not a diagnosis of ability. Areas with too little completed activity remain unclassified until more evidence is available.</p>
          </div>
        )}
      </section>

      <div className="mb-6">
        <h3 className="flex items-center gap-3 text-xl font-bold leading-7 text-primary-950">
          <Icon name="chart-line" className="h-6 w-6 text-primary-700" />
          Learning Analytics
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Visualize your progress and identify areas for improvement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {GRAPH_TYPES.map((graph) => {
          const iconTone = graph.key === 'confidence' ? 'text-emerald-700' : graph.key === 'topic_mastery' ? 'text-secondary-700' : 'text-primary-700';
          return (
          <Card key={graph.key} className="h-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex h-full min-w-0 flex-col items-start gap-3">
              <Icon name={graph.icon} className={`h-7 w-7 ${iconTone}`} />
              <h4 className="text-base font-bold leading-6 text-slate-900">{graph.title}</h4>
              <p className="text-sm leading-6 text-slate-600">{graph.description}</p>
              <Button variant="ghost" size="sm" className="mt-auto inline-flex min-h-9 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-primary-700 hover:bg-primary-50" onClick={() => setActiveGraph(graph.key)}>
                View Graph <Icon name="arrow-right" />
              </Button>
            </div>
          </Card>
          );
        })}
      </div>
    </div>
  );
} 
