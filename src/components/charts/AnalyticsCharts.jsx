import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import ChartSelect from './ChartSelect';
import ChartSegmentedControl from './ChartSegmentedControl';
import ChartBadge from './ChartBadge';
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

export function TotalLearningActivity({ data = [] }) {
  const theme = useChartTheme();
  return <ChartCard title="Total learning activity" subtitle="Recent activity from your learning dashboard." action={<ChartExportButton data={data} filename="learning-activity" />}>
    <ActivityBars data={data} />
    <div className="ch-stat-box"><div className="ch-stat-cell"><p className="ch-stat-label">Activity</p><p className="ch-stat-value">{data.reduce((s, x) => s + Number(x.value || 0), 0)}</p></div><div className="ch-stat-cell"><p className="ch-stat-label">Period</p><p className="ch-stat-value">{data.length} days</p></div></div>
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

export function MasteryDonut({ data = [] }) {
  const theme = useChartTheme();
  const total = data.reduce((s, x) => s + Number(x.value || 0), 0);
  return <ChartCard title="Mastery distribution" subtitle="Your assessed learning areas.">
    <Frame height={280} summary="Mastery distribution by learning unit.">
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="label" innerRadius="62%" outerRadius="82%" stroke="none">{data.map((x, i) => <Cell key={x.label} fill={theme.series[i % theme.series.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /><text x="50%" y="47%" textAnchor="middle" fill={theme.main} fontSize="22" fontWeight="700">{Math.round(total / Math.max(data.length, 1))}%</text><text x="50%" y="57%" textAnchor="middle" fill={theme.muted} fontSize="11">Average</text></PieChart></ResponsiveContainer>
    </Frame>
    <div className="ch-chart-legend">{data.map((x, i) => <span className="ch-legend-item" key={x.label}><span className={'ch-legend-dot ch-legend-dot--' + ((i % 5) + 1)} />{x.label}</span>)}</div>
  </ChartCard>;
}

export function XpBars({ data = [] }) {
  return <ChartCard title="XP by learning unit" subtitle="Experience earned across your active units."><Frame summary="XP earned by learning unit."><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><XAxis dataKey="label" tickLine={false} axisLine={false} stroke="var(--text-muted)" /><YAxis tickLine={false} axisLine={false} stroke="var(--text-muted)" /><Tooltip content={<ChartTooltip />} /><Bar dataKey="value" name="XP" fill="var(--ch-1)" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></Frame></ChartCard>;
}

export function PerformanceOverview({ mastery = [], activity = [] }) {
  const [period, setPeriod] = useState('7D');
  const controls = [{ value: '7D', label: '7D' }, { value: '30D', label: '30D' }];
  return <ChartCard title="Performance overview" subtitle="Dashboard assessment and activity view." action={<ChartSegmentedControl options={controls} value={period} onChange={setPeriod} />}>
    <LearningTrend data={period === '7D' ? activity.slice(-7) : activity.slice(-30)} />
    {mastery.length > 0 && <MasteryDonut data={mastery} />}
  </ChartCard>;
}
