"use client";

import { useEffect, useMemo, useState } from "react";

type Dashboard = {
  kpis: Record<string, number>;
  by_genre: { label: string; value: number }[];
  top_authors: { label: string; value: number }[];
  by_status: { label: string; value: number }[];
  top_subgenres: { label: string; value: number }[];
  pages_by_status: { label: string; value: number }[];
  completed_by_year: { label: number; value: number }[];
  ownership_split: { label: string; value: number }[];
  nonfiction_split: { label: string; value: number }[];
  top_publishers: { label: string; value: number }[];
};

function BarList({ data, valueFormatter }: { data: { label: string | number; value: number }[]; valueFormatter?: (v: number) => string | number }) {
  const max = useMemo(() => Math.max(1, ...data.map((x) => Number(x.value || 0))), [data]);
  if (!data.length) return <div className="meta">No data</div>;

  return (
    <div className="bars">
      {data.map((d) => {
        const pct = Math.max(2, Math.round((Number(d.value || 0) / max) * 100));
        return (
          <div key={String(d.label)} className="barRow">
            <div>
              <div className="barLabel">{String(d.label)}</div>
              <div className="bar" style={{ width: `${pct}%` }} />
            </div>
            <strong>{valueFormatter ? valueFormatter(Number(d.value || 0)) : d.value}</strong>
          </div>
        );
      })}
    </div>
  );
}

export default function AnalyticsPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");

  async function fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data as T;
  }

  useEffect(() => {
    fetchJson<Dashboard>("/api/dashboard")
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load dashboard"));
  }, []);

  const finishedCount = dashboard?.kpis.finished_books || 0;
  const readingCount = dashboard?.kpis.reading_books || 0;
  const readPct = dashboard?.kpis.read_ratio || 0;

  return (
    <section id="dashboard" className="panel">
      <div className="sectionHead">
        <h2>Reading Overview</h2>
        <p className="meta">{finishedCount} finished, {readingCount} active, {readPct}% completion ratio</p>
      </div>

      {!dashboard ? (
        <p className="meta">Loading...</p>
      ) : (
        <>
          <div className="kpis">
            {[
              ["Total", dashboard.kpis.total_books, "neutral"],
              ["Finished", dashboard.kpis.finished_books, "good"],
              ["Reading", dashboard.kpis.reading_books, "info"],
              ["Paused", dashboard.kpis.paused_books, "warn"],
              ["DNF", dashboard.kpis.dnf_books, "danger"],
              ["Not Started", dashboard.kpis.not_started_books, "neutral"],
              ["Read %", `${dashboard.kpis.read_ratio}%`, "good"],
              ["Avg Pages", dashboard.kpis.avg_pages, "neutral"],
            ].map(([k, v, tone]) => (
              <div className={`kpi kpi${tone}`} key={String(k)}>
                <div className="kpiLabel">{k}</div>
                <div className="kpiValue">{String(v)}</div>
              </div>
            ))}
          </div>

          <div className="charts">
            <article className="chartCard"><h3>Status Distribution</h3><BarList data={dashboard.by_status} /></article>
            <article className="chartCard"><h3>Completion by Purchase Year</h3><BarList data={dashboard.completed_by_year} valueFormatter={(v) => `${v}%`} /></article>
            <article className="chartCard"><h3>Top Genres</h3><BarList data={dashboard.by_genre} /></article>
            <article className="chartCard"><h3>Top Subgenres</h3><BarList data={dashboard.top_subgenres} /></article>
            <article className="chartCard"><h3>Top Authors</h3><BarList data={dashboard.top_authors} /></article>
            <article className="chartCard"><h3>Top Publishers</h3><BarList data={dashboard.top_publishers} /></article>
            <article className="chartCard"><h3>Pages by Status</h3><BarList data={dashboard.pages_by_status} /></article>
            <article className="chartCard"><h3>Owned vs Not Owned</h3><BarList data={dashboard.ownership_split} /></article>
            <article className="chartCard"><h3>Fiction vs Nonfiction</h3><BarList data={dashboard.nonfiction_split} /></article>
          </div>
        </>
      )}

      {error ? <p className="meta">Error: {error}</p> : null}
    </section>
  );
}
