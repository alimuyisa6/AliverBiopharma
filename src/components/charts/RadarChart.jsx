import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart as RechartsRadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartCard from './ChartCard';
import useChartTheme from './useChartTheme';

export default function RadarChart({ data = [], labels = [], label = 'Mastery', title, subtitle, height = 320 }) {
  const theme = useChartTheme();
  const rows = data.map((value, index) => ({ label: labels[index] || String(index + 1), value: Number(value) || 0 }));
  const chart = (
    <div className="ch-chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsRadarChart data={rows} outerRadius="72%">
          <PolarGrid stroke={theme.subtleBorder} />
          <PolarAngleAxis dataKey="label" tick={{ fill: theme.muted, fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Tooltip />
          <Radar dataKey="value" name={label} stroke={theme.series[1]} fill={theme.series[1]} fillOpacity={0.14} />
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  );
  return title ? <ChartCard title={title} subtitle={subtitle} summary={label + ' radar across ' + rows.length + ' areas.'}>{chart}</ChartCard> : chart;
}
