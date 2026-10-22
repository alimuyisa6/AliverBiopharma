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
    const flashcards = summary.flashcards || {};
    const sessions = Array.isArray(flashcards.recent_sessions) ? flashcards.recent_sessions : [];
    return (
      <div className="ch-shell">
        <ChartCard title="Flashcard practice" subtitle="Cards seen in your latest completed flashcard sessions." summary={`${flashcards.session_count || 0} completed sessions, ${flashcards.cards_seen || 0} cards seen, and ${flashcards.accuracy || 0}% accuracy.`}>
          {sessions.length > 0
            ? <BarChart data={sessions.map((item) => item.cards_seen)} labels={sessions.map((item) => item.date ? new Date(item.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'Session')} label="Cards seen" height={250} />
            : <p className="dashboard-section-intro">Complete a flashcard session to start seeing your practice history here.</p>}
          <p className="dashboard-graph-guide">Each bar represents one completed session; taller bars mean you reviewed more cards. Use the accuracy summary to check how well you're recalling the material, not just how many cards you opened.</p>
        </ChartCard>
      </div>
    );
  }

  if (variant === 'notes') {
    const reading = summary.notes?.reading_analytics || {};
    const progress = Array.isArray(reading.recent_progress) ? reading.recent_progress : [];
    return (
      <div className="ch-shell">
        <ChartCard title="Notes reading progress" subtitle="Latest saved progress for notes in your active curriculum." summary={`${reading.notes_started || 0} notes started, ${reading.notes_completed || 0} completed, ${reading.average_progress || 0}% average progress.`}>
          {progress.length > 0
            ? <BarChart data={progress.map((item) => item.progress_percentage)} labels={progress.map((item) => item.title || 'Study note')} label="Progress (%)" height={250} horizontal />
            : <p className="dashboard-section-intro">Open a study note and your saved reading progress will appear here.</p>}
          <p className="dashboard-graph-guide">Each bar shows your latest saved progress for one note. Longer bars indicate notes closer to completion; resume a partially read note to continue from where you left off.</p>
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
