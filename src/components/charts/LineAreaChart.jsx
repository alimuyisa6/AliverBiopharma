import { LineChart, Line, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartCard from './ChartCard';
import useChartTheme from './useChartTheme';

export default function LineAreaChart({ data = [], labels = [], label = 'Value', title, subtitle, height = 280 }) {
  const theme = useChartTheme();
  const rows = data.map((value, index) => ({ label: labels[index] || String(index + 1), value: Number(value) || 0 }));
  const chart = (
    <div className="ch-chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid vertical={false} stroke={theme.subtleBorder} strokeDasharray="3 3" />
          <XAxis dataKey="label" stroke={theme.muted} tickLine={false} axisLine={false} />
          <YAxis stroke={theme.muted} tickLine={false} axisLine={false} allowDecimals={false} />
          <Tooltip content={<ChartTooltip />} />
          <Line type="monotone" dataKey="value" name={label} stroke={theme.series[1]} strokeWidth={2.5} dot={{ r: 4, fill: theme.surface, stroke: theme.series[1], strokeWidth: 2 }} activeDot={{ r: 5 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
  return title ? <ChartCard title={title} subtitle={subtitle} summary={label + ' trend with ' + rows.length + ' data points.'}>{chart}</ChartCard> : chart;
}
