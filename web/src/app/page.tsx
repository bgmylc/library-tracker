"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/http";
import { GlassCard, ProgressBar } from "@/components/ui/figma";

type Dashboard = {
  kpis: Record<string, number>;
};

type Book = { id: number; title: string; author: string | null; status: string };

export default function HomePage() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [current, setCurrent] = useState<Book[]>([]);

  useEffect(() => {
    fetchJson<Dashboard>("/api/dashboard").then(setDash).catch(() => {});
    fetchJson<{ items: Book[] }>("/api/books?status=Reading&page_size=2&sort=title&order=asc").then((d) => setCurrent(d.items)).catch(() => {});
  }, []);

  const goalValue = dash?.kpis.finished_books ?? 0;
  const goalTarget = 50;
  const goalPct = Math.max(0, Math.min(100, Math.round((goalValue / goalTarget) * 100)));
  const thisMonth = useMemo(() => (dash ? Math.max(0, Math.round((dash.kpis.finished_books || 0) / 12)) : 0), [dash]);

  return (
    <div className="fgScreen fgHomeScreen">
      <div className="fgPanel">
        <header className="fgHeader fgHomeHeader">
          <h2>Good morning, Alex</h2>
          <p>Continue your reading journey</p>
        </header>

        <div className="fgMetricRow">
          <article className="fgMetricCard isSky"><p>Reading</p><strong>{dash?.kpis.reading_books ?? 0}</strong></article>
          <article className="fgMetricCard isViolet"><p>This Month</p><strong>{thisMonth}</strong></article>
          <article className="fgMetricCard isCoral"><p>This Year</p><strong>{dash?.kpis.finished_books ?? 0}</strong></article>
          <article className="fgMetricCard isMagenta"><p>Total</p><strong>{dash?.kpis.total_books ?? 0}</strong></article>
        </div>

        <GlassCard className="fgHomeReadingCard">
          <h3>Currently Reading</h3>
          <div className="fgStack">
            {current.length === 0 ? <p className="fgMuted">No active book.</p> : null}
            {current.map((b, i) => {
              const progress = i === 0 ? 45 : 72;
              return (
                <article key={b.id} className="fgReadingRow">
                  <div className={`fgMiniCover cover-${i % 2 === 0 ? "sky" : "violet"}`} />
                  <div>
                    <h4>{b.title}</h4>
                    <p>{b.author || "Unknown author"}</p>
                    <div className="fgInlineProgress">
                      <ProgressBar value={progress} />
                      <span>{progress}%</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </GlassCard>

        <div className="fgHomeActions">
          <Link href="/add" className="fgBtn fgBtn-primary fgFull">+ Add Book</Link>
          <Link href="/library" className="fgBtn fgBtn-ghost fgFull">Browse Library</Link>
        </div>

        <section className="fgGoalCard">
          <div>
            <h3>2026 Reading Goal</h3>
            <p>{Math.max(0, goalTarget - goalValue)} books to go!</p>
          </div>
          <strong>{goalValue}/{goalTarget}</strong>
          <div className="fgGoalProgress"><ProgressBar value={goalPct} /></div>
        </section>
      </div>
    </div>
  );
}
