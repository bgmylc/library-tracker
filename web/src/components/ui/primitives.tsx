import type { ReactNode } from "react";

export function PageHead({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="pageHead">
      <h1>{title}</h1>
      {subtitle ? <p className="meta">{subtitle}</p> : null}
    </header>
  );
}

export function GlassCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`glassCard ${className}`.trim()}>{children}</section>;
}

export function StatCard({ label, value, tone = "violet" }: { label: string; value: string | number; tone?: "violet" | "sky" | "coral" | "magenta" }) {
  return (
    <article className={`statCard tone-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const safe = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="progressTrack" aria-label="Progress">
      <div className="progressFill" style={{ width: `${safe}%` }} />
    </div>
  );
}
