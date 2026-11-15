import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartCard from './ChartCard';
import ChartTooltip from './ChartTooltip';
import useChartTheme from './useChartTheme';

function toDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 10);
}

export default function DualAreaTrend({ activities = [], days = 7, embedded = false }) {
  const theme = useChartTheme();
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - Math.max(1, days - 1));
  const rowsByDate = new Map();

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + offset);
    const key = toDateKey(date);
    rowsByDate.set(key, {
      date: key,
      label: date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      quizzes: 0,
      recall: 0
    });
  }

  activities.forEach((activity) => {
    const key = toDateKey(activity.date);
    const row = rowsByDate.get(key);
    if (!row) return;
    if (activity.type === 'quiz') row.quizzes += 1;
    if (activity.type === 'recall') row.recall += 1;
  });

  const data = Array.from(rowsByDate.values());
  const chart = (
    <div className="ch-chart-frame dashboard-dual-area-frame" style={{ height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 12, bottom: 4, left: -12 }}>
          <defs>
            <linearGradient id="dashboardQuizArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.series[0]} stopOpacity={0.3} />
              <stop offset="95%" stopColor={theme.series[0]} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="dashboardRecallArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={theme.series[1]} stopOpacity={0.28} />
              <stop offset="95%" stopColor={theme.series[1]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={theme.subtleBorder} strokeDasharray="4 5" />
          <XAxis dataKey="label" tickLine={false} axisLine={false} stroke={theme.muted} minTickGap={12} />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} stroke={theme.muted} width={28} />
          <Tooltip content={<ChartTooltip />} />
          <Legend verticalAlign="top" align="center" iconType="circle" />
          <Area type="monotone" dataKey="quizzes" name="Quiz activity" stroke={theme.series[0]} strokeWidth={2.8} fill="url(#dashboardQuizArea)" activeDot={{ r: 5 }} dot={{ r: 3, fill: theme.surface, strokeWidth: 2 }} />
          <Area type="monotone" dataKey="recall" name="Recall activity" stroke={theme.series[1]} strokeWidth={2.8} fill="url(#dashboardRecallArea)" activeDot={{ r: 5 }} dot={{ r: 3, fill: theme.surface, strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );

  return (
    <ChartCard embedded={embedded} title="Learning activity trends" subtitle="Compare quiz practice and BioRecall sessions across the selected period." summary="Dual area chart comparing daily quiz activity with daily recall activity.">
      {chart}
    </ChartCard>
  );
}
