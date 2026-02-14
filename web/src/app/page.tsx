"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchJson } from "@/lib/http";
import { GlassCard, MetricTile, ProgressBar } from "@/components/ui/figma";

type Dashboard = {
  kpis: Record<string, number>;
  by_status: { label: string; value: number }[];
};

type Book = { id: number; title: string; author: string | null; status: string };

export default function HomePage() {
  const [dash, setDash] = useState<Dashboard | null>(null);
  const [current, setCurrent] = useState<Book[]>([]);

  useEffect(() => {
    fetchJson<Dashboard>("/api/dashboard").then(setDash).catch(() => {});
    fetchJson<{ items: Book[] }>("/api/books?status=Reading&page_size=2&sort=title&order=asc").then((d) => setCurrent(d.items)).catch(() => {});
  }, []);

  return (
    <div className="fgScreen">
      <header className="fgHeader">
        <h2>Good morning</h2>
        <p>Continue your reading journey</p>
      </header>

      <div className="fgGrid fgGrid-4">
        <MetricTile label="Reading" value={dash?.kpis.reading_books ?? "-"} variant="sky" />
        <MetricTile label="This Year" value={dash?.kpis.finished_books ?? "-"} variant="violet" />
        <MetricTile label="Total" value={dash?.kpis.total_books ?? "-"} variant="coral" />
        <MetricTile label="Read %" value={dash ? `${dash.kpis.read_ratio}%` : "-"} variant="magenta" />
      </div>

      <GlassCard>
        <h3 className="fgSectionTitle">Currently Reading</h3>
        <div className="fgStack">
          {current.length === 0 ? <p className="fgMuted">No active book.</p> : null}
          {current.map((b, i) => (
            <div className="fgCurrentRow" key={b.id}>
              <div className={`fgMiniCover cover-${i % 2 === 0 ? "sky" : "violet"}`} />
              <div>
                <h4>{b.title}</h4>
                <p>{b.author || "Unknown author"}</p>
                <ProgressBar value={40 + i * 20} />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      <div className="fgGrid fgGrid-2">
        <Link href="/add" className="fgBtn fgBtn-primary fgFull">Add Book</Link>
        <Link href="/library" className="fgBtn fgBtn-ghost fgFull">Browse Library</Link>
      </div>
    </div>
  );
}
