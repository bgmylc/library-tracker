"use client";

import { useMemo, useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";
import { ProgressBar } from "@/components/ui/figma";

type Item = { label: string | number; value: number };

type Dashboard = {
  kpis: Record<string, number>;
  by_genre: Item[];
  top_authors: Item[];
  by_status: Item[];
  completed_by_year: Item[];
  pages_by_status: Item[];
};

function formatNumber(v: number | undefined) {
  if (!Number.isFinite(v || 0)) return "0";
  return Number(v).toLocaleString();
}

function MiniTrend({ value, positive = true }: { value: string; positive?: boolean }) {
  return <span className={`fgTrend ${positive ? "isUp" : "isDown"}`}>{positive ? "↑" : "↓"} {value}</span>;
}

function SimpleBars({ data }: { data: Item[] }) {
  const usable = data.slice(0, 8);
  const max = Math.max(1, ...usable.map((x) => Number(x.value || 0)));
  return (
    <div className="fgSimpleBars">
      {usable.map((d) => (
        <div key={String(d.label)} className="fgSimpleBarItem">
          <div className="fgSimpleBar" style={{ height: `${Math.max(20, (Number(d.value || 0) / max) * 180)}px` }} />
          <span>{String(d.label)}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleLine({ data }: { data: Item[] }) {
  const usable = data.slice(0, 7);
  const max = Math.max(1, ...usable.map((x) => Number(x.value || 0)));
  const points = usable.map((d, i) => {
    const x = (i / Math.max(1, usable.length - 1)) * 100;
    const y = 100 - (Number(d.value || 0) / max) * 70 - 10;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="fgSimpleLineWrap">
      <svg viewBox="0 0 100 100" className="fgSimpleLine" preserveAspectRatio="none">
        <polyline points={points} fill="none" stroke="currentColor" strokeWidth="1.2" />
        {usable.map((d, i) => {
          const x = (i / Math.max(1, usable.length - 1)) * 100;
          const y = 100 - (Number(d.value || 0) / max) * 70 - 10;
          return <circle key={String(d.label)} cx={x} cy={y} r="1.4" />;
        })}
      </svg>
      <div className="fgSimpleLineLabels">
        {usable.map((d) => <span key={String(d.label)}>{String(d.label)}</span>)}
      </div>
    </div>
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

  const pagesRead = useMemo(() => {
    if (!dashboard?.pages_by_status?.length) return 0;
    return Math.round(dashboard.pages_by_status.reduce((acc, x) => acc + Number(x.value || 0), 0));
  }, [dashboard]);

  return (
    <div className="fgScreen">
      <section className="fgPanel">
        <header className="fgHeader">
          <h2>Analytics</h2>
          <p>Track your reading journey</p>
        </header>

        <div className="fgMetricRow">
          <article className="fgMetricCard isViolet"><p>Books Read</p><strong>{dashboard?.kpis.finished_books ?? 0}</strong><MiniTrend value="+12%" positive /></article>
          <article className="fgMetricCard isSky"><p>Currently Reading</p><strong>{dashboard?.kpis.reading_books ?? 0}</strong></article>
          <article className="fgMetricCard isCoral"><p>Pages Read</p><strong>{formatNumber(pagesRead)}</strong><MiniTrend value="+890" positive /></article>
          <article className="fgMetricCard isMagenta"><p>Avg. Rating</p><strong>{dashboard?.kpis.avg_rating ?? 4.2}</strong><MiniTrend value="-0.1" positive={false} /></article>
        </div>

        <section className="fgChartCard">
          <h3>Reading Progress</h3>
          <p>Books completed by period</p>
          {dashboard ? <SimpleBars data={dashboard.completed_by_year?.length ? dashboard.completed_by_year : dashboard.by_status} /> : <p className="fgMuted">Loading...</p>}
        </section>

        <section className="fgChartCard">
          <h3>This Week&apos;s Reading</h3>
          <p>Daily pages read</p>
          {dashboard ? <SimpleLine data={dashboard.pages_by_status?.length ? dashboard.pages_by_status : dashboard.by_status} /> : <p className="fgMuted">Loading...</p>}
        </section>

        <div className="fgGrid fgGrid-2">
          <section className="fgChartCard">
            <h3>Top Authors</h3>
            <div className="fgStack">
              {(dashboard?.top_authors || []).slice(0, 5).map((a) => (
                <div key={String(a.label)} className="fgAuthorRow">
                  <div className="fgAuthorBadge">{String(a.label).charAt(0)}</div>
                  <strong>{String(a.label)}</strong>
                  <span>{a.value} books</span>
                </div>
              ))}
            </div>
          </section>
          <section className="fgChartCard">
            <h3>Reading Time</h3>
            <div className="fgStack">
              <div>
                <div className="fgSplit"><span>Average per day</span><strong>42 min</strong></div>
                <ProgressBar value={70} />
              </div>
              <div>
                <div className="fgSplit"><span>Total this week</span><strong>5h 14m</strong></div>
                <ProgressBar value={85} />
              </div>
              <div className="fgReadingWindow">Favorite reading time: <strong>8-10 PM</strong></div>
            </div>
          </section>
        </div>
      </section>

      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}
