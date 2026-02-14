"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchJson } from "@/lib/http";
import { BookCard, FilterChip, GlassCard, SearchInput } from "@/components/ui/figma";

type Book = {
  id: number;
  title: string;
  author: string | null;
  status: string;
  genre: string | null;
  purchase_year: number | null;
  is_owned: number | null;
};

type Filters = { statuses: string[]; genres: string[]; languages: string[]; purchase_years: number[] };

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [filters, setFilters] = useState<Filters>({ statuses: [], genres: [], languages: [], purchase_years: [] });
  const [query, setQuery] = useState({ search: "", status: "", genre: "", language: "", purchase_year: "", starts_with: "" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
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
    await fetchJson(`/api/books/${id}`, { method: "DELETE" });
    await loadBooks();
  }

  const statusCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const b of books) m.set(b.status, (m.get(b.status) || 0) + 1);
    return m;
  }, [books]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const startIdx = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(total, page * pageSize);

  return (
    <div className="fgScreen">
      <header className="fgHeader">
        <h2>Library</h2>
        <p>{total} books in your collection</p>
      </header>

      <GlassCard className="fgStack">
        <SearchInput
          placeholder="Search by title, author, or genre..."
          value={query.search}
          onChange={(e) => setQuery((q) => ({ ...q, search: e.target.value }))}
        />

        <div className="fgChipRow">
          <FilterChip label="All Books" count={books.length} active={!query.status} onClick={() => setQuery((q) => ({ ...q, status: "" }))} />
          {filters.statuses.map((s) => (
            <FilterChip key={s} label={s} count={statusCounts.get(s) || 0} active={query.status === s} onClick={() => setQuery((q) => ({ ...q, status: s }))} />
          ))}
        </div>

        <div className="fgLetterRow">
          <button type="button" className={`fgLetterChip ${query.starts_with === "" ? "isActive" : ""}`} onClick={() => setQuery((q) => ({ ...q, starts_with: "" }))}>
            All
          </button>
          {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => (
            <button
              key={letter}
              type="button"
              className={`fgLetterChip ${query.starts_with === letter ? "isActive" : ""}`}
              onClick={() => setQuery((q) => ({ ...q, starts_with: letter }))}
            >
              {letter}
            </button>
          ))}
          <button type="button" className={`fgLetterChip ${query.starts_with === "#" ? "isActive" : ""}`} onClick={() => setQuery((q) => ({ ...q, starts_with: "#" }))}>
            #
          </button>
        </div>

        <div className="fgFilterRow">
          <select value={query.genre} onChange={(e) => setQuery((q) => ({ ...q, genre: e.target.value }))}>
            <option value="">All genres</option>
            {filters.genres.map((g) => <option key={g}>{g}</option>)}
          </select>
          <select value={query.language} onChange={(e) => setQuery((q) => ({ ...q, language: e.target.value }))}>
            <option value="">All languages</option>
            {filters.languages.map((l) => <option key={l}>{l}</option>)}
          </select>
          <select value={query.purchase_year} onChange={(e) => setQuery((q) => ({ ...q, purchase_year: e.target.value }))}>
            <option value="">All purchase years</option>
            {filters.purchase_years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select value={String(pageSize)} onChange={(e) => setPageSize(Number(e.target.value))}>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
            <option value="200">200 per page</option>
          </select>
        </div>
      </GlassCard>

      <div className="fgStack">
        {books.map((b) => (
          <BookCard
            key={b.id}
            title={b.title}
            author={b.author || "Unknown author"}
            status={b.status}
            genre={b.genre || undefined}
            purchaseYear={b.purchase_year}
            isOwned={b.is_owned}
            onEdit={() => (window.location.href = `/add?id=${b.id}`)}
            onDelete={() => removeBook(b.id)}
          />
        ))}
      </div>

      <div className="fgPagination">
        <p className="fgMuted">Showing {startIdx}-{endIdx} of {total}</p>
        <div className="fgPageActions">
          <button type="button" className="fgBtn fgBtn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </button>
          <span className="fgPageLabel">Page {page} / {totalPages}</span>
          <button type="button" className="fgBtn fgBtn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
            Next
          </button>
        </div>
      </div>

      {error ? <p className="fgError">Error: {error}</p> : null}
    </div>
  );
}
