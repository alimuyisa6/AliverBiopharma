import { useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import ChartSegmentedControl from './ChartSegmentedControl';
import ChartExportButton from './ChartExportButton';
import ChartTooltip from './ChartTooltip';
import useChartTheme from './useChartTheme';

function Frame({ children, height = 260, summary }) {
  return <><div className="ch-chart-frame" style={{ height }}>{children}</div><span className="ch-sr-only">{summary}</span></>;
}

function ActivityBars({ data = [] }) {
  const theme = useChartTheme();
  return <Frame summary="Daily learning activity chart.">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
        <CartesianGrid vertical={false} stroke={theme.subtleBorder} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} stroke={theme.muted} />
        <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke={theme.muted} />
        <Tooltip content={<ChartTooltip />} />
        <Bar dataKey="value" name="Activity" fill={theme.series[1]} radius={[7, 7, 2, 2]} />
      </BarChart>
    </ResponsiveContainer>
  </Frame>;
}

export function TotalLearningActivity({ data = [], embedded = false }) {
  const theme = useChartTheme();
  return <ChartCard embedded={embedded} title="Total learning activity" subtitle="Recent activity from your learning dashboard." action={<ChartExportButton data={data} filename="learning-activity" />}>
    <ActivityBars data={data} />
    <div className="ch-stat-box"><div className="ch-stat-cell"><p className="ch-stat-label">Activity</p><p className="ch-stat-value">{data.reduce((s, x) => s + Number(x.value || 0), 0)}</p></div><div className="ch-stat-cell"><p className="ch-stat-label">Period</p><p className="ch-stat-value">{data.length} days</p></div></div>
  </ChartCard>;
}

export function ActivityDistribution({ data = [], embedded = false }) {
  const theme = useChartTheme();
  const buckets = [
    { label: '0 sessions', min: 0, max: 0, days: 0 },
    { label: '1 session', min: 1, max: 1, days: 0 },
    { label: '2 sessions', min: 2, max: 2, days: 0 },
    { label: '3+ sessions', min: 3, max: Infinity, days: 0 }
  ];
  data.forEach((item) => {
    const count = Math.max(0, Number(item.value) || 0);
    const bucket = buckets.find((entry) => count >= entry.min && count <= entry.max);
    if (bucket) bucket.days += 1;
  });
  return <ChartCard embedded={embedded} title="Daily activity distribution" subtitle="How often different session counts occurred during this period." action={<ChartExportButton data={buckets.map(({ label, days }) => ({ label, days }))} filename="daily-activity-distribution" />}>
    <Frame summary="Histogram-style frequency chart grouping days by their recorded learning-session counts.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={buckets} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.subtleBorder} strokeDasharray="3 3" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} stroke={theme.muted} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke={theme.muted} label={{ value: 'Days', angle: -90, position: 'insideLeft', fill: theme.muted }} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="days" name="Days" fill={theme.series[0]} radius={[7, 7, 2, 2]} />
        </BarChart>
      </ResponsiveContainer>
    </Frame>
    <p className="dashboard-graph-guide">This frequency chart groups days by the number of sessions recorded. Taller bars mean more days had that activity level. Use it to see whether your routine is consistent or mostly made up of low-activity days.</p>
  </ChartCard>;
}

export function LearningTrend({ data = [] }) {
  const theme = useChartTheme();
  return <ChartCard title="Learning trend" subtitle="How your recent study activity is moving.">
    <Frame summary="Learning activity trend.">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}><XAxis dataKey="label" hide /><YAxis hide /><Tooltip content={<ChartTooltip />} /><Line type="monotone" dataKey="value" stroke={theme.series[1]} strokeWidth={3} dot={{ r: 4, fill: theme.surface, stroke: theme.series[1], strokeWidth: 2 }} /></LineChart>
      </ResponsiveContainer>
    </Frame>
  </ChartCard>;
}

export function MasteryDonut({ data = [], embedded = false }) {
  const theme = useChartTheme();
  return <ChartCard embedded={embedded} title="Mastery by learning unit" subtitle="Assessed mastery scores for your curriculum units.">
    <Frame height={Math.max(240, data.length * 42)} summary="Horizontal bar chart comparing assessed mastery percentages by learning unit.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={theme.subtleBorder} strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 100]} tickLine={false} axisLine={false} stroke={theme.muted} tickFormatter={(value) => value + '%'} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} stroke={theme.muted} width={120} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="Mastery" fill={theme.series[1]} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  </ChartCard>;
}

export function XpBars({ data = [], embedded = false }) {
  const theme = useChartTheme();
  return <ChartCard embedded={embedded} title="XP by learning unit" subtitle="Experience points earned across your active learning units.">
    <Frame summary="Horizontal bar chart comparing experience points earned by learning unit.">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 12, bottom: 4, left: 8 }}>
          <CartesianGrid horizontal={false} stroke={theme.subtleBorder} strokeDasharray="3 3" />
          <XAxis type="number" tickLine={false} axisLine={false} stroke={theme.muted} allowDecimals={false} />
          <YAxis type="category" dataKey="label" tickLine={false} axisLine={false} stroke={theme.muted} width={120} />
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name="XP" fill={theme.series[0]} radius={[0, 8, 8, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Frame>
  </ChartCard>;
}

export function PerformanceOverview({ mastery = [], activity = [] }) {
  const [period, setPeriod] = useState('7D');
  const controls = [{ value: '7D', label: '7D' }, { value: '30D', label: '30D' }];
  return <ChartCard title="Performance overview" subtitle="Dashboard assessment and activity view." action={<ChartSegmentedControl options={controls} value={period} onChange={setPeriod} />}>
    <LearningTrend data={period === '7D' ? activity.slice(-7) : activity.slice(-30)} />
    {mastery.length > 0 && <MasteryDonut data={mastery} />}
  </ChartCard>;
}
