import { BarChart as RechartsBarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartCard from './ChartCard';
import useChartTheme from './useChartTheme';

export default function BarChart({ data = [], labels = [], label = 'Value', title, subtitle, height = 280, horizontal = false }) {
  const theme = useChartTheme();
  const rows = data.map((value, index) => ({ label: labels[index] || String(index + 1), value: Number(value) || 0 }));
  const chart = (
    <div className="ch-chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart data={rows} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 8, bottom: 8, left: horizontal ? 8 : 0 }}>
          <CartesianGrid vertical={!horizontal} horizontal={horizontal} stroke={theme.subtleBorder} strokeDasharray="3 3" />
          {horizontal ? <><XAxis type="number" stroke={theme.muted} tickLine={false} axisLine={false} /><YAxis type="category" dataKey="label" width={90} stroke={theme.muted} tickLine={false} axisLine={false} /></> : <><XAxis dataKey="label" stroke={theme.muted} tickLine={false} axisLine={false} /><YAxis stroke={theme.muted} tickLine={false} axisLine={false} allowDecimals={false} /></>}
          <Tooltip content={<ChartTooltip />} />
          <Bar dataKey="value" name={label} fill={theme.series[1]} radius={horizontal ? [0, 8, 8, 0] : [8, 8, 0, 0]} />
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
  return title ? <ChartCard title={title} subtitle={subtitle} summary={label + ' chart with ' + rows.length + ' data points.'}>{chart}</ChartCard> : chart;
}
