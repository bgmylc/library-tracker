"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/http";
import { ProgressBar } from "@/components/ui/figma";
import { pushToast, ToastPresets } from "@/components/ui/toast-host";

type Book = {
  id: number;
  title: string;
  author: string | null;
  status: string;
  genre: string | null;
  purchase_year: number | null;
  is_owned: number | null;
  rating?: number | null;
};

type Filters = { statuses: string[]; genres: string[]; languages: string[]; purchase_years: number[] };

function statusClass(status: string) {
  if (status === "Reading") return "isReading";
  if (status === "Finished") return "isFinished";
  if (status === "Paused") return "isPaused";
  if (status === "DNF") return "isDnf";
  return "isTodo";
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [], purchase_years: [] });
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "", purchase_year: "", starts_with: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");

  async function loadBooks() {
    const params = new URLSearchParams({ ...query, page: String(page), page_size: String(pageSize), sort: "title", order: "asc" });
    const data = await fetchJson<{ items: Book[]; total: number }>(`/api/books?${params.toString()}`);
    setBooks(data.items);
    setTotal(data.total);
  }

  async function loadFilters() {
    setFilters(await fetchJson<Filters>("/api/filters"));
  }

  useEffect(() => {
    Promise.all([loadBooks(), loadFilters()]).catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadBooks().catch((e) => setError(e instanceof Error ? e.message : "Failed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query.search, query.status, query.genre, query.language, query.purchase_year, query.starts_with, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [query.search, query.status, query.genre, query.language, query.purchase_year, query.starts_with, pageSize]);

  async function removeBook(id: number) {
    if (!window.confirm("Delete this book?")) return;
    try {
      await fetchJson(`/api/books/${id}`, { method: "DELETE" });
      pushToast(ToastPresets.bookDeleted);
      await loadBooks();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
      pushToast(ToastPresets.error);
    }
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(total, page * pageSize);

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.status, (m.get(b.status) || 0) + 1);
    return m;
  }, [books]);

  return (
    <div className="fgScreen">
      <section className="fgPanel fgLibraryPanel">
        <div className="fgLibHeader">
          <div>
            <h2>Library</h2>
            <p>{total} books in your collection</p>
          </div>
          <Link href="/add" className="fgBtn fgBtn-primary">+ Add Book</Link>
        </div>

        <label className="fgSearch fgLibSearch">
          <svg className="fgSearchIcon" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            placeholder="Search by title, author, or genre..."
            value={query.search}
            onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
          />
        </label>

        <div className="fgChipRow">
          <button type="button" className={`fgChip ${query.status === "" ? "isActive" : ""}`} onClick={() => setQuery((q) => ({ ...q, status: "" }))}>All Books <em>{total}</em></button>
          {filters.statuses.map((s) => (
            <button key={s} type="button" className={`fgChip ${query.status === s ? "isActive" : ""}`} onClick={() => setQuery((q) => ({ ...q, status: s }))}>{s} <em>{statusCounts.get(s) || 0}</em></button>
          ))}
        </div>

        <div className="fgChipRow">
          {filters.genres.slice(0, 8).map((g) => (
            <button key={g} type="button" className={`fgChip ${query.genre === g ? "isActive" : ""}`} onClick={() => setQuery((q) => ({ ...q, genre: q.genre === g ? "" : g }))}>{g}</button>
          ))}
        </div>

        <div className="fgLibMetaControls">
          <select value={query.purchase_year} onChange={(e) => setQuery((q) => ({ ...q, purchase_year: e.target.value }))}>
            <option value="">All purchase years</option>
            {filters.purchase_years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={query.starts_with} onChange={(e) => setQuery((q) => ({ ...q, starts_with: e.target.value }))}>
            <option value="">All initials</option>
            {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((l) => <option key={l} value={l}>{l}</option>)}
            <option value="#">#</option>
          </select>
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="200">200 per page</option>
          </select>
        </div>
      </section>

      <div className="fgStack">
        {books.map((b, i) => {
          const progress = b.status === "Reading" ? (35 + (i % 4) * 15) : null;
          return (
            <article className="fgLibraryBookCard" key={b.id}>
              <div className={`fgBookCoverLg cover-${i % 2 === 0 ? "sky" : "violet"}`} />
              <div className="fgLibraryBookMain">
                <div className="fgLibraryRowTop">
                  <div>
                    <h3>{b.title}</h3>
                    <p>{b.author || "Unknown author"}</p>
                  </div>
                  <div className="fgLibraryActions">
                    <Link className="fgBtn fgBtn-ghost" href={`/add?id=${b.id}`}>Edit</Link>
                    <button type="button" className="fgBtn fgBtn-danger" onClick={() => removeBook(b.id)}>Delete</button>
                  </div>
                </div>
                <div className="fgBookMeta">
                  <span className={`fgStatus ${statusClass(b.status)}`}>{b.status}</span>
                  {b.genre ? <span className="fgGenre">{b.genre}</span> : null}
                  {b.purchase_year ? <span className="fgGenre">Bought {b.purchase_year}</span> : null}
                  {b.is_owned === 1 ? <span className="fgGenre">At home</span> : null}
                  {b.is_owned === 0 ? <span className="fgGenre">Storage box</span> : null}
                </div>
                {progress !== null ? (
                  <div className="fgReadingProgressBlock">
                    <div>
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <ProgressBar value={progress} />
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      <div className="fgPagination">
        <p className="fgMuted">Showing {startIdx}-{endIdx} of {total}</p>
        <div className="fgPageActions">
          <button type="button" className="fgBtn fgBtn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Previous</button>
          <span className="fgPageLabel">Page {page} / {totalPages}</span>
          <button type="button" className="fgBtn fgBtn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</button>
        </div>
      </div>

      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}
