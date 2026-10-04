import { useEffect, useMemo, useState } from 'react';
import { getUserDashboard } from '../../api/cachedClient';
import ChartCard from './ChartCard';
import LineAreaChart from './LineAreaChart';
import BarChart from './BarChart';
import RadarChart from './RadarChart';
import './charts.css';

const CONFIG = {
  notes: { title: 'Learning progress', subtitle: 'Your recent activity from the main learning dashboard.' },
  quiz: { title: 'Quiz performance', subtitle: 'Your assessed performance from the main learning dashboard.' },
  recall: { title: 'Recall performance', subtitle: 'Your Recall activity and mastery from the main learning dashboard.' },
  flashcards: { title: 'Study activity', subtitle: 'Your learning activity from the main learning dashboard.' },
  pastPapers: { title: 'Assessment activity', subtitle: 'Your assessed learning activity from the main learning dashboard.' },
  resources: { title: 'Learning activity', subtitle: 'Your learning activity from the main learning dashboard.' },
  classroom: { title: 'Learning momentum', subtitle: 'Your activity context from the main learning dashboard.' }
};

export default function ContentAnalytics({ variant = 'resources' }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const config = CONFIG[variant] || CONFIG.resources;

  useEffect(() => {
    let mounted = true;
    getUserDashboard().then((data) => {
      if (mounted) setSummary(data);
    }).catch(() => {
      if (mounted) setSummary(null);
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, []);

  const heatmap = useMemo(() => {
    const rows = Array.isArray(summary?.analytics?.heatmap) ? summary.analytics.heatmap : [];
    return rows.slice(-7);
  }, [summary]);

  const mastery = useMemo(() => {
    const rows = Array.isArray(summary?.analytics?.mastery_map) ? summary.analytics.mastery_map : [];
    return rows.filter((item) => item?.assessed).slice(0, 6);
  }, [summary]);

  const xp = useMemo(() => {
    const rows = Array.isArray(summary?.unit_xp) ? summary.unit_xp : [];
    return rows.slice(0, 6);
  }, [summary]);

  if (loading) return <ChartCard title={config.title} subtitle={config.subtitle} loading />;
  if (!summary) return null;

  if (variant === 'recall') {
    const topics = Object.entries(summary.recall?.mastery_topics || {}).slice(0, 6);
    return (
      <div className="ch-shell">
        <ChartCard title={config.title} subtitle={config.subtitle}>
          {topics.length > 2
            ? <RadarChart data={topics.map(([, value]) => value)} labels={topics.map(([name]) => name)} label="Mastery" height={300} />
            : <LineAreaChart data={heatmap.map((item) => item.count)} labels={heatmap.map((item) => item.activity_date)} label="Activities" height={250} />}
        </ChartCard>
      </div>
    );
  }

  if (variant === 'quiz' || variant === 'pastPapers') {
    return (
      <div className="ch-shell">
        <ChartCard title={config.title} subtitle={config.subtitle} summary={'Recent pass rate: ' + (summary.quiz?.recent_pass_rate ?? 0) + '%.'}>
          <BarChart data={mastery.map((item) => item.mastery)} labels={mastery.map((item) => item.unit_name)} label="Mastery" height={250} horizontal />
        </ChartCard>
      </div>
    );
  }

  if (variant === 'flashcards') {
    return (
      <div className="ch-shell">
        <ChartCard title={config.title} subtitle={config.subtitle}>
          <BarChart data={xp.map((item) => item.xp)} labels={xp.map((item) => item.unit_name)} label="XP" height={250} />
        </ChartCard>
      </div>
    );
  }

  return (
    <div className="ch-shell">
      <ChartCard title={config.title} subtitle={config.subtitle}>
        <LineAreaChart data={heatmap.map((item) => item.count)} labels={heatmap.map((item) => item.activity_date)} label="Activities" height={250} />
      </ChartCard>
    </div>
  );
}
