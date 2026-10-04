import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import ChartTooltip from './ChartTooltip';
import ChartCard from './ChartCard';
import useChartTheme from './useChartTheme';

export default function DonutChart({ data = [], labels = [], title, subtitle, centerValue = '', centerLabel = '', height = 280 }) {
  const theme = useChartTheme();
  const rows = data.map((value, index) => ({ label: labels[index] || String(index + 1), value: Number(value) || 0 }));
  const chart = (
    <div className="ch-chart-frame" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={rows} dataKey="value" nameKey="label" innerRadius="64%" outerRadius="82%" paddingAngle={2} stroke="none">
            {rows.map((row, index) => <Cell key={row.label} fill={theme.series[index % theme.series.length]} />)}
          </Pie>
          <Tooltip content={<ChartTooltip />} />
          {centerValue && <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" fill={theme.main} fontSize="20" fontWeight="700">{centerValue}</text>}
          {centerLabel && <text x="50%" y="57%" textAnchor="middle" dominantBaseline="middle" fill={theme.muted} fontSize="11">{centerLabel}</text>}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
  return title ? <ChartCard title={title} subtitle={subtitle} summary={'Composition chart with ' + rows.length + ' segments.'}>{chart}</ChartCard> : chart;
}
