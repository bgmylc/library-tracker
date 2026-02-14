import type { ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function GlassCard({ children, className = "", variant = "default" }: { children: ReactNode; className?: string; variant?: "default" | "magenta" | "violet" | "coral" | "sky" }) {
  return <div className={cn("fgGlass", `fg-${variant}`, className)}>{children}</div>;
}

export function Button({ children, className = "", variant = "primary", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger" }) {
  return (
    <button className={cn("fgBtn", `fgBtn-${variant}`, className)} {...props}>
      {children}
    </button>
  );
}

export function MetricTile({ label, value, variant = "default" }: { label: string; value: string | number; variant?: "default" | "magenta" | "violet" | "coral" | "sky" }) {
  return (
    <div className={cn("fgMetric", `fg-${variant}`)}>
      <p>{label}</p>
      <strong>{value}</strong>
    </div>
  );
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="fgSearch">
      <svg className="fgSearchIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
      <input type="search" {...props} />
    </label>
  );
}

export function FilterChip({ label, count, active, onClick }: { label: string; count?: number; active?: boolean; onClick?: () => void }) {
  return (
    <button className={cn("fgChip", active && "isActive")} onClick={onClick} type="button">
      <span>{label}</span>
      {count !== undefined ? <em>{count}</em> : null}
    </button>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const mapped =
    status === "Finished"
      ? "finished"
      : status === "Reading"
        ? "reading"
        : status === "Paused"
          ? "paused"
          : status === "DNF"
            ? "dnf"
            : "not-started";
  return <span className={cn("fgStatus", `fgStatus-${mapped}`)}>{status}</span>;
}

export function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="fgProgressTrack">
      <div className="fgProgressFill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function BookCard({
  title,
  author,
  status,
  genre,
  purchaseYear,
  isOwned,
  progress,
  onEdit,
  onDelete,
}: {
  title: string;
  author: string;
  status: string;
  genre?: string;
  purchaseYear?: number | null;
  isOwned?: number | null;
  progress?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  return (
    <div className="fgBookCard">
      <div className="fgBookCover" />
      <div className="fgBookMain">
        <div className="fgBookHead">
          <div>
            <h4>{title}</h4>
            <p>{author}</p>
          </div>
          <div className="fgBookActions">
            {onEdit ? (
              <button type="button" className="fgIconAction" onClick={onEdit} aria-label="Edit book">
                <svg className="fgActionIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
            ) : null}
            {onDelete ? (
              <button type="button" className="fgIconAction fgIconDanger" onClick={onDelete} aria-label="Delete book">
                <svg className="fgActionIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            ) : null}
          </div>
        </div>
        <div className="fgBookMeta">
          <StatusBadge status={status} />
          {genre ? <span className="fgGenre">{genre}</span> : null}
          {purchaseYear ? <span className="fgGenre">Bought {purchaseYear}</span> : null}
          {isOwned === 1 ? <span className="fgGenre">At home</span> : null}
          {isOwned === 0 ? <span className="fgGenre">Storage box</span> : null}
        </div>
        {typeof progress === "number" && status === "Reading" ? (
          <div className="fgBookProgress">
            <div>
              <small>Progress</small>
              <small>{progress}%</small>
            </div>
            <ProgressBar value={progress} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
