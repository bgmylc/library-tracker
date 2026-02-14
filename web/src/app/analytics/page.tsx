"use client";

import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";
import { GlassCard, MetricTile, ProgressBar } from "@/components/ui/figma";

type Dashboard = {
  kpis: Record<string, number>;
  by_genre: { label: string; value: number }[];
  top_authors: { label: string; value: number }[];
  by_status: { label: string; value: number }[];
};

function ListBars({ title, data }: { title: string; data: { label: string; value: number }[] }) {
  const max = Math.max(1, ...data.map((x) => x.value));
  return (
    <GlassCard>
      <h3 className="fgSectionTitle">{title}</h3>
      <div className="fgStack">
        {data.slice(0, 6).map((x) => (
          <div className="fgBarRow" key={x.label}>
            <div>
              <p>{x.label}</p>
              <ProgressBar value={Math.round((x.value / max) * 100)} />
            </div>
            <strong>{x.value}</strong>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJson<Dashboard>("/api/dashboard")
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  return (
    <div className="fgScreen">
      <header className="fgHeader">
        <h2>Analytics</h2>
        <p>Track your reading journey</p>
      </header>

      <div className="fgGrid fgGrid-4">
        <MetricTile label="Books Read" value={dashboard?.kpis.finished_books ?? "-"} variant="violet" />
        <MetricTile label="Currently Reading" value={dashboard?.kpis.reading_books ?? "-"} variant="sky" />
        <MetricTile label="Pages Read" value={dashboard?.kpis.total_pages_read ?? "-"} variant="coral" />
        <MetricTile label="Avg. Rating" value={dashboard?.kpis.avg_rating ?? "-"} variant="magenta" />
      </div>

      {dashboard ? (
        <div className="fgGrid fgGrid-2">
          <ListBars title="Status Distribution" data={dashboard.by_status} />
          <ListBars title="Genre Distribution" data={dashboard.by_genre} />
          <ListBars title="Top Authors" data={dashboard.top_authors} />
          <GlassCard variant="violet">
            <h3 className="fgSectionTitle">Reading Goal</h3>
            <p className="fgGoalText">{dashboard.kpis.finished_books}/50</p>
            <ProgressBar value={Math.min(100, Math.round((dashboard.kpis.finished_books / 50) * 100))} />
          </GlassCard>
        </div>
      ) : (
        <GlassCard><p className="fgMuted">Loading insights...</p></GlassCard>
      )}

      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}
